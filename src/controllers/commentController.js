import Comment from '~/models/Comment.js'
import Book from '~/models/Book.js'
import { 
  sendSuccess, 
  sendError, 
  sendCreated,
  sendNotFound,
  sendForbidden,
  sendBadRequest 
} from '../utils/responseHelper.js'
import { CommentDTO } from '../dto/index.js'
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../utils/constants.js'

const createComment = async (req, res, next) => {
  try {
    const { book_id, rating, content } = req.body

    // 1. Kiểm tra sách có tồn tại không
    const book = await Book.findById(book_id)
    if (!book) {
      return sendNotFound(res, ERROR_MESSAGES.BOOK_NOT_FOUND)
    }

    // 2. Tạo comment
    const comment = new Comment({
      book_id,
      rating,
      content,
      user_id: req.user._id
    })

    await comment.save()

    const responseData = CommentDTO.toResponse(comment)
    return sendCreated(res, responseData, SUCCESS_MESSAGES.COMMENT_CREATED)
  } catch (err) {
    next(err)
  }
}

const updateComment = async (req, res) => {
  try {
    const { id } = req.params

    const comment = await Comment.findById(id)
    if (!comment) {
      return sendNotFound(res, ERROR_MESSAGES.COMMENT_NOT_FOUND)
    }

    // chỉ cho phép chủ comment sửa
    if (comment.user_id.toString() !== req.user._id.toString()) {
      return sendForbidden(res, 'Bạn không có quyền sửa bình luận này')
    }

    // kiểm tra thời gian < 15 phút
    const now = new Date()
    const diffMinutes = (now - comment.createdAt) / (1000 * 60)
    if (diffMinutes > 15) {
      return sendBadRequest(res, 'Bạn chỉ có thể sửa trong vòng 15 phút sau khi bình luận')
    }

    const updatedComment = await Comment.findByIdAndUpdate(id, req.body, { new: true })
    const responseData = CommentDTO.toResponse(updatedComment)
    return sendSuccess(res, responseData, SUCCESS_MESSAGES.COMMENT_UPDATED)
  } catch (err) {
    return sendError(res, ERROR_MESSAGES.INTERNAL_ERROR, 500, { message: err.message })
  }
}

 const deleteComment = async (req, res) => {
  try {
    const { id } = req.params
    const comment = await Comment.findById(id)
    if (!comment) {
      return sendNotFound(res, ERROR_MESSAGES.COMMENT_NOT_FOUND)
    }

    // Người tạo hoặc admin mới được xóa
    if (
      comment.user_id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return sendForbidden(res, 'Bạn không có quyền xóa bình luận này')
    }

    await Comment.findByIdAndDelete(id)
    return sendSuccess(res, null, SUCCESS_MESSAGES.COMMENT_DELETED)
  } catch (err) {
    return sendError(res, ERROR_MESSAGES.INTERNAL_ERROR, 500, { message: err.message })
  }
}

const getAllComment = async (req, res) => {
    try {
        const comments = await Comment.find()
          .populate('user_id', 'username fullname avatar') 
          .populate('book_id', 'title author')  
        const responseData = CommentDTO.toResponseListWithPopulated(comments)
        return sendSuccess(res, responseData, SUCCESS_MESSAGES.COMMENT_RETRIEVED)
    } catch (err) {
        return sendError(res, ERROR_MESSAGES.INTERNAL_ERROR, 500, { message: err.message })
    }
}

const getCommentById = async (req, res) => {
    try {
        const { id } = req.params
        const comment = await Comment.findById(id)
          .populate('user_id', 'username email')
          .populate('book_id', 'title author')
        if (!comment) {
          return sendNotFound(res, ERROR_MESSAGES.COMMENT_NOT_FOUND)
        }
        const responseData = CommentDTO.toResponseWithPopulated(comment)
        return sendSuccess(res, responseData, SUCCESS_MESSAGES.COMMENT_RETRIEVED)
    } catch (err) {
        return sendError(res, ERROR_MESSAGES.INTERNAL_ERROR, 500, { message: err.message })
    }
}

const getCommentByIdBook = async (req, res) => {
    try {
        const { bookId } = req.params
        const comments = await Comment.find({ book_id: bookId })
          .populate('user_id', 'username email avatar')
          .populate('book_id', 'title author')
        const responseData = CommentDTO.toResponseListWithPopulated(comments)
        return sendSuccess(res, responseData, SUCCESS_MESSAGES.COMMENT_RETRIEVED)
    } catch (err) {
        return sendError(res, ERROR_MESSAGES.INTERNAL_ERROR, 500, { message: err.message })
    }
}
export const commentController = {
    createComment,
    updateComment,
    deleteComment,
    getAllComment,
    getCommentById,
    getCommentByIdBook
}