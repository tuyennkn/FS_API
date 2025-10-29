/**
 * Comment DTO - Data Transfer Object cho Comment
 */

import { UserDTO } from './UserDTO.js'
import { BookDTO } from './BookDTO.js'

/**
 * DTO cho Comment
 */
export const CommentDTO = {
  /**
   * Chuẩn hóa thông tin comment
   * @param {object} comment - Comment object
   * @returns {object} Cleaned comment data
   */
  toResponse: (comment) => {
    if (!comment) return null
    
    return {
      id: comment._id,
      book_id: comment.book_id,
      user_id: comment.user_id,
      rating: comment.rating,
      comment: comment.comment,
      isDisabled: comment.isDisabled,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt
    }
  },

  /**
   * Chuẩn hóa thông tin comment với populated data
   * @param {object} comment - Comment object với populated user và book
   * @returns {object} Comment data with user and book info
   */
  toResponseWithPopulated: (comment) => {
    if (!comment) return null
    
    const baseResponse = CommentDTO.toResponse(comment)
    
    // Nếu user được populate
    if (comment.user_id && typeof comment.user_id === 'object') {
      baseResponse.user = UserDTO.toPublicResponse(comment.user_id)
    }
    
    // Nếu book được populate
    if (comment.book_id && typeof comment.book_id === 'object') {
      baseResponse.book = {
        id: comment.book_id._id,
        title: comment.book_id.title,
        author: comment.book_id.author
      }
    }
    
    return baseResponse
  },

  /**
   * Chuẩn hóa thông tin comment cho list (ít thông tin hơn)
   * @param {object} comment - Comment object
   * @returns {object} Simplified comment data
   */
  toListResponse: (comment) => {
    if (!comment) return null
    
    return {
      id: comment._id,
      rating: comment.rating,
      comment: comment.comment,
      isDisabled: comment.isDisabled,
      createdAt: comment.createdAt
    }
  },

  /**
   * Chuẩn hóa danh sách comments
   * @param {Array} comments - Array of comment objects
   * @returns {Array} Array of cleaned comment data
   */
  toResponseList: (comments) => {
    if (!Array.isArray(comments)) return []
    return comments.map(comment => CommentDTO.toResponse(comment))
  },

  /**
   * Chuẩn hóa danh sách comments với populated data
   * @param {Array} comments - Array of comment objects với populated data
   * @returns {Array} Array of comment data with populated info
   */
  toResponseListWithPopulated: (comments) => {
    if (!Array.isArray(comments)) return []
    return comments.map(comment => CommentDTO.toResponseWithPopulated(comment))
  },

  /**
   * Chuẩn hóa danh sách comments (list format)
   * @param {Array} comments - Array of comment objects
   * @returns {Array} Array of simplified comment data
   */
  toListResponseList: (comments) => {
    if (!Array.isArray(comments)) return []
    return comments.map(comment => CommentDTO.toListResponse(comment))
  }
}
