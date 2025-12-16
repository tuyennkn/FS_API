import { generateText } from './gemini.service.js';
import { generateEmbedding } from './embedding.service.js';
import Comment from '../../models/Comment.js';

/**
 * Retrieve relevant comments for products using semantic search (RAG - Retrieval Augmented Generation)
 * @param {Array} productIds - Array of product IDs to retrieve comments for
 * @param {String} query - User's comparison query for semantic search
 * @param {Array} products - Array of products (for fallback embedding generation)
 * @param {Number} limit - Maximum number of comments per product
 * @returns {Object} Comments grouped by product ID
 */
async function retrieveRelevantComments(productIds, query = '', products = [], limit = 5) {
  try {
    const commentsMap = {};

    // Generate query embedding for semantic search
    let queryEmbedding = null;
    
    if (query) {
      // Use user's query for semantic search
      try {
        queryEmbedding = await generateEmbedding(query);
      } catch (error) {
        console.error('Error generating query embedding:', error);
      }
    }

    for (const productId of productIds) {
      let comments = [];

      if (queryEmbedding) {
        // Use MongoDB Atlas Vector Search for semantic retrieval
        try {
          comments = await Comment.aggregate([
            {
              $vectorSearch: {
                index: 'default', // Tên index bạn đã tạo trong Atlas
                path: 'embedding',
                queryVector: queryEmbedding,
                numCandidates: 50, // Số candidates để search
                limit: limit,
                filter: {
                  book_id: productId,
                  isDisabled: false,
                  comment: { $exists: true, $ne: '' }
                }
              }
            },
            {
              $addFields: {
                score: { $meta: 'vectorSearchScore' } // Thêm similarity score
              }
            },
            {
              $lookup: {
                from: 'users',
                localField: 'user_id',
                foreignField: '_id',
                as: 'user'
              }
            },
            {
              $unwind: {
                path: '$user',
                preserveNullAndEmptyArrays: true
              }
            },
            {
              $project: {
                rating: 1,
                comment: 1,
                userName: { $ifNull: ['$user.name', 'Anonymous'] },
                createdAt: 1,
                score: 1
              }
            }
          ]);

          console.log(`Found ${comments.length} semantically relevant comments for product ${productId}`);
        } catch (vectorError) {
          console.error('Vector search error, falling back to regular search:', vectorError);
          // Fallback to regular search if vector search fails
          queryEmbedding = null;
        }
      }

      // Fallback: Regular search by rating if no query or vector search failed
      if (!queryEmbedding || comments.length === 0) {
        comments = await Comment.find({ 
          book_id: productId,
          isDisabled: false,
          comment: { $exists: true, $ne: '' }
        })
          .sort({ rating: -1, createdAt: -1 })
          .limit(limit)
          .populate('user_id', 'name')
          .lean();

        comments = comments.map(c => ({
          rating: c.rating,
          comment: c.comment,
          userName: c.user_id?.name || 'Anonymous',
          createdAt: c.createdAt,
          score: null // No semantic score for regular search
        }));
      }

      commentsMap[productId.toString()] = comments.map(c => ({
        rating: c.rating,
        comment: c.comment,
        userName: c.userName,
        date: c.createdAt,
        relevanceScore: c.score ? c.score.toFixed(3) : null
      }));
    }

    return commentsMap;
  } catch (error) {
    console.error('Error retrieving comments for RAG:', error);
    return {};
  }
}

/**
 * Format comments for AI prompt
 * @param {Object} commentsMap - Comments grouped by product ID
 * @param {Array} products - Array of products
 * @param {Boolean} hasSemanticSearch - Whether semantic search was used
 * @returns {String} Formatted comment text
 */
