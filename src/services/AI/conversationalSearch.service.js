// src/services/AI/conversationalSearch.service.js
import { generateText } from './gemini.service.js';

/**
 * Conversational Search Service
 * Handles multi-turn conversations to understand user's search intent
 */

/**
 * Process search conversation turn
 * @param {String} userQuery - Current user query
 * @param {Array} conversationHistory - Previous conversation turns [{role: 'user'|'assistant', content: ''}]
 * @param {String} userPersona - User persona for context (optional)
 * @returns {Object} { needsClarification, question, simplifiedQuery, conversationSummary }
 */
export async function processSearchConversation(userQuery, conversationHistory = [], userPersona = '') {
  try {
    // Build conversation context (summarized if too long)
    let contextSummary = '';
    if (conversationHistory.length > 0) {
      contextSummary = await summarizeConversation(conversationHistory);
    }

    // Ask AI to analyze if we have enough info to search
    const analysisPrompt = `
Bạn là trợ lý tìm kiếm sách thông minh.
${contextSummary ? `NGỮ CẢNH CUỘC TRÒ CHUYỆN:\n${contextSummary}\n` : ''}
NGƯỜI DÙNG VỪA NÓI: "${userQuery}"

NHIỆM VỤ:
Phân tích ý định người dùng và quyết định hành động:

QUAN TRỌNG - QUY TẮC:
1. Nếu người dùng MUỐN TÌM NGAY (dù chưa rõ tiêu chí) → TÌM LUÔN với query tốt nhất có thể
2. CHỈ hỏi khi người dùng THẬT SỰ không biết phải làm gì (VD: "gợi ý gì cho tôi?", "bạn nghĩ sao?")
3. KHÔNG hỏi về tác giả, tác phẩm cụ thể - hãy tìm theo thể loại/tiêu chí chung
4. Hồ sơ người dùng không ảnh hưởng kết quả tìm kiếm, không dựa vào đó để ảnh hưởng đến nội dung tìm kiếm, chỉ dùng để hiểu sở thích

DẤU HIỆU MUỐN TÌM NGAY (needsClarification = FALSE):
- Có từ khóa hành động: "tìm", "search", "cho tôi", "có gì", "muốn đọc", "đọc gì"
- Đã nói thể loại (dù chung chung): "sách hay", "sách mới", "trinh thám", "kinh dị"
- Có tiêu chí: "cho người mới", "giá rẻ", "dễ đọc"
- Ngẫu hứng: "tìm gì đó", "bất kỳ", "random"
→ ACTION: Tạo query tìm kiếm dựa trên info hiện có

CHỈ HỎI KHI (needsClarification = TRUE):
- Câu thoại đầu tiên của người dùng có mục đích giao tiếp
- Người dùng thật sự bối rối: "tôi không biết", "gợi ý gì cho tôi?"
- Câu hỏi mở không có action: "bạn nghĩ sao?", "nên thế nào?"
- Yêu cầu tư vấn: "tôi nên chọn gì?"
- Hoặc chỉ đang có những câu giao tiếp xã giao: "chào bạn", "cảm ơn"
→ ACTION: Đặt 1 câu hỏi ngắn gọn (max 80 chữ)

VÍ DỤ:

Input: "tôi muốn đọc sách"
Context: Hồ sơ = "Thích kinh dị, Stephen King"
Output: {
  "needsClarification": false,
  "question": "",
  "simplifiedQuery": "sách kinh dị Stephen King",
  "reason": "User muốn đọc, có persona → tìm theo sở thích"
}

Input: "tìm sách hay"
Context: Hồ sơ = ""
Output: {
  "needsClarification": false,
  "question": "",
  "simplifiedQuery": "sách hay đánh giá cao",
  "reason": "User muốn tìm → tìm sách rating cao"
}

Input: "sách trinh thám"
Output: {
  "needsClarification": false,
  "question": "",
  "simplifiedQuery": "sách trinh thám",
  "reason": "Đã rõ thể loại"
}

Input: "tôi không biết nên đọc gì"
Output: {
  "needsClarification": true,
  "question": "Bạn có thích thể loại nào không? VD: trinh thám, kinh dị, tâm lý...",
  "simplifiedQuery": "",
  "reason": "User thật sự bối rối, cần gợi ý"
}

Input: "tìm ngẫu nhiên"
Output: {
  "needsClarification": false,
  "question": "",
  "simplifiedQuery": "sách bán chạy mới nhất",
  "reason": "User muốn tìm random → trả về bestseller"
}

TRẢ VỀ JSON (không thêm markdown):
{
  "needsClarification": true/false,
  "question": "Câu hỏi (nếu cần, max 80 chữ)",
  "simplifiedQuery": "Query tìm kiếm mà người dùng vừa nói nếu không cần hỏi thêm, ngược lại có ngữ cảnh trò chuyện thì tóm tắt ngữ cảnh đó thành query tìm kiếm",
  "reason": "Lý do"
}
`;

    const response = await generateText(analysisPrompt);
    const parsed = parseAIResponse(response);

    return {
      needsClarification: parsed.needsClarification,
      question: parsed.question || null,
      simplifiedQuery: parsed.simplifiedQuery || null,
      reason: parsed.reason || '',
      conversationSummary: contextSummary
    };

  } catch (error) {
    console.error('Conversational search error:', error);
    // Fallback: if user wants to search, search with basic query
    // Check if query has action words
    const hasActionWords = /tìm|search|cho tôi|có|muốn|đọc/i.test(userQuery);
    
    if (hasActionWords) {
      return {
        needsClarification: false,
        question: null,
        simplifiedQuery: userQuery,
        reason: 'Error occurred, but user wants to search - using original query',
        conversationSummary: ''
      };
    }
    
    // Otherwise ask a simple question
    return {
      needsClarification: true,
      question: 'Bạn muốn tìm sách thể loại gì? (VD: trinh thám, kinh dị, tiểu thuyết...)',
      simplifiedQuery: null,
      reason: 'Error occurred, asking for genre',
      conversationSummary: ''
    };
  }
}

