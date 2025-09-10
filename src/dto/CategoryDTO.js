/**
 * Category DTO - Data Transfer Object cho Category
 */

/**
 * DTO cho Category
 */
export const CategoryDTO = {
  /**
   * Chuẩn hóa thông tin danh mục
   * @param {object} category - Category object
   * @returns {object} Cleaned category data
   */
  toResponse: (category) => {
    if (!category) return null
    
    return {
      id: category._id,
      name: category.name,
      description: category.description,
      isDisable: category.isDisable,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    }
  },

  /**
   * Chuẩn hóa thông tin danh mục cho list (ít thông tin hơn)
   * @param {object} category - Category object
   * @returns {object} Simplified category data
   */
  toListResponse: (category) => {
    if (!category) return null
    
    return {
      id: category._id,
      name: category.name,
      description: category.description,
      isDisable: category.isDisable
    }
  },

  /**
   * Chuẩn hóa thông tin danh mục cho dropdown/select
   * @param {object} category - Category object
   * @returns {object} Category data for dropdown
   */
  toSelectResponse: (category) => {
    if (!category) return null
    
    return {
      value: category._id,
      label: category.name,
      disabled: category.isDisable
    }
  },

  /**
   * Chuẩn hóa danh sách danh mục
   * @param {Array} categories - Array of category objects
   * @returns {Array} Array of cleaned category data
   */
  toResponseList: (categories) => {
    if (!Array.isArray(categories)) return []
    return categories.map(category => CategoryDTO.toResponse(category))
  },

  /**
   * Chuẩn hóa danh sách danh mục (list format)
   * @param {Array} categories - Array of category objects
   * @returns {Array} Array of simplified category data
   */
  toListResponseList: (categories) => {
    if (!Array.isArray(categories)) return []
    return categories.map(category => CategoryDTO.toListResponse(category))
  },

  /**
   * Chuẩn hóa danh sách danh mục cho dropdown
   * @param {Array} categories - Array of category objects
   * @returns {Array} Array of select option data
   */
  toSelectResponseList: (categories) => {
    if (!Array.isArray(categories)) return []
    return categories.map(category => CategoryDTO.toSelectResponse(category))
  }
}
