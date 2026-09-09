import { Router } from 'express'
import { AssignmentController } from '../../controllers/assignmentController.js'
import { JobController } from '../../controllers/jobController.js'
import { EventController } from '../../controllers/eventController.js'
import { ForumController } from '../../controllers/forumController.js'
import { GamificationController } from '../../controllers/gamificationController.js'
import { AdminController } from '../../controllers/adminController.js'
import { NotificationController } from '../../controllers/notificationController.js'
import { SearchController } from '../../controllers/searchController.js'
import { TimetableController } from '../../controllers/timetableController.js'
import { PlacementController } from '../../controllers/placementController.js'
import { RoleDashboardController } from '../../controllers/roleDashboardController.js'
import { KanbanController } from '../../controllers/kanbanController.js'
import { AnalyticsController } from '../../controllers/analyticsController.js'
import { HallOfFameController } from '../../controllers/hallOfFameController.js'
import { InterviewController } from '../../controllers/interviewController.js'
import { verifyToken, requireRole } from '../../middleware/auth.js'

// ── Role Dashboards ─────────────────────────────────────────────────────────
export const roleDashboardRouter = Router()
roleDashboardRouter.get('/faculty', verifyToken, requireRole('faculty', 'hod', 'admin', 'super_admin'), RoleDashboardController.getFacultyDashboard)
roleDashboardRouter.get('/:role', verifyToken, RoleDashboardController.getRoleDashboard)

// ── Kanban Board ────────────────────────────────────────────────────────────
export const kanbanRouter = Router()
kanbanRouter.get('/', verifyToken, KanbanController.getBoard)
kanbanRouter.post('/tasks', verifyToken, KanbanController.createTask)
kanbanRouter.put('/tasks/:taskId', verifyToken, KanbanController.updateTask)
kanbanRouter.delete('/tasks/:taskId', verifyToken, KanbanController.deleteTask)

// ── Institutional Analytics ──────────────────────────────────────────────────
export const analyticsRouter = Router()
analyticsRouter.get('/institutional', verifyToken, AnalyticsController.getInstitutionalAnalytics)

// ── Hall of Fame ─────────────────────────────────────────────────────────────
export const hallOfFameRouter = Router()
hallOfFameRouter.get('/', verifyToken, HallOfFameController.getAll)
hallOfFameRouter.post('/', verifyToken, requireRole('admin', 'super_admin'), HallOfFameController.create)

// ── AI Interview History ──────────────────────────────────────────────────────
export const interviewRouter = Router()
interviewRouter.get('/history', verifyToken, InterviewController.getHistory)
interviewRouter.post('/attempts', verifyToken, InterviewController.recordAttempt)

// ── Assignments ─────────────────────────────────────────────────────────────
export const assignmentRouter = Router()
assignmentRouter.get('/', verifyToken, AssignmentController.getAll)
assignmentRouter.get('/:id', verifyToken, AssignmentController.getById)
assignmentRouter.post('/', verifyToken, requireRole('faculty', 'admin', 'hod', 'super_admin'), AssignmentController.create)
assignmentRouter.put('/:id', verifyToken, requireRole('faculty', 'admin', 'hod', 'super_admin'), AssignmentController.update)
assignmentRouter.delete('/:id', verifyToken, requireRole('faculty', 'admin', 'hod', 'super_admin'), AssignmentController.delete)
assignmentRouter.put('/:id/submit', verifyToken, AssignmentController.submit)
assignmentRouter.put('/:id/grade', verifyToken, requireRole('faculty', 'admin', 'hod', 'super_admin'), AssignmentController.grade)

// ── Jobs ────────────────────────────────────────────────────────────────────
export const jobRouter = Router()
jobRouter.get('/', verifyToken, JobController.getAll)
jobRouter.post('/', verifyToken, requireRole('recruiter', 'placement_officer', 'admin', 'super_admin'), JobController.create)
jobRouter.put('/:id/apply', verifyToken, JobController.apply)
jobRouter.delete('/:id', verifyToken, requireRole('recruiter', 'placement_officer', 'admin', 'super_admin'), JobController.delete)

// ── Events ──────────────────────────────────────────────────────────────────
export const eventRouter = Router()
eventRouter.get('/', verifyToken, EventController.getAll)
eventRouter.post('/', verifyToken, requireRole('faculty', 'admin', 'hod', 'placement_officer', 'super_admin'), EventController.create)
eventRouter.put('/:id/rsvp', verifyToken, EventController.rsvp)
eventRouter.delete('/:id', verifyToken, requireRole('admin', 'super_admin'), EventController.delete)

