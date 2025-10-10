import express from 'express'
import { importBooksFromCSV, uploadCSV } from '../../controllers/importController.js'
import { authenticateToken } from '../../middlewares/authMiddleware.js'
import { checkRole } from '../../middlewares/checkRoleMiddleware.js'

const Router = express.Router()

// Import books from CSV file (Admin only)
Router.post('/books/csv', authenticateToken, checkRole('admin'), uploadCSV, importBooksFromCSV)

export default Router