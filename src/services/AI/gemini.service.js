// src/services/gemini.service.js
import { GoogleGenerativeAI } from '@google/generative-ai'
import { env } from '../../config/environment.js'

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)

// Dùng model nhẹ để tiết kiệm quota
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })

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
export async function analyzeCategoryFromGenre(genre, title, author) {
  const prompt = `
  Bạn là trợ lý phân loại sách.
  Phân tích thể loại sách từ thể loại: "${genre}", tiêu đề: "${title}", tác giả: "${author}".
  Chỉ trả về duy nhất một tên thể loại phù hợp nhất và mô tả đề xuất cho thể loại đó, định dang json gồm 2 trường name, description. Không giải thích gì thêm.
  `
  const result = await model.generateContent(prompt);
  const output = result.response.text()
  return output
}