/**
 * Summarize conversation history to save tokens
 * @param {Array} history - Conversation history
 * @returns {String} Summarized context
 */
async function summarizeConversation(history) {
  if (history.length === 0) return '';
  
  // If short history, return as-is
  if (history.length <= 2) {
    return history.map(turn => 
      `${turn.role === 'user' ? 'User' : 'AI'}: ${turn.content}`
    ).join('\n');
  }

  // Summarize longer conversations
  const conversationText = history.map(turn => 
    `${turn.role === 'user' ? 'User' : 'AI'}: ${turn.content}`
  ).join('\n');

  const summaryPrompt = `
Tóm tắt cuộc hội thoại sau thành 1-2 câu ngắn gọn, giữ lại thông tin quan trọng về sở thích sách của người dùng:

${conversationText}

CHỈ TRẢ VỀ TÓM TẮT, KHÔNG GIẢI THÍCH:
`;

  const summary = await generateText(summaryPrompt);
  return summary.trim();
}

/**
 * Parse AI JSON response with fallback
 * @param {String} response - AI response
 * @returns {Object} Parsed object
 */
function parseAIResponse(response) {
  try {
    // Remove markdown code blocks
    const cleaned = response.replace(/```json|```/g, '').trim();
    
    // Try to extract JSON
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error('No JSON found');
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    // Fallback
    return {
      needsClarification: false,
      question: '',
      simplifiedQuery: '',
      reason: 'Parse error'
    };
  }
}

/**
 * Build conversation history object
 * @param {String} role - 'user' or 'assistant'
 * @param {String} content - Message content
 * @returns {Object} Conversation turn
 */
export function createConversationTurn(role, content) {
  return {
    role,
    content,
    timestamp: new Date().toISOString()
  };
}
