import mongoose from 'mongoose';
import { VideoCourse, VideoProgress, VideoCertificate } from '../models/VideoCourse.js';
import { eventBus, Events } from '../events/eventBus.js';
import { logger } from '../config/logger.js';
function getUid(req) {
    const raw = req.user?._id || req.user?.id;
    return mongoose.Types.ObjectId.isValid(raw) ? new mongoose.Types.ObjectId(raw) : null;
}
export class VideoCourseController {
    /**
     * GET /api/v1/learn
     * Public course catalog. Can be browsed without login.
     * Query params: category, level, q (search query).
     */
    static async getCatalog(req, res) {
        try {
            const { category, level, q } = req.query;
            const filter = { published: true };
            if (category)
                filter.category = category;
            if (level)
                filter.level = level;
            if (q) {
                filter.$or = [
                    { title: { $regex: String(q), $options: 'i' } },
                    { description: { $regex: String(q), $options: 'i' } },
                    { skills: { $in: [new RegExp(String(q), 'i')] } }
                ];
            }
            const courses = await VideoCourse.find(filter).sort({ enrolledCount: -1 }).lean();
            // If user is authenticated, attach user's progress summary for each course
            const uId = getUid(req);
            let progressMap = {};
            if (uId && courses.length > 0) {
                const cIds = courses.map(c => c._id);
                const progressList = await VideoProgress.find({ userId: uId, videoCourseId: { $in: cIds } }).lean();
                progressList.forEach(p => {
                    progressMap[p.videoCourseId.toString()] = p.completionPct;
                });
            }
            const enriched = courses.map(c => ({
                ...c,
                userCompletionPct: progressMap[c._id.toString()] || 0,
                isEnrolled: (progressMap[c._id.toString()] ?? -1) >= 0,
            }));
            return res.json({
                success: true,
                data: {
                    courses: enriched,
                    total: enriched.length,
                }
            });
        }
        catch (err) {
            logger.error({ err: err.message }, '[VideoCourseController] getCatalog error');
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * GET /api/v1/learn/:courseSlug
     * Public video course details & section outline.
     */
    static async getCourseBySlug(req, res) {
        try {
            const { courseSlug } = req.params;
            const course = await VideoCourse.findOne({ slug: courseSlug, published: true }).lean();
            if (!course)
                return res.status(404).json({ success: false, message: 'Video course not found' });
            const uId = getUid(req);
            let userProgress = null;
            if (uId) {
                userProgress = await VideoProgress.findOne({ userId: uId, videoCourseId: course._id }).lean();
            }
            return res.json({
                success: true,
                data: {
                    course,
                    userProgress
                }
            });
        }
        catch (err) {
            logger.error({ err: err.message }, '[VideoCourseController] getCourseBySlug error');
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * GET /api/v1/learn/:courseSlug/watch/:lessonId
     * Public/Auth: Retrieve video lesson content details & resources.
     */
    static async getLessonWatchDetails(req, res) {
        try {
            const { courseSlug, lessonId } = req.params;
            const course = await VideoCourse.findOne({ slug: courseSlug, published: true }).lean();
            if (!course)
                return res.status(404).json({ success: false, message: 'Course not found' });
            let targetLesson = null;
            let targetSection = null;
            for (const sec of course.sections || []) {
                for (const les of sec.lessons || []) {
                    if (les.lessonId === lessonId) {
                        targetLesson = les;
                        targetSection = sec;
                        break;
                    }
                }
                if (targetLesson)
                    break;
            }
            if (!targetLesson) {
                return res.status(404).json({ success: false, message: 'Lesson not found in course' });
            }
            return res.json({
                success: true,
                data: {
                    courseTitle: course.title,
                    courseSlug: course.slug,
                    sectionTitle: targetSection?.title || '',
                    lesson: targetLesson,
                }
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * GET /api/v1/learn/:courseSlug/progress
     * JWT REQUIRED: Get student's detailed watch progress for a video course.
     */
    static async getProgress(req, res) {
        try {
            const uId = getUid(req);
            if (!uId)
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            const { courseSlug } = req.params;
            const course = await VideoCourse.findOne({ slug: courseSlug }).lean();
            if (!course)
                return res.status(404).json({ success: false, message: 'Course not found' });
            const progress = await VideoProgress.findOne({ userId: uId, videoCourseId: course._id }).lean();
            return res.json({
                success: true,
                data: {
                    progress: progress || {
                        completionPct: 0,
                        completedLessonIds: [],
                        watchedLessonIds: [],
                        completed: false
                    }
                }
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * POST /api/v1/learn/:courseSlug/progress
     * JWT REQUIRED: Record lesson watch completion and update user completion percentage.
     */
    static async updateProgress(req, res) {
        try {
            const uId = getUid(req);
            if (!uId)
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            const { courseSlug } = req.params;
            const { lessonId, watchedTimeSeconds = 0, isCompleted = true } = req.body;
            const course = await VideoCourse.findOne({ slug: courseSlug });
            if (!course)
                return res.status(404).json({ success: false, message: 'Course not found' });
            // Total lessons count across all sections
            const totalLessons = (course.sections || []).reduce((acc, sec) => acc + (sec.lessons || []).length, 0);
            let progress = await VideoProgress.findOne({ userId: uId, videoCourseId: course._id });
            if (!progress) {
                progress = new VideoProgress({
                    userId: uId,
                    videoCourseId: course._id,
                    watchedLessonIds: [],
                    completedLessonIds: [],
                    completionPct: 0,
                    completed: false
                });
            }
            if (lessonId) {
                if (!progress.watchedLessonIds.includes(lessonId)) {
                    progress.watchedLessonIds.push(lessonId);
                }
                if (isCompleted && !progress.completedLessonIds.includes(lessonId)) {
                    progress.completedLessonIds.push(lessonId);
                }
                progress.lastWatchedLessonId = lessonId;
            }
            progress.lastWatchedTimeSeconds = watchedTimeSeconds;
            const completedCount = progress.completedLessonIds.length;
            const completionPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 100;
            progress.completionPct = completionPct;
            if (completionPct >= 100 && !progress.completed) {
                progress.completed = true;
                progress.completedAt = new Date();
            }
            await progress.save();
            // Emit learning telemetry events
            if (isCompleted) {
                eventBus.emit(Events.VIDEO_COMPLETED, {
                    userId: uId.toString(),
                    studentId: uId,
                    courseId: course._id,
                    topicId: lessonId,
                    duration: watchedTimeSeconds,
                });
            }
            else {
                eventBus.emit(Events.VIDEO_STARTED, {
                    userId: uId.toString(),
                    studentId: uId,
                    courseId: course._id,
                    topicId: lessonId,
                });
            }
            return res.json({
                success: true,
                message: 'Progress updated successfully!',
                data: {
                    completionPct: progress.completionPct,
                    completedLessonIds: progress.completedLessonIds,
                    completed: progress.completed
                }
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * GET /api/v1/learn/:courseSlug/certificate
     * JWT REQUIRED: Issue or fetch completion certificate if course progress is 100%.
     */
    static async getCertificate(req, res) {
        try {
            const uId = getUid(req);
            if (!uId)
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            const { courseSlug } = req.params;
            const course = await VideoCourse.findOne({ slug: courseSlug }).lean();
            if (!course)
                return res.status(404).json({ success: false, message: 'Course not found' });
            const progress = await VideoProgress.findOne({ userId: uId, videoCourseId: course._id }).lean();
            if (!progress || progress.completionPct < 100) {
                return res.status(400).json({
                    success: false,
                    message: `Certificate not available yet. Current course progress is ${progress?.completionPct || 0}%. You must reach 100% completion to earn your certificate.`
                });
            }
            let certificate = await VideoCertificate.findOne({ userId: uId, videoCourseId: course._id }).lean();
            if (!certificate) {
                const certId = `EDUSPHERE-CERT-${Date.now().toString(36).toUpperCase()}-${uId.toString().slice(-4).toUpperCase()}`;
                const studentName = req.user.name || 'Student Candidate';
                const newCert = await VideoCertificate.create({
                    certificateId: certId,
                    userId: uId,
                    videoCourseId: course._id,
                    studentName,
                    courseTitle: course.title,
                    issuedAt: new Date(),
                });
                certificate = newCert.toObject();
            }
            return res.json({
                success: true,
                data: {
                    certificate
                }
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
}
