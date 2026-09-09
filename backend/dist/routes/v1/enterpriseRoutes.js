import { Router } from 'express';
import { verifyToken as auth, requireRole } from '../../middleware/auth.js';
import { ParentController } from '../../controllers/parentController.js';
import { HODController } from '../../controllers/hodController.js';
import { RecruiterController } from '../../controllers/recruiterController.js';
import { FinanceController } from '../../controllers/financeController.js';
import { ObservabilityController } from '../../controllers/observabilityController.js';
// ─── Parent Routes ────────────────────────────────────────────────────────────
const parentRouter = Router();
parentRouter.use(auth);
parentRouter.get('/linked-students', ParentController.getLinkedStudents);
parentRouter.get('/student/:studentId/attendance', ParentController.getLinkedStudentAttendance);
parentRouter.get('/student/:studentId/assignments', ParentController.getLinkedStudentAssignments);
parentRouter.get('/student/:studentId/courses', ParentController.getLinkedStudentCourses);
// ─── HOD Routes ───────────────────────────────────────────────────────────────
const hodRouter = Router();
hodRouter.use(auth);
hodRouter.get('/overview', requireRole('hod', 'admin', 'super_admin'), HODController.getDepartmentOverview);
hodRouter.get('/attendance', requireRole('hod', 'admin', 'super_admin'), HODController.getDepartmentAttendanceStats);
hodRouter.get('/faculty-workload', requireRole('hod', 'admin', 'super_admin'), HODController.getFacultyWorkload);
hodRouter.get('/performance', requireRole('hod', 'admin', 'super_admin'), HODController.getDepartmentPerformanceStats);
// ─── Recruiter / Hiring Pipeline Routes ──────────────────────────────────────
const recruiterRouter = Router();
recruiterRouter.use(auth);
recruiterRouter.get('/my-jobs', requireRole('recruiter', 'placement_officer', 'admin'), RecruiterController.getMyJobs);
recruiterRouter.get('/pipeline-stats', requireRole('recruiter', 'placement_officer', 'admin'), RecruiterController.getPipelineStats);
recruiterRouter.get('/applications/:jobId', requireRole('recruiter', 'placement_officer', 'admin'), RecruiterController.getJobApplications);
recruiterRouter.patch('/applications/:applicationId/status', requireRole('recruiter', 'placement_officer', 'admin'), RecruiterController.updateApplicationStatus);
recruiterRouter.get('/search-students', requireRole('recruiter', 'placement_officer', 'admin', 'super_admin'), RecruiterController.searchEligibleStudents);
recruiterRouter.post('/placement-drives', requireRole('placement_officer', 'admin', 'super_admin'), RecruiterController.createPlacementDrive);
recruiterRouter.get('/placement-drives', RecruiterController.getPlacementDrives);
// ─── Finance Routes ───────────────────────────────────────────────────────────
const financeRouter = Router();
financeRouter.use(auth);
financeRouter.get('/my-fees', FinanceController.getStudentFeeAccount);
financeRouter.get('/student/:studentId/fees', requireRole('admin', 'super_admin', 'parent', 'placement_officer'), FinanceController.getStudentFeeAccount);
financeRouter.get('/structure', FinanceController.getFeeStructure);
financeRouter.post('/structure', requireRole('admin', 'super_admin'), FinanceController.createFeeStructure);
financeRouter.post('/accounts', requireRole('admin', 'super_admin'), FinanceController.createFeeAccount);
financeRouter.post('/accounts/:accountId/pay-offline', requireRole('admin', 'super_admin'), FinanceController.recordPayment);
financeRouter.post('/accounts/:accountId/razorpay-init', FinanceController.initRazorpayOrder);
financeRouter.post('/accounts/razorpay-verify', FinanceController.verifyRazorpayPayment);
financeRouter.get('/admin/collection-stats', requireRole('admin', 'super_admin'), FinanceController.getCollectionStats);
// ─── Observability / EDEN Analytics Routes ────────────────────────────────────
const observabilityRouter = Router();
observabilityRouter.use(auth);
observabilityRouter.get('/eden-analytics', requireRole('admin', 'super_admin'), ObservabilityController.getEdenAnalytics);
observabilityRouter.get('/eden-health', requireRole('admin', 'super_admin'), ObservabilityController.getSystemHealth);
observabilityRouter.get('/my-ai-usage', ObservabilityController.getUserAIUsage);
observabilityRouter.get('/users/:userId/ai-usage', requireRole('admin', 'super_admin'), ObservabilityController.getUserAIUsage);
export { parentRouter, hodRouter, recruiterRouter, financeRouter, observabilityRouter };
