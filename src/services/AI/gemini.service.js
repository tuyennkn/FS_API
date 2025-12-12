// src/services/gemini.service.js
import { GoogleGenerativeAI } from '@google/generative-ai'
import { env } from '../../config/environment.js'

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)

// Dùng model nhẹ để tiết kiệm quota
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })

/**
 * Retry wrapper với exponential backoff
 * @param {Function} fn - Hàm cần retry
 * @param {number} maxRetries - Số lần retry tối đa
 * @param {number} initialDelay - Delay ban đầu (ms)
 * @returns {Promise} - Kết quả của hàm
 */
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Kiểm tra nếu là lỗi rate limit (429) hoặc quota exceeded
      const isRateLimitError = 
        error?.status === 429 || 
        error?.message?.includes('quota') ||
        error?.message?.includes('rate limit') ||
        error?.message?.includes('RESOURCE_EXHAUSTED');
      
      // Nếu không phải lỗi rate limit, throw ngay
      if (!isRateLimitError) {
        throw error;
      }
      
      // Nếu đã hết retry, throw error
      if (attempt === maxRetries) {
        console.error(`Failed after ${maxRetries} retries:`, error.message);
        throw error;
      }
      
      // Tính thời gian delay với exponential backoff
      const delay = initialDelay * Math.pow(2, attempt);
      const jitter = Math.random() * 1000; // Thêm random jitter để tránh thundering herd
      const totalDelay = delay + jitter;
      
      console.log(`Rate limit hit, retrying in ${Math.round(totalDelay)}ms (attempt ${attempt + 1}/${maxRetries})...`);
      
      await new Promise(resolve => setTimeout(resolve, totalDelay));
    }
  }
  
  throw lastError;
}

// Hàm kiểm tra text
export async function moderateText(text) {
  const prompt = `
  Bạn là bộ lọc nội dung.
  Kiểm tra đoạn văn sau có phản cảm, tục tĩu, bạo lực, phân biệt chủng tộc hay nội dung 18+ không.
  Trả lời chỉ với: "SAFE" hoặc "UNSAFE".
  Text: "${text}"
  `
  const result = await model.generateContent(prompt);
  const output = result.response.text()
  if (output === 'SAFE') return true
  if (output === 'UNSAFE') return false
}

// Hàm kiểm tra ảnh (nhận base64 hoặc buffer)
export async function moderateImage(base64Image) {
  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Image
      }
    },
    {
      text: `
      Bạn là bộ lọc nội dung.
      Kiểm tra ảnh này có chứa nội dung phản cảm (khỏa thân, khiêu dâm, bạo lực, máu me...) hay không.
      Trả lời chỉ với: "SAFE" hoặc "UNSAFE".
      `
    }
  ])

  const output = result.response.text()
  if (output === 'SAFE') return true
  if (output === 'UNSAFE') return false
}

/**
 * Biến câu truy vấn phức tạp thành câu truy vấn đơn giản
 * @param {string} query - Câu truy vấn phức tạp
 * @returns {Promise<Object>} - Câu truy vấn đơn giản dưới dạng JSON { isMeaningless: boolean, simplifiedQuery: string }
 */
export async function simplifyQuery(query) {
  const prompt = `
Bạn là trợ lý tìm kiếm sách.
Nhiệm vụ: Biến câu truy vấn phức tạp sau thành câu truy vấn ngắn gọn, dễ hiểu.
Nếu câu truy vấn vô nghĩa hoặc không liên quan đến sách, chỉ trả về JSON:
{"isMeaningless": true, "simplifiedQuery": ""}

Ngược lại, trả về JSON:
{"isMeaningless": false, "simplifiedQuery": "<truy vấn rút gọn>"}

Chỉ trả về JSON hợp lệ, không viết thêm gì khác.
Câu truy vấn: "${query}"
`;

  const result = await model.generateContent(prompt);
  // result.response.text trả về string json```json
  // {"isMeaningless": false, "simplifiedQuery": "Sách trinh thám"}
  // ```
  const output = result.response.text()

  // Loại bỏ các ký tự không cần thiết
  const cleanedOutput = output.replace(/```json|```/g, '').trim();

  return JSON.parse(cleanedOutput);
}

