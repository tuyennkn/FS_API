/**
 * Error Handling Middleware
 * Middleware để xử lý lỗi chuẩn cho toàn bộ ứng dụng
 */

import { sendError } from '../utils/responseHelper.js'
import { HTTP_STATUS } from '../utils/httpStatus.js'
import { ERROR_CODES, ERROR_MESSAGES } from '../utils/constants.js'

/**
 * Middleware xử lý lỗi toàn cục
 * @param {Error} err - Error object
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  })

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
      value: e.value
    }))
    return sendError(res, ERROR_MESSAGES.VALIDATION_ERROR, HTTP_STATUS.UNPROCESSABLE_ENTITY, errors, ERROR_CODES.VALIDATION_ERROR)
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return sendError(res, ERROR_MESSAGES.INVALID_FORMAT, HTTP_STATUS.BAD_REQUEST, { field: err.path, value: err.value }, ERROR_CODES.INVALID_FORMAT)
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    const value = err.keyValue[field]
    const message = `${field} '${value}' đã tồn tại`
    return sendError(res, message, HTTP_STATUS.CONFLICT, { field, value }, ERROR_CODES.USER_ALREADY_EXISTS)
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, ERROR_MESSAGES.TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED, null, ERROR_CODES.TOKEN_INVALID)
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, ERROR_MESSAGES.TOKEN_EXPIRED, HTTP_STATUS.UNAUTHORIZED, null, ERROR_CODES.TOKEN_EXPIRED)
  }

  // Default server error
  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
  const message = err.message || ERROR_MESSAGES.INTERNAL_ERROR
  
  return sendError(res, message, statusCode, null, ERROR_CODES.INTERNAL_ERROR)
}

/**
 * Middleware xử lý route không tồn tại
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
export const notFoundHandler = (req, res, next) => {
  const message = `Route ${req.method} ${req.originalUrl} không tồn tại`
  return sendError(res, message, HTTP_STATUS.NOT_FOUND)
}

/**
 * Middleware bắt lỗi async
 * @param {function} fn - Async function
 * @returns {function} Express middleware function
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
