/**
 * Updated by trungquandev.com's author on August 17 2023
 * YouTube: https://youtube.com/@trungquandev
 * "A bit of fragrance clings to the hand that gives flowers!"
 */

/**
 * Application Constants
 */

// Error Codes
export const ERROR_CODES = {
  // Auth related
  INVALID_CREDENTIALS: 'AUTH_001',
  TOKEN_EXPIRED: 'AUTH_002',
  TOKEN_INVALID: 'AUTH_003',
  TOKEN_REQUIRED: 'AUTH_004',
  USER_NOT_FOUND: 'AUTH_005',
  USER_ALREADY_EXISTS: 'AUTH_006',
  EMAIL_ALREADY_EXISTS: 'AUTH_007',
  PHONE_ALREADY_EXISTS: 'AUTH_008',
  
  // User related
  USER_INACTIVE: 'USER_001',
  USER_BANNED: 'USER_002',
  INSUFFICIENT_PERMISSIONS: 'USER_003',
  
  // Book related
  BOOK_NOT_FOUND: 'BOOK_001',
  BOOK_OUT_OF_STOCK: 'BOOK_002',
  BOOK_INACTIVE: 'BOOK_003',
  
  // Category related
  CATEGORY_NOT_FOUND: 'CAT_001',
  CATEGORY_HAS_BOOKS: 'CAT_002',
  
  // Order related
  ORDER_NOT_FOUND: 'ORDER_001',
  ORDER_CANCELLED: 'ORDER_002',
  ORDER_COMPLETED: 'ORDER_003',
  
  // Comment related
  COMMENT_NOT_FOUND: 'COMMENT_001',
  COMMENT_NOT_APPROVED: 'COMMENT_002',
  
  // Validation related
  VALIDATION_ERROR: 'VALID_001',
  REQUIRED_FIELD_MISSING: 'VALID_002',
  INVALID_FORMAT: 'VALID_003',
  
  // System related
  INTERNAL_ERROR: 'SYS_001',
  SERVICE_UNAVAILABLE: 'SYS_002',
  DATABASE_ERROR: 'SYS_003'
}

// Success Messages
export const SUCCESS_MESSAGES = {
  // Auth
  REGISTER_SUCCESS: 'Đăng ký thành công',
  LOGIN_SUCCESS: 'Đăng nhập thành công',
  LOGOUT_SUCCESS: 'Đăng xuất thành công',
  TOKEN_REFRESH_SUCCESS: 'Làm mới token thành công',
  
  // User
  USER_CREATED: 'Tạo người dùng thành công',
  USER_UPDATED: 'Cập nhật người dùng thành công',
  USER_DELETED: 'Xóa người dùng thành công',
  USER_RETRIEVED: 'Lấy thông tin người dùng thành công',
  
  // Book
  BOOK_CREATED: 'Tạo sách thành công',
  BOOK_UPDATED: 'Cập nhật sách thành công',
  BOOK_DELETED: 'Xóa sách thành công',
  BOOK_RETRIEVED: 'Lấy thông tin sách thành công',
  
  // Category
  CATEGORY_CREATED: 'Tạo danh mục thành công',
  CATEGORY_UPDATED: 'Cập nhật danh mục thành công',
  CATEGORY_DELETED: 'Xóa danh mục thành công',
  CATEGORY_RETRIEVED: 'Lấy danh mục thành công',
  
  // Comment
  COMMENT_CREATED: 'Tạo bình luận thành công',
  COMMENT_UPDATED: 'Cập nhật bình luận thành công',
  COMMENT_DELETED: 'Xóa bình luận thành công',
  COMMENT_RETRIEVED: 'Lấy bình luận thành công'
}

// Error Messages
export const ERROR_MESSAGES = {
  // Auth
  INVALID_CREDENTIALS: 'Tên đăng nhập hoặc mật khẩu không đúng',
  TOKEN_EXPIRED: 'Token đã hết hạn',
  TOKEN_INVALID: 'Token không hợp lệ',
  TOKEN_REQUIRED: 'Token bắt buộc',
  USER_NOT_FOUND: 'Không tìm thấy người dùng',
  USER_ALREADY_EXISTS: 'Người dùng đã tồn tại',
  EMAIL_ALREADY_EXISTS: 'Email đã được sử dụng',
  PHONE_ALREADY_EXISTS: 'Số điện thoại đã được sử dụng',
  
  // User
  USER_INACTIVE: 'Tài khoản đã bị vô hiệu hóa',
  USER_BANNED: 'Tài khoản đã bị khóa',
  INSUFFICIENT_PERMISSIONS: 'Không có quyền truy cập',
  
  // Book
  BOOK_NOT_FOUND: 'Không tìm thấy sách',
  BOOK_OUT_OF_STOCK: 'Sách đã hết hàng',
  BOOK_INACTIVE: 'Sách đã ngừng kinh doanh',
  
  // Category
  CATEGORY_NOT_FOUND: 'Không tìm thấy danh mục',
  CATEGORY_HAS_BOOKS: 'Danh mục có chứa sách, không thể xóa',
  
  // Order
  ORDER_NOT_FOUND: 'Không tìm thấy đơn hàng',
  ORDER_CANCELLED: 'Đơn hàng đã bị hủy',
  ORDER_COMPLETED: 'Đơn hàng đã hoàn thành',
  
  // Comment
  COMMENT_NOT_FOUND: 'Không tìm thấy bình luận',
  COMMENT_NOT_APPROVED: 'Bình luận chưa được duyệt',
  
  // Validation
  VALIDATION_ERROR: 'Dữ liệu không hợp lệ',
  REQUIRED_FIELD_MISSING: 'Thiếu trường bắt buộc',
  INVALID_FORMAT: 'Định dạng không hợp lệ',
  
  // System
  INTERNAL_ERROR: 'Lỗi hệ thống',
  SERVICE_UNAVAILABLE: 'Dịch vụ không khả dụng',
  DATABASE_ERROR: 'Lỗi cơ sở dữ liệu'
}

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
}

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  MODERATOR: 'moderator'
}

// Book status
export const BOOK_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  OUT_OF_STOCK: 'out_of_stock'
}

// Order status
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  SHIPPING: 'shipping',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
}
