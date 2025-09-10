/**
 * Response DTO Schemas
 * Định nghĩa cấu trúc response chuẩn cho API
 */

/**
 * Tạo response thành công
 * @param {*} data - Dữ liệu trả về
 * @param {string} message - Thông báo
 * @param {object} meta - Metadata (pagination, etc.)
 * @returns {object} Standardized success response
 */
export const createSuccessResponse = (data = null, message = 'Success', meta = null) => {
  const response = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  }

  if (meta) {
    response.meta = meta
  }

  return response
}

/**
 * Tạo response lỗi
 * @param {string} message - Thông báo lỗi
 * @param {*} errors - Chi tiết lỗi
 * @param {string} code - Mã lỗi tùy chỉnh
 * @returns {object} Standardized error response
 */
export const createErrorResponse = (message = 'Error', errors = null, code = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  }

  if (errors) {
    response.errors = errors
  }

  if (code) {
    response.code = code
  }

  return response
}

/**
 * Tạo response cho pagination
 * @param {Array} data - Dữ liệu
 * @param {number} page - Trang hiện tại
 * @param {number} limit - Số item per page
 * @param {number} total - Tổng số item
 * @param {string} message - Thông báo
 * @returns {object} Paginated response
 */
export const createPaginatedResponse = (data, page, limit, total, message = 'Success') => {
  const totalPages = Math.ceil(total / limit)
  const hasNext = page < totalPages
  const hasPrev = page > 1

  return createSuccessResponse(data, message, {
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNext,
      hasPrev
    }
  })
}

// Re-export DTOs from dto folder for backward compatibility
export { UserDTO } from '../dto/UserDTO.js'
export { BookDTO } from '../dto/BookDTO.js'
export { CategoryDTO } from '../dto/CategoryDTO.js'
export { CommentDTO } from '../dto/CommentDTO.js'
export { OrderDTO } from '../dto/OrderDTO.js'
export { AuthDTO } from '../dto/AuthDTO.js'
