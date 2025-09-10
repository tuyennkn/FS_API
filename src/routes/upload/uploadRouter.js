import express from 'express'
import { uploadController } from '~/controllers/uploadController.js'
import { authenticateToken } from '~/middlewares/authMiddleware.js'
import { checkRole } from '~/middlewares/checkRoleMiddleware.js'

const Router = express.Router()

// Upload image (Admin only)
Router.post('/image', authenticateToken, checkRole('admin'), uploadController.uploadImage)

// Delete image (Admin only)
Router.delete('/image', authenticateToken, checkRole('admin'), uploadController.deleteImage)

export default Router