// Hàm phân tích category từ genre, title, description sách
export async function analyzeCategoryFromGenre(
  genre,
  title,
  author,
  existingCategories = []
) {
  const categoriesList = existingCategories.map(c => `"${c.name}"`).join(", ");

  const prompt = `
  Bạn là hệ thống phân tích và phân loại sách ở mức rất khắt khe.

  Danh sách thể loại hợp lệ: [${categoriesList}]

  Nhiệm vụ: đánh giá xem cuốn sách sau đây có phù hợp với BẤT KỲ thể loại nào hay không:
  - Thể loại gốc: "${genre}"
  - Tiêu đề: "${title}"
  - Tác giả: "${author}"

  Bạn phải chấm điểm từng category theo các tiêu chí sau (tổng 100 điểm):
  - Mức độ liên quan của nội dung: 40 điểm
  - Tông giọng & phong cách: 20 điểm
  - Người đọc mục tiêu: 20 điểm
  - Chủ đề lớn: 20 điểm

  Sau đó:
  - Lấy category có điểm cao nhất.
  - Nếu điểm < 60 → xem là KHÔNG PHÙ HỢP → bạn phải tạo category mới.
  - Nếu điểm ≥ 60 → chọn category đó.

  QUAN TRỌNG: Chỉ trả về JSON hợp lệ theo định dạng sau, không thêm gì khác:
  {
    "isNew": boolean,
    "name": "Tên category hoặc category mới",
    "description": "Mô tả ngắn về category, không phải mô tả sách"
  }
  `;

  // Sử dụng retry với backoff để xử lý rate limit
  const text = await retryWithBackoff(async () => {
    const response = await model.generateContent(prompt);
    return response.response.text();
  }, 3, 2000); // 3 retries, bắt đầu với 2s delay

  console.log('analyzeCategoryFromGenre output:', text);

  return text;
}

/**
 * Generate text using Gemini AI
 * @param {string} prompt - The prompt to send to Gemini
 * @returns {Promise<string>} - The generated text response
 */
export async function generateText(prompt) {
  try {
    const result = await model.generateContent(prompt);
    const output = result.response.text();
    return output;
  } catch (error) {
    console.error('Gemini AI error:', error);
    throw new Error('Failed to generate AI response');
  }
}

/**
 * Đánh giá mức độ phù hợp của sách với persona người dùng
 * @param {Object} book - Thông tin sách {title, description, price, genre}
 * @param {string} userPersona - Persona của người dùng
 * @returns {Promise<Object>} - {level: 'warning' | 'explore' | 'highly-recommend', reason: string}
 */
export async function evaluateBookForUser(book, userPersona) {
  const prompt = `
Bạn là hệ thống đánh giá và đề xuất sách thông minh.

Thông tin sách:
- Tiêu đề: "${book.title}"
- Mô tả: "${book.description}"
- Thể loại: "${book.genre}"
- Giá: ${book.price} VND

Persona người dùng:
"${userPersona || 'Chưa có thông tin về sở thích người dùng'}"

Nhiệm vụ: Đánh giá mức độ phù hợp của cuốn sách với người dùng và phân loại vào 1 trong 3 cấp độ:

1. **warning**: Sách có chứa nội dung nhạy cảm hoặc không phù hợp với số đông
   - Bạo lực, máu me, kinh dị
   - Nội dung LGBT+, đồng tính
   - Nội dung tình dục, 18+
   - Chính trị, tôn giáo gây tranh cãi
   - Ngôn ngữ thô tục
   
2. **explore**: Sách chứa nội dung MỚI MẺ mà người dùng CHƯA từng tiếp xúc
   - Thể loại hoàn toàn khác với sở thích hiện tại
   - Chủ đề mà persona chưa đề cập
   - Có thể mở rộng chân trời đọc sách
   - Đề xuất người dùng thử nghiệm
   
3. **highly-recommend**: Sách PHÙ HỢP VÀ ĐÚNG SỞ THÍCH của người dùng
   - Khớp với thể loại yêu thích trong persona
   - Nội dung liên quan đến sở thích đã biết
   - Tác giả hoặc phong cách quen thuộc
   - Chắc chắn người dùng sẽ thích

Lưu ý:
- Nếu không có persona, ưu tiên phân loại dựa vào nội dung sách
- Reason phải ngắn gọn (2-3 câu), KHÔNG sử dụng emoji
- Reason phải bằng tiếng Việt, dễ hiểu

Trả về JSON hợp lệ:
{
  "level": "warning" | "explore" | "highly-recommend",
  "reason": "Lý do bằng tiếng Việt"
}
`;

  try {
    const result = await model.generateContent(prompt);
    const output = result.response.text();
    
    // Clean output
    const cleanedOutput = output.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanedOutput);
    
    // Validate response
    if (!['warning', 'explore', 'highly-recommend'].includes(parsed.level)) {
      throw new Error('Invalid level returned');
    }
    
    return parsed;
  } catch (error) {
    console.error('Error evaluating book for user:', error);
    // Fallback response
    return {
      level: 'explore',
      reason: 'Không thể đánh giá mức độ phù hợp lúc này.'
    };
  }
}