function formatCommentsForPrompt(commentsMap, products, hasSemanticSearch = false) {
  let formatted = '\n━━━ ĐÁNH GIÁ TỪ NGƯỜI DÙNG (RAG Context';
  formatted += hasSemanticSearch ? ' - Semantic Search' : '';
  formatted += ') ━━━\n';

  products.forEach((product, index) => {
    const productComments = commentsMap[product._id?.toString()] || [];
    
    if (productComments.length > 0) {
      formatted += `\nSách ${index + 1} - "${product.title}":\n`;
      productComments.forEach((c, i) => {
        const scoreText = c.relevanceScore ? ` (Relevance: ${c.relevanceScore})` : '';
        formatted += `  ${i + 1}. [${c.rating}⭐]${scoreText} ${c.userName}: "${c.comment}"\n`;
      });
    } else {
      formatted += `\nSách ${index + 1} - "${product.title}": Chưa có đánh giá\n`;
    }
  });

  return formatted;
}

/**
 * Compare products using AI with optional user persona and comparison criteria
 * @param {Array} products - Array of product objects to compare
 * @param {String} query - User's comparison query (optional)
 * @param {String} userPersona - User persona for personalized recommendations (optional)
 * @param {Array} selectedOptions - Selected comparison options from previous step (optional)
 * @returns {Object} Comparison result with recommendations
 */
