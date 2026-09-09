import { Router } from 'express';
import { VideoCourseController } from '../../controllers/videoCourseController.js';
import { verifyToken, optionalAuth } from '../../middleware/auth.js';
const router = Router();
/**
 * GET /api/v1/learn
 * Public course catalog — filter by category/level/search query.
 * Optional JWT token attached if logged in to enrich user progress metrics.
 */
router.get('/', optionalAuth, VideoCourseController.getCatalog);
/**
 * GET /api/v1/learn/:courseSlug
 * Public course details & section outline.
 */
router.get('/:courseSlug', optionalAuth, VideoCourseController.getCourseBySlug);
/**
 * GET /api/v1/learn/:courseSlug/watch/:lessonId
 * Public video lesson player info.
 */
router.get('/:courseSlug/watch/:lessonId', optionalAuth, VideoCourseController.getLessonWatchDetails);
/**
 * GET /api/v1/learn/:courseSlug/progress
 * JWT REQUIRED: Get student's watch progress.
 */
router.get('/:courseSlug/progress', verifyToken, VideoCourseController.getProgress);
/**
 * POST /api/v1/learn/:courseSlug/progress
 * JWT REQUIRED: Update lesson watch completion.
 */
router.post('/:courseSlug/progress', verifyToken, VideoCourseController.updateProgress);
/**
 * GET /api/v1/learn/:courseSlug/certificate
 * JWT REQUIRED: Issue or retrieve completion certificate (requires 100% progress).
 */
router.get('/:courseSlug/certificate', verifyToken, VideoCourseController.getCertificate);
export default router;
