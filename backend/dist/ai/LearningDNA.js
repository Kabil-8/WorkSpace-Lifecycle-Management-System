import { LearningEvent } from '../models/LearningEvent.js';
import { logger } from '../config/logger.js';
export class LearningDNA {
    /**
     * Computes a comprehensive Learning DNA profile from real LearningEvent telemetry.
     * This is what feeds Digital Twin personalization and EDEN recommendations.
     */
    static async compute(userId, windowDays = 30) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - windowDays);
        try {
            const events = await LearningEvent.find({
                userId,
                timestamp: { $gte: cutoff },
            }).lean();
            if (events.length === 0) {
                return LearningDNA.emptyProfile(userId);
            }
            // Count by event type
            const byType = LearningDNA.groupByType(events);
            const videoStarted = byType['VIDEO_STARTED']?.length || 0;
            const videoCompleted = byType['VIDEO_COMPLETED']?.length || 0;
            const quizEvents = byType['QUIZ_COMPLETED'] || [];
            const assignmentEvents = byType['ASSIGNMENT_SUBMITTED'] || [];
            const codeEvents = byType['CODE_EXECUTED'] || [];
            const noteEvents = byType['NOTE_CREATED'] || [];
            const recallEvents = byType['RECALL_SESSION'] || [];
            const loginEvents = byType['LOGIN'] || [];
            const forumEvents = byType['FORUM_POST'] || [];
            const interviewEvents = byType['INTERVIEW_COMPLETED'] || [];
            const resumeEvents = byType['RESUME_UPDATED'] || [];
            // Compute quiz average score
            const quizScores = quizEvents.map((e) => e.score).filter((s) => s !== undefined && s !== null);
            const quizAvgScore = quizScores.length > 0
                ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
                : 0;
            // Total study time (sum of durations in seconds → minutes)
            const totalStudySeconds = events.reduce((acc, e) => acc + (e.duration || 0), 0);
            const totalStudyMinutes = Math.round(totalStudySeconds / 60);
            // Login days = unique days with login events
            const loginDays = new Set(loginEvents.map((e) => new Date(e.timestamp).toDateString())).size;
            // Streak: consecutive days with any learning activity in last 30 days
            const activeDates = [...new Set(events.map((e) => new Date(e.timestamp).toDateString()))].sort();
            const streakDays = LearningDNA.computeStreak(activeDates);
            // Last active date
            const timestamps = events.map((e) => new Date(e.timestamp).getTime());
            const lastActiveDate = timestamps.length > 0 ? new Date(Math.max(...timestamps)) : null;
            // Top courses by event volume
            const courseCount = {};
            for (const e of events) {
                if (e.courseId) {
                    const cid = e.courseId.toString();
                    courseCount[cid] = (courseCount[cid] || 0) + 1;
                }
            }
            const topCourses = Object.entries(courseCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([courseId, eventCount]) => ({ courseId, eventCount }));
            // Learning velocity based on activity trend (first half vs second half of window)
            const midCutoff = new Date(cutoff.getTime() + (Date.now() - cutoff.getTime()) / 2);
            const recentEvents = events.filter((e) => new Date(e.timestamp) >= midCutoff).length;
            const olderEvents = events.length - recentEvents;
            const learningVelocity = events.length < 3 ? 'inactive'
                : recentEvents > olderEvents * 1.2 ? 'accelerating'
                    : recentEvents < olderEvents * 0.8 ? 'slowing'
                        : 'steady';
            return {
                userId,
                totalEvents: events.length,
                totalStudyMinutes,
                videosStarted: videoStarted,
                videosCompleted: videoCompleted,
                videoCompletionRate: videoStarted > 0 ? Math.round((videoCompleted / videoStarted) * 100) : 0,
                quizAttempts: quizEvents.length,
                quizAvgScore,
                assignmentsSubmitted: assignmentEvents.length,
                codeExecutions: codeEvents.length,
                notesCreated: noteEvents.length,
                recallSessions: recallEvents.length,
                forumPosts: forumEvents.length,
                loginDays,
                streakDays,
                lastActiveDate,
                learningVelocity,
                topCourses,
                interviewsCompleted: interviewEvents.length,
                resumeUpdates: resumeEvents.length,
                computedAt: new Date(),
            };
        }
        catch (err) {
            logger.error({ userId, err: err.message }, '[LearningDNA] Computation error');
            return LearningDNA.emptyProfile(userId);
        }
    }
    static groupByType(events) {
        return events.reduce((acc, e) => {
            const type = e.eventType || 'UNKNOWN';
            if (!acc[type])
                acc[type] = [];
            acc[type].push(e);
            return acc;
        }, {});
    }
    static computeStreak(sortedDates) {
        if (sortedDates.length === 0)
            return 0;
        let streak = 1;
        let maxStreak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
            const prev = new Date(sortedDates[i - 1]);
            const curr = new Date(sortedDates[i]);
            const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
            if (Math.round(diff) === 1) {
                streak++;
                maxStreak = Math.max(maxStreak, streak);
            }
            else {
                streak = 1;
            }
        }
        return maxStreak;
    }
    static emptyProfile(userId) {
        return {
            userId,
            totalEvents: 0,
            totalStudyMinutes: 0,
            videosStarted: 0,
            videosCompleted: 0,
            videoCompletionRate: 0,
            quizAttempts: 0,
            quizAvgScore: 0,
            assignmentsSubmitted: 0,
            codeExecutions: 0,
            notesCreated: 0,
            recallSessions: 0,
            forumPosts: 0,
            loginDays: 0,
            streakDays: 0,
            lastActiveDate: null,
            learningVelocity: 'inactive',
            topCourses: [],
            interviewsCompleted: 0,
            resumeUpdates: 0,
            computedAt: new Date(),
        };
    }
}
