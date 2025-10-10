import express from 'express';
import { 
  createOrder, 
  createDirectOrder, 
  getUserOrders, 
  getOrderById, 
  getAllOrders,
  updateOrderStatus
} from '../../controllers/orderController.js';
import { authenticateToken } from '../../middlewares/authMiddleware.js';
import { checkRole } from '../../middlewares/checkRoleMiddleware.js';

const router = express.Router();

// All order routes require authentication
router.use(authenticateToken);

// Admin routes (must come before :id routes)
router.get('/', checkRole('admin'), getAllOrders);
router.put('/:id/status', checkRole('admin'), updateOrderStatus);

// User routes
router.get('/my-orders', getUserOrders);
router.post('/create', createOrder);
router.post('/create-direct', createDirectOrder);
router.get('/:id', getOrderById); // This must be last to avoid catching other routes

export default router;