/**
 * Order DTO - Data Transfer Object cho Order
 */

import { UserDTO } from './UserDTO.js'
import { BookDTO } from './BookDTO.js'

/**
 * DTO cho Order
 */
export const OrderDTO = {
  /**
   * Chuẩn hóa thông tin đơn hàng
   * @param {object} order - Order object
   * @returns {object} Cleaned order data
   */
  toResponse: (order) => {
    if (!order) return null
    
    return {
      id: order._id,
      user_id: order.user_id,
      books: order.books,
      price: order.price,
      payment_type: order.payment_type,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }
  },

  /**
   * Chuẩn hóa thông tin đơn hàng với populated data
   * @param {object} order - Order object với populated user và books
   * @returns {object} Order data with user and books info
   */
  toResponseWithPopulated: (order) => {
    if (!order) return null
    
    const baseResponse = OrderDTO.toResponse(order)
    
    // Nếu user được populate
    if (order.user_id && typeof order.user_id === 'object') {
      baseResponse.user = UserDTO.toPublicResponse(order.user_id)
    }
    
    // Xử lý books array với populated data
    if (order.books && Array.isArray(order.books)) {
      baseResponse.books = order.books.map(bookItem => {
        const result = {
          book_id: bookItem.book_id,
          quantity: bookItem.quantity
        }
        
        // Nếu book được populate
        if (bookItem.book_id && typeof bookItem.book_id === 'object') {
          result.book = {
            id: bookItem.book_id._id,
            title: bookItem.book_id.title,
            author: bookItem.book_id.author,
            price: bookItem.book_id.price
          }
        }
        
        return result
      })
    }
    
    return baseResponse
  },

  /**
   * Chuẩn hóa thông tin đơn hàng cho list (ít thông tin hơn)
   * @param {object} order - Order object
   * @returns {object} Simplified order data
   */
  toListResponse: (order) => {
    if (!order) return null
    
    return {
      id: order._id,
      price: order.price,
      payment_type: order.payment_type,
      bookCount: order.books ? order.books.length : 0,
      createdAt: order.createdAt
    }
  },

  /**
   * Chuẩn hóa danh sách đơn hàng
   * @param {Array} orders - Array of order objects
   * @returns {Array} Array of cleaned order data
   */
  toResponseList: (orders) => {
    if (!Array.isArray(orders)) return []
    return orders.map(order => OrderDTO.toResponse(order))
  },

  /**
   * Chuẩn hóa danh sách đơn hàng với populated data
   * @param {Array} orders - Array of order objects với populated data
   * @returns {Array} Array of order data with populated info
   */
  toResponseListWithPopulated: (orders) => {
    if (!Array.isArray(orders)) return []
    return orders.map(order => OrderDTO.toResponseWithPopulated(order))
  },

  /**
   * Chuẩn hóa danh sách đơn hàng (list format)
   * @param {Array} orders - Array of order objects
   * @returns {Array} Array of simplified order data
   */
  toListResponseList: (orders) => {
    if (!Array.isArray(orders)) return []
    return orders.map(order => OrderDTO.toListResponse(order))
  }
}
