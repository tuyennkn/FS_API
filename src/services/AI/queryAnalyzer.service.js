// src/services/AI/queryAnalyzer.service.js
import { GoogleGenerativeAI } from '@google/generative-ai'
import { env } from '../../config/environment.js'

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })

/**
 * Phân tích query để xác định loại tìm kiếm và trích xuất filters
 * @param {string} query - Query từ người dùng
 * @param {Array} availableCategories - Danh sách category có sẵn
 * @returns {Promise<Object>} - Object chứa queryType, searchQuery, filters
 */
export async function analyzeSearchQuery(query, availableCategories = []) {
  const categoriesList = availableCategories.map(c => `"${c.name}" (ID: ${c._id})`).join(", ");

  const prompt = `
Bạn là hệ thống phân tích truy vấn tìm kiếm sách thông minh.

NHIỆM VỤ:
1. Phân tích query của người dùng để xác định loại tìm kiếm:
   - "VECTOR_SEARCH": Khi query là mô tả trừu tượng, cảm xúc, ý tưởng (VD: "sách hay về tình yêu", "truyện buồn", "sách giúp tôi cải thiện bản thân")
   - "KEYWORD_SEARCH": Khi query là từ khóa cụ thể, tên sách, tác giả, thể loại rõ ràng (VD: "Harry Potter", "Nguyễn Nhật Ánh", "sách kinh doanh giá dưới 100k")

2. Nếu là KEYWORD_SEARCH, trích xuất các filter từ query (nếu có):
   - category: ID của category (từ danh sách bên dưới)
   - minPrice: Giá tối thiểu (số nguyên)
   - maxPrice: Giá tối đa (số nguyên)
   - Các từ khóa tìm kiếm còn lại sau khi trích xuất filter

3. Làm sạch query để tạo searchQuery tối ưu cho vector hoặc keyword search

DANH SÁCH CATEGORY HỢP LỆ:
${categoriesList || "Không có category"}

INPUT:
Query: "${query}"

OUTPUT (chỉ trả về JSON hợp lệ, không thêm markdown hay text khác):
{
  "queryType": "VECTOR_SEARCH" hoặc "KEYWORD_SEARCH",
  "searchQuery": "query đã làm sạch và tối ưu",
  "filters": {
    "category": "ID của category hoặc null",
    "minPrice": số hoặc null,
    "maxPrice": số hoặc null
  }
}

CHÚ Ý:
- Nếu là VECTOR_SEARCH, filters phải là object rỗng {}
- Nếu query không đề cập đến filter nào, để giá trị null
- searchQuery phải được làm sạch khỏi các filter đã trích xuất
- Giá tiền hiểu theo đơn vị VND (VD: "100k" = 100000, "1 triệu" = 1000000)

VÍ DỤ:
Input: "sách kinh doanh giá dưới 200k"
Output: {"queryType": "KEYWORD_SEARCH", "searchQuery": "sách kinh doanh", "filters": {"category": null, "minPrice": null, "maxPrice": 200000}}

Input: "tìm sách hay về tình yêu"  
Output: {"queryType": "VECTOR_SEARCH", "searchQuery": "sách hay về tình yêu", "filters": {}}

Input: "Harry Potter"
Output: {"queryType": "KEYWORD_SEARCH", "searchQuery": "Harry Potter", "filters": {"category": null, "minPrice": null, "maxPrice": null}}
`;

  try {
    const result = await model.generateContent(prompt);
    const output = result.response.text();

    // Loại bỏ markdown code block nếu có
    const cleanedOutput = output.replace(/```json|```/g, '').trim();
    
    const parsedResult = JSON.parse(cleanedOutput);

    // Validate kết quả
    if (!parsedResult.queryType || !['VECTOR_SEARCH', 'KEYWORD_SEARCH'].includes(parsedResult.queryType)) {
      throw new Error('Invalid queryType');
    }

    // Đảm bảo filters tồn tại
    if (!parsedResult.filters) {
      parsedResult.filters = {};
    }

    // Nếu là VECTOR_SEARCH, đảm bảo không có filters
    if (parsedResult.queryType === 'VECTOR_SEARCH') {
      parsedResult.filters = {};
    }

    return parsedResult;
  } catch (error) {
    console.error('Error analyzing query:', error);
    // Fallback: coi như KEYWORD_SEARCH không filter
    return {
      queryType: 'KEYWORD_SEARCH',
      searchQuery: query,
      filters: {
        category: null,
        minPrice: null,
        maxPrice: null
      }
    };
  }
}

/**
 * Kiểm tra query có ý nghĩa không
 * @param {string} query - Query cần kiểm tra
 * @returns {Promise<boolean>} - true nếu có ý nghĩa, false nếu vô nghĩa
 */
export async function isMeaningfulQuery(query) {
  const prompt = `
Bạn là hệ thống kiểm tra query tìm kiếm.

Kiểm tra xem query sau có ý nghĩa và liên quan đến việc tìm kiếm sách không:
"${query}"

Trả về JSON:
{"isMeaningful": true} - nếu query có ý nghĩa
{"isMeaningful": false} - nếu query vô nghĩa, spam, hoặc không liên quan

Chỉ trả về JSON, không thêm text khác.
`;

  try {
    const result = await model.generateContent(prompt);
    const output = result.response.text();
    const cleanedOutput = output.replace(/```json|```/g, '').trim();
    const parsedResult = JSON.parse(cleanedOutput);
    
    return parsedResult.isMeaningful === true;
  } catch (error) {
    console.error('Error checking query meaning:', error);
    // Fallback: coi như có ý nghĩa
    return true;
  }
}
