import User from '../models/User.js';
import { StudentAttendance } from '../models/attendance/StudentAttendance.js';
import Assignment from '../models/Assignment.js';
import { CollegeCourse } from '../models/CollegeCourse.js';
export class ParentController {
    /**
     * Get linked student info for this parent
     */
    static async getLinkedStudents(req, res) {
        try {
            const parent = await User.findById(req.user._id)
                .select('linkedStudentId linkedStudentIds name')
                .lean();
            const studentIds = [
                ...(parent?.linkedStudentIds || []),
                ...(parent?.linkedStudentId ? [parent.linkedStudentId] : []),
            ];
            if (studentIds.length === 0) {
                return res.json({
                    success: true,
                    data: [],
                    message: 'No students linked to your account. Contact admin to link your child\'s account.',
                });
            }
            const students = await User.find({ _id: { $in: studentIds } })
                .select('name email department semester rollNumber cgpa avatarUrl isActive')
                .lean();
            return res.json({ success: true, data: students });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * Get linked student's attendance — RBAC: parent can only see their linked child
     */
    static async getLinkedStudentAttendance(req, res) {
        try {
            const { studentId } = req.params;
            const authorized = await ParentController.isAuthorizedForStudent(req.user._id, studentId);
            if (!authorized) {
                return res.status(403).json({ success: false, message: 'You are not authorized to view this student\'s data.' });
            }
            const student = await User.findById(studentId).select('name department').lean();
            const records = await StudentAttendance.find({ studentId }).lean();
            if (!records || records.length === 0) {
                return res.json({ success: true, data: { student, totalClasses: 0, attendedClasses: 0, attendancePct: 0, records: [] } });
            }
            const present = records.filter((r) => r.status === 'Present' || r.status === 'present').length;
            const pct = Math.round((present / records.length) * 100);
            // Group by subject
            const bySubject = {};
            for (const r of records) {
                const subj = r.subject || 'General';
                if (!bySubject[subj])
                    bySubject[subj] = { present: 0, total: 0 };
                bySubject[subj].total++;
                if (r.status === 'Present' || r.status === 'present')
                    bySubject[subj].present++;
            }
            const subjects = Object.entries(bySubject).map(([name, s]) => ({
                subject: name,
                present: s.present,
                total: s.total,
                pct: Math.round((s.present / s.total) * 100),
                isShortage: Math.round((s.present / s.total) * 100) < 75,
            }));
            return res.json({
                success: true,
                data: {
                    student,
                    totalClasses: records.length,
                    attendedClasses: present,
                    attendancePct: pct,
                    isShortage: pct < 75,
                    subjects,
                },
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * Get linked student's assignment statuses
     */
    static async getLinkedStudentAssignments(req, res) {
        try {
            const { studentId } = req.params;
            const authorized = await ParentController.isAuthorizedForStudent(req.user._id, studentId);
            if (!authorized) {
                return res.status(403).json({ success: false, message: 'Unauthorized.' });
            }
            const student = await User.findById(studentId).select('name department').lean();
            const assignments = await Assignment.find({ department: student?.department })
                .sort({ dueDate: 1 }).limit(15).lean();
            const withStatus = assignments.map((a) => {
                const submission = (a.submissions || []).find((s) => s.studentId?.toString() === studentId);
                return {
                    title: a.title,
                    courseName: a.courseName,
                    dueDate: a.dueDate,
                    maxMarks: a.maxMarks,
                    submitted: !!submission,
                    submittedAt: submission?.submittedAt,
                    grade: submission?.grade ?? null,
                    feedback: submission?.feedback ?? null,
                    isOverdue: new Date(a.dueDate) < new Date() && !submission,
                };
            });
            return res.json({
                success: true,
                data: {
                    student,
                    total: withStatus.length,
                    pending: withStatus.filter(a => !a.submitted).length,
                    submitted: withStatus.filter(a => a.submitted).length,
                    assignments: withStatus,
                },
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * Get linked student's enrolled courses and progress
     */
    static async getLinkedStudentCourses(req, res) {
        try {
            const { studentId } = req.params;
            const authorized = await ParentController.isAuthorizedForStudent(req.user._id, studentId);
            if (!authorized) {
                return res.status(403).json({ success: false, message: 'Unauthorized.' });
            }
            const student = await User.findById(studentId).select('name department semester').lean();
            const courses = await CollegeCourse.find({
                department: student?.department,
                semester: student?.semester,
                status: 'active',
            }).select('courseCode title credits instructorName').lean();
            return res.json({ success: true, data: { student, courses } });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * Security helper: verifies the parent is authorized to view a specific student
     */
    static async isAuthorizedForStudent(parentId, studentId) {
        try {
            const parent = await User.findById(parentId)
                .select('linkedStudentId linkedStudentIds role')
                .lean();
            if (!parent)
                return false;
            if (parent.role === 'admin' || parent.role === 'super_admin')
                return true;
            const linked = [
                ...(parent.linkedStudentIds?.map((id) => id.toString()) || []),
                ...(parent.linkedStudentId ? [parent.linkedStudentId.toString()] : []),
            ];
            return linked.includes(studentId.toString());
        }
        catch {
            return false;
        }
    }
}
