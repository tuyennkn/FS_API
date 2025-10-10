/**
 * Admin routes for fake data generation
 */

import express from 'express';
import { generateFakeData, getFakeDataStats, cleanupFakeData } from '../../controllers/admin/fakeDataController.js';
import { authenticateToken } from '~/middlewares/authMiddleware.js';

const router = express.Router();


// Generate fake data (users + orders)
router.post('/generate-fake-data', authenticateToken, generateFakeData);

// Get fake data statistics
router.get('/fake-data-stats', authenticateToken, getFakeDataStats);

// Cleanup fake data
router.delete('/cleanup-fake-data', authenticateToken, cleanupFakeData);

export default router;