import express from 'express'
import {
  generateStatistic,
  getStatistic,
  getStatistics,
  checkReportStatus,
  deleteStatistic,
  forceCleanupStuckReports
} from '../../controllers/aiStatisticController.js'
import { authenticateToken } from '../../middlewares/authMiddleware.js'

const router = express.Router()

// 🚀 Tạo báo cáo thống kê AI (yêu cầu auth)
router.post('/generate', authenticateToken, generateStatistic)

// 📊 Lấy báo cáo theo ID
router.get('/:id', authenticateToken, getStatistic)

// 📋 Lấy danh sách báo cáo (có pagination)
router.get('/', authenticateToken, getStatistics)

// ⏳ Kiểm tra trạng thái báo cáo (cho progress bar)
router.get('/:id/status', authenticateToken, checkReportStatus)

// 🗑️ Xóa báo cáo (yêu cầu auth)
router.delete('/:id', authenticateToken, deleteStatistic)

// 🧹 Force cleanup stuck reports (admin endpoint)
router.post('/cleanup-stuck', authenticateToken, forceCleanupStuckReports)

export default router