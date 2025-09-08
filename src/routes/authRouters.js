import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { authController } from '../controllers/authController.js'
import { authValidation } from '~/validations/authValidation.js'
import { checkAvatar } from '~/middlewares/moderation.middleware.js'

const Router = express.Router()

// Kiểm tra status API
Router.get('/status', (req, res) => {
  res.status(StatusCodes.OK).json({ message: 'Auth APIs are ready', code: StatusCodes.OK })
})

// Các route chính
Router.post('/register', authValidation.createUser, checkAvatar, authController.register)
Router.post('/login', authValidation.validateLogin, authController.login)
Router.post('/refresh', authController.refreshToken)
Router.post('/logout', authController.logout)
Router.post('/logout-all', authController.logoutAll)
Router.get('/me', authController.getMe)

export default Router
