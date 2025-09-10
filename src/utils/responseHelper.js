/**
 * Response Helper
 * Các helper functions để tạo response chuẩn
 */

import { HTTP_STATUS, STATUS_MESSAGES } from './httpStatus.js'
import { createSuccessResponse, createErrorResponse, createPaginatedResponse } from './responseSchema.js'

/**
 * Gửi response thành công
 * @param {object} res - Express response object
 * @param {*} data - Dữ liệu trả về
 * @param {string} message - Thông báo
 * @param {number} statusCode - HTTP status code
 * @param {object} meta - Metadata
 */
export const sendSuccess = (res, data = null, message = null, statusCode = HTTP_STATUS.OK, meta = null) => {
  const finalMessage = message || STATUS_MESSAGES[statusCode]
  const response = createSuccessResponse(data, finalMessage, meta)
  return res.status(statusCode).json(response)
}

/**
 * Gửi response lỗi
 * @param {object} res - Express response object
 * @param {string} message - Thông báo lỗi
 * @param {number} statusCode - HTTP status code
 * @param {*} errors - Chi tiết lỗi
 * @param {string} code - Mã lỗi tùy chỉnh
 */
export const sendError = (res, message = null, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errors = null, code = null) => {
  const finalMessage = message || STATUS_MESSAGES[statusCode]
  const response = createErrorResponse(finalMessage, errors, code)
  return res.status(statusCode).json(response)
}

/**
 * Gửi response với pagination
 * @param {object} res - Express response object
 * @param {Array} data - Dữ liệu
 * @param {number} page - Trang hiện tại
 * @param {number} limit - Số item per page
 * @param {number} total - Tổng số item
 * @param {string} message - Thông báo
 * @param {number} statusCode - HTTP status code
 */
export const sendPaginated = (res, data, page, limit, total, message = null, statusCode = HTTP_STATUS.OK) => {
  const finalMessage = message || STATUS_MESSAGES[statusCode]
  const response = createPaginatedResponse(data, page, limit, total, finalMessage)
  return res.status(statusCode).json(response)
}

/**
 * Gửi response tạo mới thành công
 * @param {object} res - Express response object
 * @param {*} data - Dữ liệu đã tạo
 * @param {string} message - Thông báo
 */
export const sendCreated = (res, data, message = 'Created successfully') => {
  return sendSuccess(res, data, message, HTTP_STATUS.CREATED)
}

/**
 * Gửi response không tìm thấy
 * @param {object} res - Express response object
 * @param {string} message - Thông báo
 */
export const sendNotFound = (res, message = 'Resource not found') => {
  return sendError(res, message, HTTP_STATUS.NOT_FOUND)
}

/**
 * Gửi response lỗi validation
 * @param {object} res - Express response object
 * @param {*} errors - Chi tiết lỗi validation
 * @param {string} message - Thông báo
 */
export const sendValidationError = (res, errors, message = 'Validation failed') => {
  return sendError(res, message, HTTP_STATUS.UNPROCESSABLE_ENTITY, errors)
}

/**
 * Gửi response unauthorized
 * @param {object} res - Express response object
 * @param {string} message - Thông báo
 */
export const sendUnauthorized = (res, message = 'Unauthorized access') => {
  return sendError(res, message, HTTP_STATUS.UNAUTHORIZED)
}

/**
 * Gửi response forbidden
 * @param {object} res - Express response object
 * @param {string} message - Thông báo
 */
export const sendForbidden = (res, message = 'Access forbidden') => {
  return sendError(res, message, HTTP_STATUS.FORBIDDEN)
}

/**
 * Gửi response conflict
 * @param {object} res - Express response object
 * @param {string} message - Thông báo
 */
export const sendConflict = (res, message = 'Resource conflict') => {
  return sendError(res, message, HTTP_STATUS.CONFLICT)
}

/**
 * Gửi response bad request
 * @param {object} res - Express response object
 * @param {string} message - Thông báo
 * @param {*} errors - Chi tiết lỗi
 */
export const sendBadRequest = (res, message = 'Bad request', errors = null) => {
  return sendError(res, message, HTTP_STATUS.BAD_REQUEST, errors)
}
