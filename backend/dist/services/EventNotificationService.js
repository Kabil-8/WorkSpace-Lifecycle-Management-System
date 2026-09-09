import { eventBus, Events } from '../events/eventBus.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { logger } from '../config/logger.js';
// ── Notification Templates for each event type ────────────────────────────────
const NOTIFICATION_TEMPLATES = {
    [Events.ASSIGNMENT_SUBMITTED]: {
        title: '✅ Assignment Submitted',
        message: (d) => `Your assignment "${d.assignmentTitle || 'Assignment'}" has been submitted successfully.`,
        type: 'assignment',
        priority: 'low',
        actionUrl: () => '/assignments',
        icon: '📝',
    },
    [Events.ASSIGNMENT_GRADED]: {
        title: '📊 Assignment Graded',
        message: (d) => `Your assignment "${d.assignmentTitle || 'Assignment'}" has been graded. Score: ${d.grade ?? 'N/A'}/${d.maxMarks ?? 100}.`,
        type: 'assignment',
        priority: 'medium',
        actionUrl: () => '/assignments',
        icon: '📊',
        sendEmail: false,
    },
    [Events.ATTENDANCE_MARKED]: {
        title: '📋 Attendance Marked',
        message: (d) => d.attendancePct !== undefined && d.attendancePct < 75
            ? `⚠️ Your attendance in ${d.subject || 'class'} is at ${d.attendancePct}% — below the required 75%. Please attend more classes.`
            : `Your attendance has been recorded for ${d.subject || 'today\'s class'}.`,
        type: 'attendance',
        priority: (d) => (d.attendancePct !== undefined && d.attendancePct < 75 ? 'urgent' : 'low'),
        actionUrl: () => '/attendance',
        icon: '📋',
        sendEmail: false, // email only for shortage alerts, handled separately
    },
    [Events.EXAM_SUBMITTED]: {
        title: '🎓 Exam Submitted',
        message: (d) => `Your exam "${d.examTitle || 'Exam'}" submission has been recorded successfully.`,
        type: 'exam',
        priority: 'medium',
        icon: '🎓',
    },
    [Events.QUIZ_COMPLETED]: {
        title: '📝 Quiz Completed',
        message: (d) => `Quiz completed! Score: ${d.score ?? 'N/A'}/${d.totalMarks ?? 100}. ${d.score >= (d.totalMarks * 0.7) ? '🎉 Great work!' : '📚 Keep practicing!'}`,
        type: 'exam',
        priority: 'low',
        actionUrl: () => '/quizzes',
        icon: '📝',
    },
    [Events.XP_AWARDED]: {
        title: '⭐ XP Earned',
        message: (d) => `+${d.xpAmount || d.xp || 10} XP awarded! ${d.reason || 'Keep up the great work!'} You're now at Level ${d.newLevel || d.level || '?'}.`,
        type: 'gamification',
        priority: 'low',
        actionUrl: () => '/gamification',
        icon: '⭐',
    },
    [Events.ACHIEVEMENT_UNLOCKED]: {
        title: '🏆 Achievement Unlocked!',
        message: (d) => `🏆 You unlocked "${d.achievementName || 'Achievement'}"! ${d.description || ''}`,
        type: 'gamification',
        priority: 'medium',
        actionUrl: () => '/gamification',
        icon: '🏆',
    },
    [Events.COURSE_ENROLLED]: {
        title: '📚 Enrolled in Course',
        message: (d) => `You have been successfully enrolled in "${d.courseTitle || d.courseName || 'a new course'}".`,
        type: 'general',
        priority: 'low',
        actionUrl: () => '/courses',
        icon: '📚',
    },
    [Events.JOB_APPLIED]: {
        title: '💼 Job Application Submitted',
        message: (d) => `Your application for "${d.jobTitle || 'a position'}" at ${d.company || 'the company'} has been submitted.`,
        type: 'placement',
        priority: 'medium',
        actionUrl: () => '/career/jobs',
        icon: '💼',
    },
    [Events.INTERVIEW_COMPLETED]: {
        title: '🎤 Mock Interview Completed',
        message: (d) => `Your mock interview session is complete. Overall score: ${d.overallScore ?? 'N/A'}%. Check your feedback for improvement areas.`,
        type: 'placement',
        priority: 'medium',
        actionUrl: () => '/career/interview',
        icon: '🎤',
    },
    [Events.FORUM_POST_CREATED]: {
        title: '💬 New Forum Post',
        message: (d) => `New discussion: "${d.postTitle || 'A topic'}" was posted in ${d.category || 'the forum'}.`,
        type: 'forum',
        priority: 'low',
        actionUrl: () => '/forum',
        icon: '💬',
    },
    [Events.FEE_DUE]: {
        title: '💳 Fee Payment Due',
        message: (d) => `Your fee payment of ₹${d.amount || 'N/A'} is due on ${d.dueDate ? new Date(d.dueDate).toDateString() : 'soon'}. Please pay before the deadline to avoid late fees.`,
        type: 'system',
        priority: 'urgent',
        actionUrl: () => '/finance/fees',
        icon: '💳',
        sendEmail: true,
    },
};
export class EventNotificationService {
    io = null;
    /**
     * Initialize with Socket.IO server for real-time delivery.
     * Call this once from server.ts after io is created.
     */
    init(io) {
        this.io = io;
        this.registerListeners();
        logger.info('[EventNotificationService] Initialized with Socket.IO — notification pipeline active');
    }
    registerListeners() {
        for (const [event, template] of Object.entries(NOTIFICATION_TEMPLATES)) {
            if (!template)
                continue;
            eventBus.on(event, async (data) => {
                try {
                    await this.handleEvent(event, template, data);
                }
                catch (err) {
                    logger.warn({ event, err: err.message }, '[EventNotificationService] Notification delivery error');
                }
            });
        }
        // Special: attendance shortage alert also notifies parent
        eventBus.on(Events.ATTENDANCE_MARKED, async (data) => {
            if (data?.attendancePct !== undefined && data.attendancePct < 75 && data?.userId) {
                try {
                    await this.notifyParentOfAttendanceShortage(data);
                }
                catch (err) {
                    logger.warn({ err: err.message }, '[EventNotificationService] Parent attendance alert error');
                }
            }
        });
    }
    async handleEvent(event, template, data) {
        const userId = data?.userId || data?.studentId;
        if (!userId)
            return;
        const title = template.title;
        const message = template.message(data);
        const priority = typeof template.priority === 'function'
            ? template.priority(data)
            : template.priority;
        const actionUrl = template.actionUrl ? template.actionUrl(data) : undefined;
        // 1. Persist notification to MongoDB
        const notification = await Notification.create({
            userId,
            title,
            message,
            type: template.type,
            priority,
            actionUrl,
            icon: template.icon,
            metadata: { sourceEvent: event, ...data },
        });
        logger.debug({ userId, event, title }, '[EventNotificationService] Notification created');
        // 2. Real-time delivery via Socket.IO to user's room
        if (this.io) {
            const payload = {
                _id: notification._id,
                id: notification._id,
                title,
                message,
                type: template.type,
                priority,
                actionUrl,
                icon: template.icon,
                isRead: false,
                createdAt: notification.createdAt,
            };
            const uStr = userId.toString();
            this.io.to(`user:${uStr}`).emit('notification:push', payload);
            this.io.to(uStr).emit('notification:push', payload);
            this.io.to(`user:${uStr}`).emit('notification', payload);
            this.io.to(uStr).emit('notification', payload);
        }
        // 3. Email delivery for high-priority events (if SMTP configured)
        if (template.sendEmail && priority === 'urgent') {
            this.sendEmailNotification(userId.toString(), title, message).catch(() => { });
        }
    }
    async notifyParentOfAttendanceShortage(data) {
        const student = await User.findById(data.userId).select('name parentId').lean();
        if (!student)
            return;
        let parentId = student.parentId?.toString() || null;
        if (!parentId) {
            const parentUser = await User.findOne({
                $or: [
                    { linkedStudentId: data.userId },
                    { linkedStudentIds: data.userId },
                ],
            }).select('_id').lean();
            if (parentUser)
                parentId = parentUser._id.toString();
        }
        if (!parentId)
            return;
        const message = `⚠️ Attendance Alert: ${student.name}'s attendance in ${data.subject || 'class'} has dropped to ${data.attendancePct}%. Please ensure they attend more classes to avoid exam ineligibility.`;
        const notification = await Notification.create({
            userId: parentId,
            title: '⚠️ Child Attendance Alert',
            message,
            type: 'attendance',
            priority: 'urgent',
            actionUrl: '/parent/dashboard',
            icon: '⚠️',
            metadata: { studentId: data.userId, attendancePct: data.attendancePct, subject: data.subject },
        });
        if (this.io) {
            const payload = {
                _id: notification._id,
                id: notification._id,
                title: '⚠️ Child Attendance Alert',
                message,
                type: 'attendance',
                priority: 'urgent',
                actionUrl: '/parent/dashboard',
                icon: '⚠️',
                isRead: false,
                createdAt: notification.createdAt,
            };
            this.io.to(`user:${parentId}`).emit('notification:push', payload);
            this.io.to(parentId).emit('notification:push', payload);
            this.io.to(`user:${parentId}`).emit('notification', payload);
            this.io.to(parentId).emit('notification', payload);
        }
        logger.info({ parentId, studentId: data.userId, attendancePct: data.attendancePct }, '[EventNotificationService] Parent attendance alert sent');
    }
    /**
     * Send email notification via Nodemailer (SMTP).
     * Only fires if SMTP credentials are configured in .env
     */
    async sendEmailNotification(userId, subject, body) {
        const smtpHost = process.env.SMTP_HOST;
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;
        if (!smtpHost || !smtpUser || !smtpPass) {
            logger.debug('[EventNotificationService] SMTP not configured — email notification skipped');
            return;
        }
        try {
            const user = await User.findById(userId).select('email name').lean();
            if (!user || !user.email)
                return;
            // @ts-ignore
            const nodemailerModule = await import('nodemailer').catch(() => null);
            if (!nodemailerModule)
                return;
            const transporter = (nodemailerModule.default || nodemailerModule).createTransport({
                host: smtpHost,
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: process.env.SMTP_SECURE === 'true',
                auth: { user: smtpUser, pass: smtpPass },
            });
            await transporter.sendMail({
                from: `"EduSphere EDEN" <${smtpUser}>`,
                to: user.email,
                subject: `EduSphere: ${subject}`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0f172a; color: #e2e8f0; border-radius: 12px;">
            <h2 style="color: #6366f1; margin-bottom: 16px;">🎓 EduSphere</h2>
            <h3 style="color: #f1f5f9;">${subject}</h3>
            <p style="color: #94a3b8; line-height: 1.6;">${body}</p>
            <hr style="border-color: #1e293b; margin: 24px 0;" />
            <p style="color: #475569; font-size: 12px;">EduSphere AI-Powered Learning Platform · <a href="http://localhost:5173" style="color: #6366f1;">Open EduSphere</a></p>
          </div>
        `,
            });
            logger.info({ userId, email: user.email, subject }, '[EventNotificationService] Email sent');
        }
        catch (err) {
            logger.warn({ err: err.message, userId }, '[EventNotificationService] Email send failed');
        }
    }
}
// Singleton export
export const eventNotificationService = new EventNotificationService();
