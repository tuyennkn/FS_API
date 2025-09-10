import express from 'express';
import { importBooksFromCSV, getImportTemplate, uploadCSV } from '../controllers/importController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { checkRole } from '../middlewares/checkRoleMiddleware.js';

const router = express.Router();

// Import books from CSV (Admin only)
router.post('/books/csv', 
  authMiddleware, 
  checkRole('admin'), 
  uploadCSV,
  importBooksFromCSV
);

// Get import template
router.get('/template/books', 
  authMiddleware, 
  checkRole('admin'), 
  getImportTemplate
);

export default router;
