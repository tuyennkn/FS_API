/**
 * Book DTO - Data Transfer Object cho Book
 */

/**
 * DTO cho Book
 */
export const BookDTO = {
  /**
   * Chuẩn hóa thông tin sách để trả về client
   * @param {object} book - Book object từ database
   * @returns {object} Cleaned book data
   */
  toResponse: (book) => {
    if (!book) return null
    
    const response = {
      id: book._id,
      title: book.title,
      author: book.author,
      summary: book.summary,
      publisher: book.publisher,
      price: book.price,
      rating: book.rating,
      quantity: book.quantity,
      sold: book.sold,
      imageUrl: book.imageUrl,
      isDisable: book.isDisable,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
      score: book.score ?? 0 // For search results
    }

    // Luôn trả về category_id với thông tin đầy đủ nếu có
    if (book.category_id) {
      if (typeof book.category_id === 'object' && book.category_id._id) {
        // Category đã được populate
        response.category_id = {
          id: book.category_id._id,
          name: book.category_id.name,
          description: book.category_id.description,
          isDisable: book.category_id.isDisable
        }
      } else {
        // Category chỉ là ObjectId string - không nên xảy ra nếu luôn populate
        response.category_id = book.category_id
      }
    } else {
      response.category_id = null
    }

    return response
  },

  /**
   * Chuẩn hóa thông tin sách với populated category
   * @param {object} book - Book object với populated category
   * @returns {object} Book data with category info
   */
  toResponseWithCategory: (book) => {
    if (!book) return null
    
    const baseResponse = BookDTO.toResponse(book)
    
    // Nếu category được populate
    if (book.category_id && typeof book.category === 'object') {
      baseResponse.category = {
        id: book.category_id._id,
        name: book.category_id.name,
        description: book.category_id.description
      }
    }
    
    return baseResponse
  },

  /**
   * Chuẩn hóa thông tin sách cho list (ít thông tin hơn)
   * @param {object} book - Book object từ database
   * @returns {object} Simplified book data
   */
  toListResponse: (book) => {
    if (!book) return null
    
    const response = {
      id: book._id,
      title: book.title,
      author: book.author,
      price: book.price,
      rating: book.rating,
      quantity: book.quantity,
      sold: book.sold,
      imageUrl: book.imageUrl,
      isDisable: book.isDisable
    }

    // Luôn include category info nếu có
    if (book.category_id) {
      if (typeof book.category_id === 'object' && book.category_id._id) {
        response.category_id = {
          id: book.category_id._id,
          name: book.category_id.name,
          description: book.category_id.description,
          isDisable: book.category_id.isDisable
        }
      } else {
        response.category_id = book.category_id
      }
    } else {
      response.category_id = null
    }

    return response
  },

  /**
   * Chuẩn hóa danh sách sách
   * @param {Array} books - Array of book objects
   * @returns {Array} Array of cleaned book data
   */
  toResponseList: (books) => {
    if (!Array.isArray(books)) return []
    return books.map(book => BookDTO.toResponse(book))
  },

  /**
   * Chuẩn hóa danh sách sách (list format)
   * @param {Array} books - Array of book objects
   * @returns {Array} Array of simplified book data
   */
  toListResponseList: (books) => {
    if (!Array.isArray(books)) return []
    return books.map(book => BookDTO.toListResponse(book))
  }
}
