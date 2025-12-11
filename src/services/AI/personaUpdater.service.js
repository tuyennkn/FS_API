// src/services/AI/personaUpdater.service.js
import { generateText } from './gemini.service.js';
import User from '../../models/User.js';

/**
 * Update user persona based on their interaction with AI
 * @param {String} userId - User ID
 * @param {String} currentPersona - Current user persona (may be empty)
 * @param {String} interactionContext - Context of the current interaction
 * @param {String} interactionType - Type of interaction (search, compare, etc.)
 * @returns {Promise<String>} - Updated persona
 */
export async function updateUserPersona(userId, currentPersona = '', interactionContext, interactionType) {
  try {
    if (!userId || !interactionContext) {
      console.log('Missing userId or context, skipping persona update');
      return currentPersona;
    }

    // Generate new persona using AI
    const prompt = `
Bạn là trợ lý phân tích hành vi người dùng.

THÔNG TIN HIỆN TẠI:
- Hồ sơ người dùng hiện tại: ${currentPersona || 'Chưa có thông tin'}
- Loại tương tác: ${interactionType}
- Nội dung tương tác: ${interactionContext}

NHIỆM VỤ:
Dựa vào hồ sơ hiện tại và tương tác mới, hãy tạo/cập nhật hồ sơ người dùng.

QUY TẮC:
1. Tối đa 300 chữ
2. Tập trung vào sở thích, thói quen đọc, mục đích tìm kiếm
3. Nếu chưa có hồ sơ cũ: tạo mới dựa trên tương tác
4. Nếu đã có hồ sơ cũ: bổ sung thông tin mới, loại bỏ thông tin cũ không còn phù hợp
5. Viết ngắn gọn, súc tích, tránh lặp lại
6. Chỉ mô tả những gì rõ ràng từ dữ liệu, không suy đoán quá mức

VÍ DỤ HỒ SƠ TỐT:
"Thích sách trinh thám, kinh dị. Quan tâm đến tác phẩm của Stephen King và Agatha Christie. Thường so sánh giá cả trước khi quyết định. Ưu tiên sách có đánh giá cao."

TRẢ VỀ CHỈ HỒ SƠ NGƯỜI DÙNG, KHÔNG GIẢI THÍCH GÌ THÊM.
`;

    const newPersona = await generateText(prompt);
    
    // Clean up response (remove quotes, trim)
    const cleanedPersona = newPersona
      .replace(/^["']|["']$/g, '')
      .trim()
      .substring(0, 300); // Ensure max 300 chars

    // Save to database
    if (userId) {
      await User.findByIdAndUpdate(
        userId,
        { persona: cleanedPersona },
        { new: true }
      );
      console.log(`✅ Updated persona for user ${userId}`);
    }

    return cleanedPersona;

  } catch (error) {
    console.error('Error updating persona:', error);
    // Return current persona if update fails
    return currentPersona;
  }
}

/**
 * Build interaction context for persona update
 * @param {String} type - Type: 'search', 'compare'
 * @param {Object} data - Data object with relevant info
 * @returns {String} - Formatted context string
 */
export function buildInteractionContext(type, data) {
  switch (type) {
    case 'search':
      return `Tìm kiếm: "${data.query}"${data.results ? ` (${data.results} kết quả)` : ''}`;
    
    case 'compare':
      const books = data.books?.map(b => b.title).join(', ') || '';
      return `So sánh các sách: ${books}. ${data.query ? `Tiêu chí: ${data.query}` : ''}`;
    
    default:
      return JSON.stringify(data);
  }
}
