import express from 'express';
import { 
  createOrder, 
  createDirectOrder, 
  getUserOrders, 
  getOrderById, 
  getAllOrders 
} from '../../controllers/orderController.js';
import { authenticateToken } from '../../middlewares/authMiddleware.js';
import { checkRole } from '../../middlewares/checkRoleMiddleware.js';

const router = express.Router();

// All order routes require authentication
router.use(authenticateToken);

// User routes
router.get('/my-orders', getUserOrders);
router.get('/:id', getOrderById);
router.post('/create', createOrder);
router.post('/create-direct', createDirectOrder);

// Admin routes
router.get('/', checkRole(['admin']), getAllOrders);

export default router;