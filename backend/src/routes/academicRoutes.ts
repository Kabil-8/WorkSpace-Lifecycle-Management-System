import { Router } from 'express'
import { verifyToken as auth, requireRole } from '../middleware/auth.js'
import { AcademicResultController } from '../controllers/academicResultController.js'

const router = Router()

router.use(auth)

// ── Student / Parent Transcript Routes ────────────────────────────────
router.get('/transcript', AcademicResultController.getStudentTranscript)
router.get('/student/:studentId/transcript', AcademicResultController.getStudentTranscript)

// ── Gradebook Roster Sheet & Bulk Persistence ────────────────────────
router.get('/gradebook-sheet', AcademicResultController.getGradebookSheet)
router.post('/grade/bulk', requireRole('faculty', 'hod', 'admin', 'super_admin'), AcademicResultController.bulkRecordCourseGrades)

// ── Faculty / Admin Individual Grade Recording Route ──────────────────
router.post('/grade', requireRole('faculty', 'hod', 'admin', 'super_admin'), AcademicResultController.recordCourseGrade)

// ── Semester Course Catalog & Admin CRUD Routes ───────────────────────
router.get('/courses', AcademicResultController.getCoursesBySemester)
router.post('/courses', requireRole('faculty', 'hod', 'admin', 'super_admin'), AcademicResultController.createCourse)
router.put('/courses/:id', requireRole('faculty', 'hod', 'admin', 'super_admin'), AcademicResultController.updateCourse)
router.delete('/courses/:id', requireRole('admin', 'super_admin'), AcademicResultController.deleteCourse)

export default router
