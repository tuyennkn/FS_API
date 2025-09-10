// src/services/gemini.service.js
import { GoogleGenerativeAI } from '@google/generative-ai'
import { env } from '~/config/environment'

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)

// Dùng model nhẹ để tiết kiệm quota
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

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

// Hàm biến query phức tạp thành câu truy vấn đơn giản
export async function simplifyQuery(query) {
  const prompt = `
  Bạn là trợ lý tìm kiếm sách.
  Biến câu truy vấn phức tạp sau thành câu truy vấn đơn giản, ngắn gọn, dễ hiểu.
  Chỉ trả về câu truy vấn, không giải thích gì thêm.
  Câu truy vấn: "${query}"
  `
  const result = await model.generateContent(prompt);
  const output = result.response.text()
  return output
} 