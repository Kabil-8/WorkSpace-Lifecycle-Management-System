import { Router } from 'express'
import { verifyToken } from '../../middleware/auth.js'
import {
  getTodayQueue,
  submitReview,
  getAnalytics,
  getAllItems,
} from '../../controllers/recallController.js'

const router = Router()

// All routes require a valid JWT — identity derived from req.user._id only
router.use(verifyToken)

/**
 * GET /api/v1/recall/today
 * Returns topics due today, sorted by priority (overdue first, then retention).
 */
router.get('/today', getTodayQueue)

/**
 * GET /api/v1/recall/analytics
 * Returns per-user aggregate stats: total tracked, due today, overdue, avg retention, streak.
 */
router.get('/analytics', getAnalytics)

/**
 * GET /api/v1/recall/items
 * Returns all recall items for the authenticated user.
 */
router.get('/items', getAllItems)

/**
 * POST /api/v1/recall/:topicId/review
 * Body: { quality: 1|3|5, responseTime?: number, topicName?: string, subjectName?: string, courseName?: string }
 * Submits a quality rating and updates SM-2 state for the given topic.
 */
router.post('/:topicId/review', submitReview)

export default router
