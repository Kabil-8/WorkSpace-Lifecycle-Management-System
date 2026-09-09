import User from '../models/User.js';
import Course from '../models/Course.js';
import { AttendanceSession } from '../models/attendance/AttendanceSession.js';
import { Exam } from '../models/proctor/Exam.js';
import Assignment from '../models/Assignment.js';
import Notification from '../models/Notification.js';
import { LeaveRequest } from '../models/attendance/LeaveRequest.js';
import mongoose from 'mongoose';
import { logger } from '../config/logger.js';
export class TeacherService {
    static async getContextData(userId) {
        try {
            const user = await User.findById(userId).lean();
            if (!user) {
                return {
                    user: { id: userId, name: 'Faculty', role: 'faculty', department: 'General' },
                    error: 'User profile not found in database',
                };
            }
            const objectId = new mongoose.Types.ObjectId(userId);
            const [courses, recentSessions, upcomingExams, pendingLeaveRequests, pendingAssignments, notifications,] = await Promise.all([
                Course.find({
                    $or: [{ instructor: user.name }, { instructorId: objectId }],
                    isActive: true,
                }).select('title code enrolledStudents').lean().catch(() => []),
                AttendanceSession.find({ facultyId: objectId })
                    .sort({ date: -1 })
                    .limit(5)
                    .lean()
                    .catch(() => []),
                Exam.find({
                    $or: [{ createdByName: user.name }, { creatorId: objectId }],
                    status: { $in: ['Scheduled', 'Active'] },
                }).select('title startTime durationMinutes subject department').limit(5).lean().catch(() => []),
                LeaveRequest.find({ status: 'Pending' })
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .lean()
                    .catch(() => []),
                Assignment.find({ status: { $in: ['Published', 'Active'] } })
                    .sort({ dueDate: 1 })
                    .limit(5)
                    .lean()
                    .catch(() => []),
                Notification.find({ userId: objectId, isRead: false })
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .lean()
                    .catch(() => []),
            ]);
            return {
                user: {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    department: user.department || 'Not specified',
                    designation: user.designation || 'Faculty',
                },
                courses: courses.map((c) => ({
                    id: c._id?.toString(),
                    title: c.title,
                    code: c.code,
                    enrolledStudents: c.enrolledStudents?.length || 0,
                })),
                recentAttendanceSessions: recentSessions.map((s) => ({
                    subject: s.subject,
                    date: s.date,
                    studentsPresent: s.attendedStudents?.length || 0,
                    totalStudents: s.totalStudents || 0,
                })),
                upcomingExams: upcomingExams.map((e) => ({
                    title: e.title,
                    subject: e.subject,
                    startTime: e.startTime,
                    duration: e.durationMinutes,
                    department: e.department,
                })),
                pendingLeaveRequests: pendingLeaveRequests.map((l) => ({
                    id: l._id?.toString(),
                    studentName: l.studentName || l.userId,
                    reason: l.reason,
                    startDate: l.startDate,
                    endDate: l.endDate,
                })),
                pendingAssignments: pendingAssignments.map((a) => ({
                    id: a._id?.toString(),
                    title: a.title,
                    subject: a.subject,
                    dueDate: a.dueDate,
                    submissionsCount: a.submissions?.length || 0,
                })),
                notifications: notifications.map((n) => ({
                    title: n.title,
                    message: n.message,
                    type: n.type,
                    priority: n.priority,
                })),
            };
        }
        catch (err) {
            logger.error({ userId, err: err.message }, '[TeacherService] Error fetching context');
            return null;
        }
    }
}
