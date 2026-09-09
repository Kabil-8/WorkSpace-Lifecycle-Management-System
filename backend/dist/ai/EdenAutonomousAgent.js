/**
 * EDEN Autonomous Agent — Phase 12
 *
 * EDEN proactively monitors the platform and sends smart notifications
 * without waiting for user prompts. Runs as cron jobs.
 *
 * Jobs:
 * 1. Attendance Risk Alert (daily at 8 PM) — warns students below 75%
 * 2. Assignment Deadline Reminders (daily at 9 AM) — due within 24h
 * 3. Placement Readiness Check (weekly Sunday) — students with < 60% readiness
 * 4. Proactive Quiz Suggestion (weekly Monday) — based on weak subjects
 */
import User from '../models/User.js';
import { StudentAttendance } from '../models/attendance/StudentAttendance.js';
import Notification from '../models/Notification.js';
import Assignment from '../models/Assignment.js';
import Gamification from '../models/Gamification.js';
import { GeminiService } from '../ai/GeminiService.js';
import { logger } from '../config/logger.js';
export class EdenAutonomousAgent {
    /**
     * JOB 1: Attendance Risk Alert
     * Runs daily — finds students who dropped below 75% attendance
     * and sends them a personalized Gemini-generated warning
     */
    static async attendanceRiskAlert() {
        logger.info('[EDEN Autonomous] Running attendance risk check...');
        try {
            const students = await User.find({ role: 'student', isActive: { $ne: false } }).lean();
            for (const student of students) {
                const total = await StudentAttendance.countDocuments({ studentId: student._id });
                const present = await StudentAttendance.countDocuments({ studentId: student._id, status: 'Present' });
                if (total < 5)
                    continue; // Not enough records
                const pct = Math.round((present / total) * 100);
                if (pct >= 75)
                    continue; // Not at risk
                const shortfall = Math.ceil(0.75 * total) - present;
                const sessionsNeeded = shortfall > 0
                    ? Math.ceil(shortfall / (1 - 0.75))
                    : 0;
                // Generate personalized warning via Gemini
                const message = await EdenAutonomousAgent.generateAlertMessage(`Student ${student.name} has ${pct}% attendance (${present}/${total} classes). They need ${sessionsNeeded} more consecutive attended classes to reach 75%. Write a short, empathetic but urgent 2-sentence notification warning them.`, `⚠️ Attendance Alert: Your attendance is ${pct}% — below the 75% threshold. You need to attend ${sessionsNeeded} more classes to become eligible for exams.`);
                await Notification.create({
                    userId: student._id,
                    title: `⚠️ EDEN Alert: Attendance at ${pct}%`,
                    message,
                    type: 'alert',
                    priority: pct < 65 ? 'urgent' : 'high',
                });
            }
            logger.info('[EDEN Autonomous] Attendance risk alerts sent.');
        }
        catch (err) {
            logger.error({ err: err.message }, '[EDEN Autonomous] Attendance alert failed');
        }
    }
    /**
     * JOB 2: Assignment Deadline Reminders
     * Runs daily — finds assignments due in the next 24 hours
     */
    static async assignmentDeadlineReminders() {
        logger.info('[EDEN Autonomous] Running assignment deadline check...');
        try {
            const tomorrow = new Date();
            tomorrow.setHours(23, 59, 59, 999);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const soon = new Date();
            soon.setHours(0, 0, 0, 0);
            const assignments = await Assignment.find({
                dueDate: { $gte: soon, $lte: tomorrow },
                status: { $in: ['todo', 'in_progress'] },
            }).lean();
            for (const assignment of assignments) {
                const students = await User.find({
                    role: 'student',
                    department: assignment.department,
                    isActive: { $ne: false },
                }).select('_id').lean();
                for (const student of students) {
                    const message = `📅 Assignment **"${assignment.title}"** for ${assignment.courseName} is due **tomorrow**. Submit now to avoid penalties.`;
                    await Notification.create({
                        userId: student._id,
                        title: `📅 Due Tomorrow: ${assignment.title}`,
                        message,
                        type: 'reminder',
                        priority: 'high',
                    });
                }
            }
            logger.info(`[EDEN Autonomous] Deadline reminders sent for ${assignments.length} assignments.`);
        }
        catch (err) {
            logger.error({ err: err.message }, '[EDEN Autonomous] Deadline reminder failed');
        }
    }
    /**
     * JOB 3: Placement Readiness Check (Weekly)
     * Alerts final-year students with low placement readiness
     */
    static async placementReadinessCheck() {
        logger.info('[EDEN Autonomous] Running placement readiness check...');
        try {
            const students = await User.find({
                role: 'student',
                semester: { $in: [7, 8] }, // Final year
                isActive: { $ne: false },
            }).lean();
            for (const student of students) {
                const gami = await Gamification.findOne({ userId: student._id }).lean();
                const readiness = gami?.placementReadinessPct ?? 40;
                if (readiness >= 70)
                    continue; // Already good
                const tips = readiness < 50
                    ? 'Complete your resume, solve 10+ LeetCode problems, and get certifications.'
                    : 'Polish your resume, practice mock interviews, and apply to internships.';
                await Notification.create({
                    userId: student._id,
                    title: `🎯 EDEN: Placement Readiness at ${readiness}%`,
                    message: `Your placement readiness score is **${readiness}%**. To improve: ${tips} Open the Placement portal for personalized action items.`,
                    type: 'recommendation',
                    priority: readiness < 50 ? 'urgent' : 'high',
                });
            }
            logger.info('[EDEN Autonomous] Placement readiness checks complete.');
        }
        catch (err) {
            logger.error({ err: err.message }, '[EDEN Autonomous] Placement check failed');
        }
    }
    /**
     * Helper: Generate an alert message via Gemini or use fallback
     */
    static async generateAlertMessage(prompt, fallback) {
        try {
            const key = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY;
            if (!key || key.length < 10)
                return fallback;
            const res = await GeminiService.chat('You are EDEN, the AI OS of EduSphere. Write concise, empathetic notification messages. Keep under 2 sentences.', prompt, [], 'system');
            return res.text || fallback;
        }
        catch {
            return fallback;
        }
    }
}
