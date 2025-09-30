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
      description: book.description, // Changed from summary
      slug: book.slug, // New field
      publisher: book.attributes?.publisher, // Moved to attributes
      price: book.price,
      rating: book.rating,
      genre: book.genre, // New field
      quantity: book.quantity,
      sold: book.sold,
      image: book.image, // Changed from imageUrl to array
      isDisable: book.isDisable,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
      score: book.score ?? 0, // For search results
      
      // Additional attributes
      attributes: book.attributes ? {
        isbn: book.attributes.isbn,
        publisher: book.attributes.publisher,
        firstPublishDate: book.attributes.firstPublishDate,
        publishDate: book.attributes.publishDate,
        pages: book.attributes.pages,
        language: book.attributes.language,
        edition: book.attributes.edition,
        bookFormat: book.attributes.bookFormat,
        characters: book.attributes.characters,
        awards: book.attributes.awards
      } : null
    }

    // Luôn trả về category với thông tin đầy đủ nếu có
    if (book.category) {
      if (typeof book.category === 'object' && book.category._id) {
        // Category đã được populate
        response.category = {
          id: book.category._id,
          name: book.category.name,
          description: book.category.description,
          isDisable: book.category.isDisable
        }
      } else {
        // Category chỉ là ObjectId string - không nên xảy ra nếu luôn populate
        response.category = book.category
      }
    } else {
      response.category = null
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
    if (book.category && typeof book.category === 'object') {
      baseResponse.category = {
        id: book.category._id,
        name: book.category.name,
        description: book.category.description
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
      description: book.description ? book.description.substring(0, 200) + '...' : '', // Truncated description
      slug: book.slug,
      price: book.price,
      rating: book.rating,
      genre: book.genre,
      quantity: book.quantity,
      sold: book.sold,
      image: book.image?.[0], // Only first image for list view
      isDisable: book.isDisable
    }

    // Luôn include category info nếu có
    if (book.category) {
      if (typeof book.category === 'object' && book.category._id) {
        response.category = {
          id: book.category._id,
          name: book.category.name,
          description: book.category.description,
          isDisable: book.category.isDisable
        }
      } else {
        response.category = book.category
      }
    } else {
      response.category = null
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
