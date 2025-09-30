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
      items: order.items?.map(item => ({
        book_id: item.book_id._id || item.book_id,
        book: item.book_id.title ? {
          id: item.book_id._id,
          title: item.book_id.title,
          author: item.book_id.author,
          image: item.book_id.image?.[0],
          slug: item.book_id.slug
        } : undefined,
        quantity: item.quantity,
        price: item.price
      })) || [],
      total_price: order.total_price,
      payment_type: order.payment_type,
      status: order.status || 'pending',
      created_at: order.createdAt,
      updated_at: order.updatedAt
    }
  },

  /**
   * Chuẩn hóa thông tin đơn hàng với populated data
   * @param {object} order - Order object với populated user và items
   * @returns {object} Order data with user and books info
   */
  toResponseWithPopulated: (order) => {
    if (!order) return null
    
    const baseResponse = OrderDTO.toResponse(order)
    
    // Nếu user được populate
    if (order.user_id && typeof order.user_id === 'object') {
      baseResponse.user = UserDTO.toPublicResponse(order.user_id)
    }
    
    return baseResponse
  },

  /**
   * Chuẩn hóa dữ liệu cho admin response
   * @param {object} order - Order object
   * @returns {object} Order data for admin
   */
  toAdminResponse: (order) => {
    const response = OrderDTO.toResponse(order)
    return {
      ...response,
      user: order.user_id.email ? {
        id: order.user_id._id,
        email: order.user_id.email,
        name: order.user_id.name
      } : undefined
    }
  },

  /**
   * Chuẩn hóa danh sách đơn hàng
   * @param {Array} orders - Array of order objects
   * @returns {Array} Array of cleaned order data
   */
  toListResponse: (orders) => {
    if (!Array.isArray(orders)) return []
    return orders.map(order => OrderDTO.toResponse(order))
  },

  /**
   * Tạo order từ request data
   * @param {object} data - Request data
   * @returns {object} Order data for creation
   */
  fromCreateRequest: (data) => {
    return {
      user_id: data.user_id,
      items: data.items?.map(item => ({
        book_id: item.product_id || item.book_id,
        quantity: item.quantity,
        price: item.price
      })) || [],
      total_price: data.total_price,
      payment_type: data.payment_type || 'cash'
    }
  }
}