export async function compareProducts(products, query = '', userPersona = '', selectedOptions = []) {
  try {
    // Validate input
    if (!products || products.length < 2) {
      return {
        success: false,
        needsMoreInfo: false,
        message: 'Cần ít nhất 2 sản phẩm để so sánh'
      };
    }

    if (products.length > 5) {
      return {
        success: false,
        needsMoreInfo: false,
        message: 'Chỉ có thể so sánh tối đa 5 sản phẩm cùng lúc'
      };
    }

    // Step 1: Check if we need more information
    const needsMoreInfo = !query && !userPersona && selectedOptions.length === 0;

    if (needsMoreInfo) {
      // Generate suggested comparison options
      const optionsPrompt = `
Dựa vào danh sách sách sau, hãy đề xuất 4-6 tiêu chí so sánh hữu ích:

${products.map((p, i) => `
Sách ${i + 1}: "${p.title}"
- Tác giả: ${p.author}
- Thể loại: ${p.genre || 'N/A'}
- Giá: ${p.price}$
- Mô tả: ${p.description?.substring(0, 200) || 'N/A'}...
`).join('\n')}

Trả về ĐÚNG FORMAT JSON sau (không thêm markdown, không thêm text khác):
{
  "options": [
    "So sánh về giá cả và giá trị",
    "Phù hợp với lứa tuổi/đối tượng đọc",
    "Độ khó và thời gian đọc",
    "Nội dung và thông điệp chính"
  ]
}`;

      const optionsResponse = await generateText(optionsPrompt);
      let parsedOptions;

      try {
        // Try to parse JSON from response
        const jsonMatch = optionsResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedOptions = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found');
        }
      } catch (e) {
        // Fallback options if parsing fails
        parsedOptions = {
          options: [
            "So sánh về giá cả và giá trị",
            "Phù hợp với độ tuổi và sở thích",
            "Độ khó và thời gian đọc",
            "Nội dung và thông điệp"
          ]
        };
      }

      return {
        success: true,
        needsMoreInfo: true,
        suggestedOptions: parsedOptions.options,
        message: 'Vui lòng chọn tiêu chí so sánh hoặc nhập yêu cầu của bạn'
      };
    }

    // Step 2: Retrieve relevant comments for RAG using semantic search
    const productIds = products.map(p => p._id).filter(Boolean);
    const commentsMap = await retrieveRelevantComments(productIds, query, products, 5);
    const hasSemanticSearch = query && query.trim().length > 0;
    const commentsContext = formatCommentsForPrompt(commentsMap, products, hasSemanticSearch);

    // Step 3: Perform actual comparison with RAG context
    const comparisonPrompt = `
Bạn là chuyên gia tư vấn sách. Hãy so sánh các sách sau và đưa ra khuyến nghị:

DANH SÁCH SÁCH:
${products.map((p, i) => `
━━━ SÁCH ${i + 1} ━━━
Tiêu đề: "${p.title}"
Tác giả: ${p.author}
Thể loại: ${p.genre || 'N/A'}
Giá: ${p.price.toLocaleString('vi-VN')}đ
Đánh giá: ${p.rating}/5 (${p.sold || 0} lượt bán)
Mô tả: ${p.description || 'Không có mô tả'}
${commentsContext}
${p.attributes?.publisher ? `Nhà xuất bản: ${p.attributes.publisher}` : ''}
${p.attributes?.pages ? `Số trang: ${p.attributes.pages}` : ''}
${p.attributes?.language ? `Ngôn ngữ: ${p.attributes.language}` : ''}
${p.attributes?.awards?.length > 0 ? `Giải thưởng: ${p.attributes.awards.join(', ')}` : ''}
`).join('\n')}

THÔNG TIN NGƯỜI DÙNG:
${userPersona ? `Hồ sơ: ${userPersona}` : 'Không có thông tin cá nhân'}

YÊU CẦU SO SÁNH:
${query ? `Tiêu chí: ${query}` : 'Không có tiêu chí cụ thể'}
${selectedOptions.length > 0 ? `Các khía cạnh quan tâm: ${selectedOptions.join(', ')}` : ''}

HÃY PHÂN TÍCH VÀ TRẢ VỀ ĐÚNG FORMAT JSON SAU (không thêm markdown, không thêm text khác):
{
  "recommendation": {
    "bookIndex": 0,
    "title": "Tên sách được đề xuất",
    "reasons": [
      "Lý do 1 nên chọn sách này",
      "Lý do 2",
      "Lý do 3"
    ],
    "whenToBuy": "Nên mua khi nào (ví dụ: ngay bây giờ nếu..., hoặc đợi đến khi...)",
    "isUrgent": true,
    "urgencyReason": "Lý do cần mua ngay hoặc có thể đợi"
  },
  "comparison": {
    "summary": "Tóm tắt so sánh tổng quan giữa các sách",
    "strengths": {
      "0": ["Ưu điểm của sách 1"],
      "1": ["Ưu điểm của sách 2"]
    },
    "weaknesses": {
      "0": ["Nhược điểm của sách 1"],
      "1": ["Nhược điểm của sách 2"]
    }
  },
  "generalAdvice": "Lời khuyên chung về việc lựa chọn và đọc sách"
}

LƯU Ý:
- bookIndex là chỉ số (0, 1, 2...) của sách được đề xuất trong danh sách
- SỬ DỤNG đánh giá từ người dùng thực tế (RAG Context) để đưa ra nhận định chính xác hơn
- Trích dẫn ý kiến người dùng nếu có thông tin hữu ích
- Phân tích dựa trên giá trị, nội dung, phù hợp với người đọc
- Đưa ra lời khuyên thực tế và hữu ích
- Nếu không có thông tin persona/query, hãy phân tích khách quan dựa trên thông tin sách
`;

    const comparisonResponse = await generateText(comparisonPrompt);

    // Parse JSON response
    let result;
    try {
      const jsonMatch = comparisonResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      return {
        success: false,
        needsMoreInfo: false,
        message: 'Không thể phân tích kết quả so sánh. Vui lòng thử lại.'
      };
    }

    // Add product details to recommendation
    const recommendedProduct = products[result.recommendation.bookIndex];
    result.recommendation.product = {
      id: recommendedProduct.id,
      title: recommendedProduct.title,
      author: recommendedProduct.author,
      price: recommendedProduct.price,
      image: recommendedProduct.image?.[0],
      rating: recommendedProduct.rating
    };

    return {
      success: true,
      needsMoreInfo: false,
      data: result
    };

  } catch (error) {
    console.error('Product comparison error:', error);
    return {
      success: false,
      needsMoreInfo: false,
      message: 'Đã xảy ra lỗi khi so sánh sản phẩm. Vui lòng thử lại.'
    };
  }
}
