import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { bookController } from '~/controllers/bookController.js'
import { bookValidation } from '~/validations/bookValdation.js'
import { authenticateToken, optionalAuth } from '~/middlewares/authMiddleware.js'
import { checkRole } from '~/middlewares/checkRoleMiddleware.js'
import { compareProductsController } from '~/controllers/productComparisonController.js'

const Router = express.Router()

// Kiểm tra status API
Router.get('/status', (req, res) => {
  res.status(StatusCodes.OK).json({ message: 'Book APIs are ready', code: StatusCodes.OK })
})

// Các route chính
Router.post('/create', authenticateToken, checkRole('admin') , bookValidation.createBook, bookController.createBook)
Router.put('/update', authenticateToken, checkRole('admin'), bookValidation.updateBook, bookController.updateBook)
Router.put('/toggle-disable', authenticateToken, checkRole('admin'), bookController.toggleDisableBook)
Router.get('/all', bookController.getAllBook)
Router.get('/featured', bookController.getFeaturedBooks)
Router.get('/recommended', optionalAuth, bookController.getRecommendedBooks)
Router.get('/paginated', bookController.getPaginatedBooks)
Router.get('/getBook/:slug/persona-note', optionalAuth, bookController.getBookPersonaNote)
Router.get('/getBook/:slug', bookController.getBookBySlug)
Router.get('/:id/related', bookController.getRelatedBooks)
Router.put('/summaryvector', bookController.summaryvectorBook)
Router.post('/search', optionalAuth, bookController.searchBooks)
Router.post('/search-filters', bookController.searchKeywordAndFilters)

// Product comparison with AI
Router.post('/compare', compareProductsController)

// Import CSV route
Router.post('/import-csv', authenticateToken, checkRole('admin'), bookController.importBooksFromCSV)

export default Router