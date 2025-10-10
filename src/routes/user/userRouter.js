import express from 'express';
import { userController } from '../../controllers/userController.js';
import { authenticateToken } from '../../middlewares/authMiddleware.js';
import { checkRole } from '../../middlewares/checkRoleMiddleware.js';
import { validateUpdateUser } from '../../validations/userValidation.js';

const Router = express.Router();

// Get all users (admin only)
Router.get('/all', authenticateToken, checkRole('admin'), userController.getAllUsers);

// Get specific user by ID
Router.get('/:id', authenticateToken, validateUpdateUser, userController.getUser);
Router.put('/:id', authenticateToken, validateUpdateUser, userController.updateUser);

export default Router;