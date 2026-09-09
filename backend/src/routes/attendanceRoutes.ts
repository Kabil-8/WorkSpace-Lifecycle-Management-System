import { Router } from 'express'
import { AttendanceController } from '../controllers/attendanceController.js'

const router = Router()

// ── Faculty -> Student Attendance Routes ────────────────────────────────
router.post('/session/start', AttendanceController.startSession)
router.post('/mark', AttendanceController.markAttendance)
router.post('/bulk-mark', AttendanceController.bulkMarkAttendance)
router.get('/class-sheet', AttendanceController.getClassSheet)

// ── Admin -> Faculty Attendance Routes ──────────────────────────────────
router.get('/faculty/daily', AttendanceController.getFacultyDailyLogs)

// ── Leave Management Routes (Supporting both /leaves and /leave/list paths) ─
router.get('/leave/list', AttendanceController.getLeaveRequests)
router.get('/leaves', AttendanceController.getLeaveRequests)

router.post('/leave/apply', AttendanceController.applyLeave)
router.post('/student/leave', AttendanceController.applyLeave)

router.put('/leave/review/:id', AttendanceController.reviewLeave)
router.put('/leave/:id/status', AttendanceController.reviewLeave)

// ── Student Analytics & AI Query Routes ─────────────────────────────────
router.get('/student/my-attendance', AttendanceController.getStudentAnalytics)
router.post('/student/query', AttendanceController.queryAttendance)

export default router
