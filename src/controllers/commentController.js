import  Comment from '~/models/Comment.js'
import Book from '~/models/Book.js'

const createComment = async (req, res, next) => {
  try {
    const { book_id, rating, content } = req.body

    // 1. Kiểm tra sách có tồn tại không
    const book = await Book.findById(book_id)
    if (!book) {
      return res.status(404).json({ message: 'Sách không tồn tại' })
    }

    // 2. Tạo comment
    const comment = new Comment({
      book_id,
      rating,
      content,
      user_id: req.user._id
    })

    await comment.save()

    res.status(201).json({ message: 'Comment created successfully', comment })
  } catch (err) {
    next(err)
  }
}

const updateComment = async (req, res) => {
  try {
    const { id } = req.params

    const comment = await Comment.findById(id)
    if (!comment) return res.status(404).json({ message: 'Không tìm thấy bình luận' })

    // chỉ cho phép chủ comment sửa
    if (comment.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bạn không có quyền sửa bình luận này' })
    }

    // kiểm tra thời gian < 15 phút
    const now = new Date()
    const diffMinutes = (now - comment.createdAt) / (1000 * 60)
    if (diffMinutes > 15) {
      return res.status(400).json({ message: 'Bạn chỉ có thể sửa trong vòng 15 phút sau khi bình luận' })
    }

    const updatedComment = await Comment.findByIdAndUpdate(id, req.body, { new: true })
    return res.json(updatedComment)
  } catch (err) {
    return res.status(500).json({ message: err.message })
    }
}

 const deleteComment = async (req, res) => {
  try {
    const { id } = req.params
    const comment = await Comment.findById(id)
    if (!comment) return res.status(404).json({ message: 'Không tìm thấy bình luận' })

    // Người tạo hoặc admin mới được xóa
    if (
      comment.user_id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa bình luận này' })
    }

    await Comment.findByIdAndDelete(id)
    return res.json({ message: 'Xóa bình luận thành công' })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

const getAllComment = async (req, res) => {
    try {
        const comments = await Comment.find()
  .populate('user_id', 'username fullname avatar') 
  .populate('book_id', 'title author')  
        res.json(comments)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const getCommentById = async (req, res) => {
    try {
        const { id } = req.params
        const comment = await Comment.findById(id).populate('user', 'username email').populate('book', 'title author')
        if (!comment) return res.status(404).json({ message: 'Không tìm thấy bình luận' })
        res.json(comment)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const getCommentByIdBook = async (req, res) => {
    try {
        const { bookId } = req.params
        const comments = await Comment.find({ book_id: bookId }).populate('user_id', 'username email avatar').populate('book_id', 'title author')
        res.json(comments)
    } catch (err) {
        res.status(500).json({ message: err.message })
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