/**
 * Main export file for response utilities
 * Import tất cả các utilities cần thiết từ đây
 */

// HTTP Status codes
export { HTTP_STATUS, STATUS_MESSAGES } from './httpStatus.js'

// Response helpers
export {
  sendSuccess,
  sendError,
  sendPaginated,
  sendCreated,
  sendNotFound,
  sendValidationError,
  sendUnauthorized,
  sendForbidden,
  sendConflict,
  sendBadRequest
} from './responseHelper.js'

// Response schemas and DTOs
export {
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  UserDTO,
  AuthDTO,
  BookDTO,
  CategoryDTO,
  CommentDTO,
  OrderDTO
} from './responseSchema.js'

// Constants
export {
  ERROR_CODES,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  PAGINATION,
  USER_ROLES,
  BOOK_STATUS,
  ORDER_STATUS
} from './constants.js'

// Error handling
export {
  errorHandler,
  notFoundHandler,
  asyncHandler
} from '../middlewares/errorHandler.js'

// Validation middleware
export {
  validateRequest,
  validateQuery,
  validateParams
} from '../middlewares/validationMiddleware.js'
