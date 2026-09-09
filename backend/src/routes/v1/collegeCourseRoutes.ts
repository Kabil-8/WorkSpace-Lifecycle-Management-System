import { Router } from 'express'
import { CollegeCourseController } from '../../controllers/collegeCourseController.js'
import { verifyToken, requireRole } from '../../middleware/auth.js'

const router = Router()

// All routes require valid JWT authentication
router.use(verifyToken)

/**
 * GET /api/v1/college-courses
 * Enrolled college courses for student or all department courses for faculty/admin
 */
router.get('/', CollegeCourseController.getMyCollegeCourses)

/**
 * POST /api/v1/college-courses
 * Create new college academic course
 */
router.post('/', requireRole('faculty', 'admin', 'hod', 'super_admin'), CollegeCourseController.createCollegeCourse)

/**
 * GET /api/v1/college-courses/:courseId
 * Details, syllabus, units for enrolled course
 */
router.get('/:courseId', CollegeCourseController.getCollegeCourseById)

/**
 * PUT /api/v1/college-courses/:courseId
 * Update college academic course
 */
router.put('/:courseId', requireRole('faculty', 'admin', 'hod', 'super_admin'), CollegeCourseController.updateCollegeCourse)

/**
 * DELETE /api/v1/college-courses/:courseId
 * Delete college academic course
 */
router.delete('/:courseId', requireRole('faculty', 'admin', 'hod', 'super_admin'), CollegeCourseController.deleteCollegeCourse)

/**
 * POST /api/v1/college-courses/:courseId/enroll
 * Enroll student in college course
 */
router.post('/:courseId/enroll', CollegeCourseController.enrollInCourse)

/**
 * GET /api/v1/college-courses/:courseId/assignments
 * Academic assignments & submission status
 */
router.get('/:courseId/assignments', CollegeCourseController.getCourseAssignments)

/**
 * POST /api/v1/college-courses/:courseId/assignments/:assignmentId/submit
 * Submit academic assignment
 */
router.post('/:courseId/assignments/:assignmentId/submit', CollegeCourseController.submitAssignment)

/**
 * GET /api/v1/college-courses/:courseId/quizzes
 * Unit quizzes & results
 */
router.get('/:courseId/quizzes', CollegeCourseController.getCourseQuizzes)

/**
 * POST /api/v1/college-courses/:courseId/quizzes/:quizId/submit
 * Submit unit quiz
 */
router.post('/:courseId/quizzes/:quizId/submit', CollegeCourseController.submitQuiz)

/**
 * GET /api/v1/college-courses/:courseId/exams
 * Internal midterm/final exam schedules & student marks
 */
router.get('/:courseId/exams', CollegeCourseController.getCourseExams)

/**
 * GET /api/v1/college-courses/:courseId/performance
 * Course academic performance breakdown (attendance %, quiz avg, exam marks)
 */
router.get('/:courseId/performance', CollegeCourseController.getCoursePerformance)

export default router
