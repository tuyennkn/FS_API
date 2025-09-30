/**
 * PendingCategory DTO - Data Transfer Object cho PendingCategory
 */

/**
 * DTO cho PendingCategory
 */
export const PendingCategoryDTO = {
  /**
   * Chuẩn hóa thông tin pending category để trả về client
   * @param {object} pendingCategory - PendingCategory object từ database
   * @returns {object} Cleaned pending category data
   */
  toResponse: (pendingCategory) => {
    if (!pendingCategory) return null
    
    const response = {
      id: pendingCategory._id,
      ai_recommended_name: pendingCategory.ai_recommended_name,
      ai_recommended_description: pendingCategory.ai_recommended_description,
      book_id: pendingCategory.book_id,
      book_data: {
        title: pendingCategory.book_data?.title,
        author: pendingCategory.book_data?.author,
        genre: pendingCategory.book_data?.genre,
        image: pendingCategory.book_data?.image || []
      },
      status: pendingCategory.status,
      reviewed_by: pendingCategory.reviewed_by,
      review_notes: pendingCategory.review_notes,
      isDisable: pendingCategory.isDisable,
      createdAt: pendingCategory.createdAt,
      updatedAt: pendingCategory.updatedAt
    }

    // Nếu reviewed_by đã được populate, format thông tin reviewer
    if (pendingCategory.reviewed_by && typeof pendingCategory.reviewed_by === 'object' && pendingCategory.reviewed_by._id) {
      response.reviewed_by = {
        id: pendingCategory.reviewed_by._id,
        username: pendingCategory.reviewed_by.username,
        email: pendingCategory.reviewed_by.email,
        role: pendingCategory.reviewed_by.role
      }
    }

    return response
  },

  /**
   * Chuẩn hóa thông tin pending category cho admin với thêm thông tin chi tiết
   * @param {object} pendingCategory - PendingCategory object từ database
   * @returns {object} Detailed pending category data for admin
   */
  toAdminResponse: (pendingCategory) => {
    if (!pendingCategory) return null
    
    const baseResponse = PendingCategoryDTO.toResponse(pendingCategory)
    
    // Thêm thông tin chi tiết cho admin
    return {
      ...baseResponse,
      // Admin có thể thấy thêm metadata
      book_id: pendingCategory.book_id, // ID của book liên quan
      system_info: {
        created_at: pendingCategory.createdAt,
        updated_at: pendingCategory.updatedAt,
        is_disabled: pendingCategory.isDisable
      }
    }
  },

  /**
   * DTO cho danh sách pending categories với pagination
   * @param {object} data - Data object chứa results và pagination info
   * @returns {object} Formatted list response
   */
  toListResponse: (data) => {
    if (!data) return null
    
    return {
      results: data.results?.map(item => PendingCategoryDTO.toResponse(item)) || [],
      pagination: data.pagination || {},
      total: data.total || 0
    }
  },

  /**
   * DTO cho danh sách pending categories cho admin
   * @param {object} data - Data object chứa results và pagination info
   * @returns {object} Formatted admin list response
   */
  toAdminListResponse: (data) => {
    if (!data) return null
    
    return {
      results: data.results?.map(item => PendingCategoryDTO.toAdminResponse(item)) || [],
      pagination: data.pagination || {},
      total: data.total || 0,
      stats: data.stats || null
    }
  },

  /**
   * DTO cho stats của pending categories
   * @param {object} stats - Stats object
   * @returns {object} Formatted stats
   */
  toStatsResponse: (stats) => {
    if (!stats) return null
    
    return {
      pending: stats.pending || 0,
      approved: stats.approved || 0,
      rejected: stats.rejected || 0,
      total: stats.total || 0,
      recent_activity: stats.recent_activity || []
    }
  },

  /**
   * DTO cho tạo pending category từ request
   * @param {object} body - Request body
   * @returns {object} Sanitized data for creation
   */
  fromCreateRequest: (body) => {
    return {
      ai_recommended_name: body.ai_recommended_name?.trim(),
      ai_recommended_description: body.ai_recommended_description?.trim() || '',
      book_id: body.book_id,
      book_data: {
        title: body.book_data?.title?.trim(),
        author: body.book_data?.author?.trim(),
        genre: body.book_data?.genre?.trim(),
        image: Array.isArray(body.book_data?.image) ? body.book_data.image : []
      }
    }
  },

  /**
   * DTO cho update pending category từ admin request
   * @param {object} body - Request body
   * @returns {object} Sanitized data for update
   */
  fromUpdateRequest: (body) => {
    const updateData = {}
    
    if (body.status) updateData.status = body.status
    if (body.review_notes) updateData.review_notes = body.review_notes.trim()
    if (body.reviewed_by) updateData.reviewed_by = body.reviewed_by
    if (typeof body.isDisable === 'boolean') updateData.isDisable = body.isDisable
    
    return updateData
  }
}

export default PendingCategoryDTO