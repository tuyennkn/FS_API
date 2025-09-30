import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { authController } from '../../controllers/authController.js'
import { authValidation } from '~/validations/authValidation.js'
import { checkAvatar } from '~/middlewares/moderation.middleware.js'
import { sendSuccess, sendValidationError } from '../../utils/responseHelper.js'
import { SUCCESS_MESSAGES } from '../../utils/constants.js'
import { authenticateToken } from '~/middlewares/authMiddleware.js'

const Router = express.Router()

// Kiểm tra status API với response format mới
Router.get('/status', (req, res) => {
  return sendSuccess(res, { status: 'API Ready', version: '1.0.0' }, SUCCESS_MESSAGES.USER_RETRIEVED)
})

// Test validation error format
Router.post('/test-validation', (req, res) => {
  const errors = [
    { field: 'username', message: 'Username là bắt buộc', value: '' },
    { field: 'password', message: 'Password là bắt buộc', value: '' }
  ]
  return sendValidationError(res, errors)
})

// Các route chính
Router.post('/register', authValidation.createUser, authController.register)
Router.post('/login', authValidation.validateLogin, authController.login)
Router.post('/refresh', authController.refreshToken)
Router.post('/logout', authController.logout)
Router.post('/logout-all', authController.logoutAll)

Router.get('/me', authenticateToken, authController.getMe)

export default Router
