import express from 'express'
import {
  createPendingCategory,
  getPendingCategories,
  getPendingCategoryById,
  approvePendingCategory,
  rejectPendingCategory,
  assignToExistingCategory,
  deletePendingCategory,
  getPendingCategoryStats
} from '~/controllers/pendingCategoryController.js'

import {
  createPendingCategoryValidation,
  approvePendingCategoryValidation,
  rejectPendingCategoryValidation,
  assignCategoryValidation,
  getPendingCategoriesValidation
} from '~/validations/pendingCategoryValidation.js'


import { authenticateToken } from '~/middlewares/authMiddleware.js'
import { checkRole } from '~/middlewares/checkRoleMiddleware.js'

const router = express.Router()

// Public routes (for system internal use)
router.post('/create', 
  authenticateToken, 
  createPendingCategoryValidation, 
  createPendingCategory
)

// Admin routes
router.get('/stats', 
  authenticateToken, 
  checkRole('admin'), 
  getPendingCategoryStats
)

router.get('/', 
  authenticateToken, 
  checkRole('admin'), 
  getPendingCategoriesValidation, 
  getPendingCategories
)

router.get('/:id', 
  authenticateToken, 
  checkRole('admin'), 
  getPendingCategoryById
)

router.put('/:id/approve', 
  authenticateToken, 
  checkRole('admin'), 
  approvePendingCategoryValidation, 
  approvePendingCategory
)

router.put('/:id/reject', 
  authenticateToken, 
  checkRole('admin'), 
  rejectPendingCategoryValidation, 
  rejectPendingCategory
)

router.put('/:id/assign', 
  authenticateToken, 
  checkRole('admin'), 
  assignCategoryValidation, 
  assignToExistingCategory
)

router.delete('/:id', 
  authenticateToken, 
  checkRole('admin'), 
  deletePendingCategory
)

export default router
