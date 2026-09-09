import { Router } from 'express'
import { verifyToken, requireRole } from '../../middleware/auth.js'
import { MentorshipController } from '../../controllers/mentorshipController.js'

const router = Router()

router.get('/allocations', verifyToken, MentorshipController.getAllocations)
router.get('/my-students', verifyToken, requireRole('faculty', 'mentor', 'hod', 'admin', 'super_admin'), MentorshipController.getMyStudentsAndMentees)
router.get('/available-mentors', verifyToken, MentorshipController.getAvailableMentors)
router.get('/students', verifyToken, MentorshipController.getStudents)
router.get('/students/:studentId/telemetry', verifyToken, MentorshipController.getStudentTelemetry)
router.put('/students/:studentId/telemetry', verifyToken, requireRole('faculty', 'mentor', 'hod', 'admin', 'super_admin'), MentorshipController.updateStudentTelemetry)
router.post('/students/:studentId/recalculate-ml', verifyToken, requireRole('faculty', 'mentor', 'hod', 'admin', 'super_admin'), MentorshipController.recalculateStudentML)
router.post('/allocate', verifyToken, requireRole('faculty', 'admin', 'hod', 'super_admin', 'mentor', 'student'), MentorshipController.createAllocation)

export default router