// ── Forum ───────────────────────────────────────────────────────────────────
export const forumRouter = Router()
forumRouter.get('/posts', verifyToken, ForumController.getPosts)
forumRouter.post('/posts', verifyToken, ForumController.create)
forumRouter.post('/posts/:id/reply', verifyToken, ForumController.reply)
forumRouter.put('/posts/:id/like', verifyToken, ForumController.like)
forumRouter.patch('/posts/:id/view', verifyToken, ForumController.incrementViews)

// ── Gamification ────────────────────────────────────────────────────────────
export const gamificationRouter = Router()
gamificationRouter.get('/me', verifyToken, GamificationController.getMe)
gamificationRouter.get('/leaderboard', verifyToken, GamificationController.getLeaderboard)
gamificationRouter.post('/mission-complete', verifyToken, GamificationController.completeMission)
gamificationRouter.post('/award-xp', verifyToken, requireRole('admin', 'faculty', 'super_admin'), GamificationController.awardXp)

// ── Admin ───────────────────────────────────────────────────────────────────
export const adminRouter = Router()
adminRouter.get('/stats', verifyToken, requireRole('admin', 'hod', 'super_admin'), AdminController.getStats)
adminRouter.get('/audit-logs', verifyToken, requireRole('admin', 'hod', 'super_admin'), AdminController.getAuditLogs)
adminRouter.delete('/audit-logs', verifyToken, requireRole('admin', 'super_admin'), AdminController.clearAuditLogs)
adminRouter.get('/departments', verifyToken, AdminController.getDepartments)
adminRouter.post('/departments', verifyToken, requireRole('admin', 'super_admin'), AdminController.createDepartment)
adminRouter.put('/departments/:id', verifyToken, requireRole('admin', 'super_admin'), AdminController.updateDepartment)
adminRouter.delete('/departments/:id', verifyToken, requireRole('admin', 'super_admin'), AdminController.deleteDepartment)
adminRouter.get('/users', verifyToken, requireRole('admin', 'hod', 'super_admin'), AdminController.listUsers)
adminRouter.post('/users', verifyToken, requireRole('admin', 'super_admin'), AdminController.createUser)
adminRouter.put('/users/:id', verifyToken, requireRole('admin', 'super_admin'), AdminController.updateUser)
adminRouter.delete('/users/:id', verifyToken, requireRole('admin', 'super_admin'), AdminController.deleteUser)
adminRouter.get('/settings', verifyToken, requireRole('admin', 'super_admin'), AdminController.getSettings)
adminRouter.get('/public-info', AdminController.getSettings)
adminRouter.put('/settings', verifyToken, requireRole('admin', 'super_admin'), AdminController.updateSettings)

// ── Notifications ───────────────────────────────────────────────────────────
export const notificationRouter = Router()
notificationRouter.get('/', verifyToken, NotificationController.getMyNotifications)
notificationRouter.put('/mark-read', verifyToken, NotificationController.markRead)
notificationRouter.put('/mark-all-read', verifyToken, NotificationController.markAllRead)
notificationRouter.delete('/old', verifyToken, NotificationController.deleteOld)
notificationRouter.delete('/:id', verifyToken, NotificationController.deleteNotification)

// ── Search ──────────────────────────────────────────────────────────────────
export const searchRouter = Router()
searchRouter.get('/', verifyToken, SearchController.globalSearch)

// ── Timetable ───────────────────────────────────────────────────────────────
export const timetableRouter = Router()
timetableRouter.get('/', verifyToken, TimetableController.getTimetable)
timetableRouter.post('/', verifyToken, requireRole('faculty', 'admin', 'hod', 'super_admin'), TimetableController.createPeriodSlot)
timetableRouter.put('/:id', verifyToken, requireRole('faculty', 'admin', 'hod', 'super_admin'), TimetableController.updatePeriodSlot)
timetableRouter.delete('/:id', verifyToken, requireRole('faculty', 'admin', 'hod', 'super_admin'), TimetableController.deletePeriodSlot)

// ── Placement Drives & Analytics ────────────────────────────────────────────
export const placementRouter = Router()
placementRouter.get('/stats', verifyToken, PlacementController.getStats)

