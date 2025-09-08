import express from 'express'
import { commentController } from '~/controllers/commentController.js'
import { authenticateToken } from '~/middlewares/authMiddleware.js'
import { commentValidation } from '~/validations/commentValidation.js'

const Router = express.Router()

Router.post('/create', authenticateToken, commentValidation.createComment, commentController.createComment)
Router.put('/update/:id', authenticateToken, commentValidation.updateComment, commentController.updateComment)
Router.delete('/delete/:id', authenticateToken, commentController.deleteComment)
Router.get('/all', commentController.getAllComment)
Router.get('/comment/:id', commentController.getCommentById)
Router.get('/book/:bookId', commentController.getCommentByIdBook)

export default Router