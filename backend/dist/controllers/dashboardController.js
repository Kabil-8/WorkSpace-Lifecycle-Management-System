import User from '../models/User.js';
import Course from '../models/Course.js';
import Assignment from '../models/Assignment.js';
import Gamification from '../models/Gamification.js';
import Notification from '../models/Notification.js';
import { StudentAttendance } from '../models/attendance/StudentAttendance.js';
import { RedisCache, CacheKeys, CacheTTL } from '../cache/RedisCache.js';
import { logger } from '../config/logger.js';
import { Exam } from '../models/proctor/Exam.js';
import Job from '../models/Job.js';
import Event from '../models/Event.js';
import { StreakService } from '../services/StreakService.js';
import { AcademicResult } from '../models/AcademicResult.js';
import { AcademicResultController } from './academicResultController.js';
export const getDashboard = async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const role = req.user.role;
        const cacheKey = CacheKeys.dashboard(userId);
        // Try cache first
        const cached = await RedisCache.get(cacheKey);
        if (cached) {
            res.json({ success: true, data: cached, cached: true });
            return;
        }
        const user = req.user;
        const streakInfo = await StreakService.touchStreak(user._id);
        // Build dashboard based on role
        let dashboardData = {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                xp: user.xp,
                level: user.level,
                streak: streakInfo.streak,
                maxStreak: streakInfo.maxStreak,
                cgpa: user.cgpa,
                placementReadiness: user.placementReadiness,
                edenStage: user.edenStage,
                avatarUrl: user.avatarUrl,
            },
        };
        if (role === 'student') {
            // Attendance
            const totalAttendance = await StudentAttendance.countDocuments({ studentId: userId });
            const presentAttendance = await StudentAttendance.countDocuments({ studentId: userId, status: 'Present' });
            const overallPct = totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 87;
            // Assignments (limited)
            const assignments = await Assignment.find({ department: user.department })
                .sort({ dueDate: 1 }).limit(5).select('title courseName dueDate priority status');
            // Ensure student gamification document exists in MongoDB
            let gamification = await Gamification.findOne({ userId });
            if (!gamification) {
                gamification = await Gamification.create({
                    userId,
                    xp: user.xp || 0,
                    level: user.level || 1,
                    streak: user.streak || 0,
                    maxStreak: user.maxStreak || 0,
                    cgpa: user.cgpa || 7.0,
                    placementReadinessPct: user.placementReadiness || 40,
                    dailyMissions: [
                        { id: 'm1', title: 'Complete 1 Interactive Code Compiler challenge', xpReward: 50, isCompleted: false },
                        { id: 'm2', title: 'Post a topic in Discussion Forum', xpReward: 25, isCompleted: false },
                        { id: 'm3', title: 'Review Smart Notes for your semester', xpReward: 30, isCompleted: false },
                    ],
                });
            }
            // Courses
            const courses = await Course.find({ department: user.department, status: 'published' })
                .sort({ enrolledCount: -1 }).limit(6).select('title instructorName level rating enrolledCount');
            // Notifications (unread count)
            const unreadCount = await Notification.countDocuments({ userId, isRead: false });
            const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(10);
            // Upcoming events
            const events = await Event.find({ date: { $gte: new Date() }, isPublished: true })
                .sort({ date: 1 }).limit(5).select('title date eventType location');
            // Upcoming exams
            const exams = await Exam.find({ isActive: true }).sort({ scheduledAt: 1 }).limit(3)
                .select('title subject durationMinutes scheduledAt');
            // Leaderboard (strictly students only)
            const studentUsers = await User.find({ role: 'student' }).select('_id').lean();
            const studentIds = studentUsers.map(s => s._id);
            const leaderboard = await Gamification.find({ userId: { $in: studentIds } })
                .sort({ xp: -1 }).limit(10).populate('userId', 'name department avatarUrl');
            // Fetch or ensure verified Academic Results for student
            let academicResults = await AcademicResult.find({ studentId: userId }).sort({ semester: 1 }).lean();
            if (academicResults.length === 0) {
                academicResults = await AcademicResultController.ensureStudentAcademicResults(userId);
            }
            let totalPointsTimesCredits = 0;
            let totalCredits = 0;
            const gpaHistory = academicResults.length > 0
                ? academicResults.map((r) => {
                    const semCredits = (r.courseGrades || []).reduce((sum, g) => sum + (g.credits || 4), 0) || r.totalCreditsEarned || 15;
                    totalPointsTimesCredits += (r.sgpa || 9.0) * semCredits;
                    totalCredits += semCredits;
                    return {
                        month: `Sem ${r.semester}`,
                        gpa: r.sgpa || 9.0,
                    };
                })
                : [
                    { month: 'Sem 1', gpa: 8.8 },
                    { month: 'Sem 2', gpa: 8.9 },
                    { month: 'Sem 3', gpa: 9.0 },
                    { month: 'Sem 4', gpa: 9.1 },
                    { month: 'Sem 5', gpa: 9.0 },
                ];
            const studentCgpa = totalCredits > 0 ? Number((totalPointsTimesCredits / totalCredits).toFixed(2)) : (user.cgpa || 9.0);
            const studentXp = user.xp ?? gamification.xp ?? 0;
            const studentPlacement = user.placementReadiness ?? gamification.placementReadinessPct ?? 40;
            const attendancePct = totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 0;
            dashboardData = {
                ...dashboardData,
                user: {
                    ...dashboardData.user,
                    cgpa: studentCgpa,
                },
                attendance: {
                    overallPct: attendancePct,
                    totalClasses: totalAttendance,
                    attendedClasses: presentAttendance,
                },
                gpaHistory,
                assignments: assignments.map(a => ({
                    id: a._id, title: a.title, courseName: a.courseName,
                    dueDate: a.dueDate, priority: a.priority, status: a.status,
                })),
                gamification,
                courses,
                notifications,
                unreadNotifications: unreadCount,
                events,
                exams,
                leaderboard: leaderboard.map((e, i) => ({
                    rank: i + 1, xp: e.xp, level: e.level,
                    user: e.userId,
                    isCurrentUser: e.userId?._id?.toString() === userId,
                })),
                edenInsights: [
                    `Your attendance is currently at ${attendancePct}%. Maintain above 75% for exam eligibility.`,
                    `Your active CGPA is ${studentCgpa} with ${studentXp} Total XP accumulated in MongoDB.`,
                    `Placement readiness: ${studentPlacement}%. Complete practice challenges to boost score.`,
                ],
            };
        }
        else if (role === 'faculty') {
            const myCourses = await Course.find({ instructor: userId }).limit(10);
            const pendingAssignments = await Assignment.find({ instructorId: userId })
                .sort({ dueDate: 1 }).limit(10);
            const recentExams = await Exam.find({ createdBy: userId }).sort({ createdAt: -1 }).limit(5);
            const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(10);
            dashboardData = {
                ...dashboardData,
                courses: myCourses,
                assignments: pendingAssignments,
                exams: recentExams,
                notifications,
                totalStudents: await User.countDocuments({ role: 'student', department: user.department }),
            };
        }
        else if (role === 'admin' || role === 'super_admin' || role === 'hod') {
            const totalUsers = await User.countDocuments({ isActive: true });
            const totalStudents = await User.countDocuments({ role: 'student', isActive: true });
            const totalFaculty = await User.countDocuments({ role: 'faculty', isActive: true });
            const totalCourses = await Course.countDocuments({ status: 'published' });
            const totalJobs = await Job.countDocuments({ isActive: true });
            const roleDistribution = await User.aggregate([
                { $group: { _id: '$role', count: { $sum: 1 } } },
                { $project: { role: '$_id', count: 1, _id: 0 } },
            ]);
            const recentAuditLogs = await (await import('../models/AuditLog.js')).default
                .find().sort({ createdAt: -1 }).limit(10).populate('actorId', 'name');
            const hiredCount = await (await import('../models/Job.js')).default.countDocuments({ 'applicants.status': 'offered' });
            const activeUserCount = await User.countDocuments({ isActive: { $ne: false } });
            const placementRate = totalStudents > 0 ? Math.round((hiredCount / totalStudents) * 100) : 0;
            dashboardData = {
                ...dashboardData,
                platformStats: {
                    totalUsers, totalStudents, totalFaculty, totalCourses, totalJobs,
                    placementRate,
                    activeUsers: activeUserCount,
                },
                roleDistribution,
                recentAuditLogs,
            };
        }
        else {
            // Generic for other roles
            const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(10);
            const events = await Event.find({ date: { $gte: new Date() } }).sort({ date: 1 }).limit(5);
            dashboardData = { ...dashboardData, notifications, events };
        }
        // Cache the result
        await RedisCache.set(cacheKey, dashboardData, CacheTTL.dashboard);
        res.json({ success: true, data: dashboardData });
    }
    catch (err) {
        logger.error({ err: err.message }, '[Dashboard] Error building dashboard');
        res.status(500).json({ success: false, message: err.message });
    }
};
