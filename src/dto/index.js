/**
 * DTO Index - Export tất cả DTOs
 * Central export point cho tất cả Data Transfer Objects
 */

import { UserDTO } from './UserDTO.js'
import { BookDTO } from './BookDTO.js'
import { CategoryDTO } from './CategoryDTO.js'
import { CommentDTO } from './CommentDTO.js'
import { OrderDTO } from './OrderDTO.js'
import { AuthDTO } from './AuthDTO.js'

// Named exports for easy destructuring
export { UserDTO, BookDTO, CategoryDTO, CommentDTO, OrderDTO, AuthDTO }

// Default export for backward compatibility
export default {
  UserDTO,
  BookDTO,
  CategoryDTO,
  CommentDTO,
  OrderDTO,
  AuthDTO
}
