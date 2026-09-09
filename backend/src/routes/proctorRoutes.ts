import { Router } from 'express'
import { ProctorController } from '../controllers/proctorController.js'

const router = Router()

// ── Faculty & Admin Exam CRUD Routes ──────────────────────────────────
router.get('/exams', ProctorController.getExams)
router.get('/exams/:id', ProctorController.getExamById)
router.post('/exams', ProctorController.createExam)
router.put('/exams/:id', ProctorController.updateExam)
router.delete('/exams/:id', ProctorController.deleteExam)

// ── Student Exam Workflow Routes ──────────────────────────────────────
router.post('/start', ProctorController.startExam)
router.post('/verify-face', ProctorController.verifyFace)
router.post('/eye-tracking', ProctorController.logEyeTracking)
router.post('/head-pose', ProctorController.logHeadPose)
router.post('/browser-events', ProctorController.logBrowserEvents)
router.post('/warnings', ProctorController.issueWarning)
router.post('/submit', ProctorController.submitExam)
router.get('/integrity-report/:attemptId', ProctorController.getIntegrityReport)

// ── Faculty Monitoring & Analytics Routes ──────────────────────────────
router.get('/faculty/live-monitor/:examId', ProctorController.getFacultyLiveMonitor)
router.get('/faculty/analytics', ProctorController.getFacultyAnalytics)

export default router
