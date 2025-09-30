import express from 'express'
import { categoryController } from '~/controllers/categoryController.js'
import { categoryValidation } from '~/validations/categoryValidation.js'
import { authenticateToken } from '~/middlewares/authMiddleware.js'
import { checkRole } from '~/middlewares/checkRoleMiddleware.js'

const Router = express.Router()

Router.get('/status', (req, res) => {
  res.status(200).json({ message: 'Category APIs are ready', code: 200 })
})

// Tạo danh mục
Router.get('/allCategories', authenticateToken, checkRole('admin'), categoryController.listCategories)
Router.post('/getCategory', authenticateToken, checkRole('admin'), categoryController.getCategory)
Router.post('/createCategory', authenticateToken, checkRole('admin'), categoryValidation.createCategory, categoryController.createCategory)
Router.put('/updateCategory', authenticateToken, checkRole('admin'), categoryValidation.updateCategory, categoryController.updateCategory)
Router.put('/toggle-disable', authenticateToken, checkRole('admin'), categoryController.toggleDisbaleCategory)

export default Router