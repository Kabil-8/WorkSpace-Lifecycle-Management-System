import Course from '../models/Course.js';
import UserCourseProgress from '../models/UserCourseProgress.js';
import Gamification from '../models/Gamification.js';
import StudentDigitalTwin from '../models/StudentDigitalTwin.js';
import { RedisCache, CacheKeys, CacheTTL } from '../cache/RedisCache.js';
export class CourseController {
    static async getAll(req, res) {
        try {
            const { department, level, search, page = '1', limit = '20' } = req.query;
            const filters = { status: 'published' };
            if (department)
                filters.department = department;
            if (level)
                filters.level = level;
            if (search)
                filters.$text = { $search: search };
            const cacheKey = CacheKeys.courses(JSON.stringify(filters) + page + limit);
            const cached = await RedisCache.get(cacheKey);
            if (cached)
                return res.json({ success: true, ...cached, cached: true });
            const skip = (parseInt(page) - 1) * parseInt(limit);
            const [courses, total] = await Promise.all([
                Course.find(filters).populate('instructor', 'name avatarUrl')
                    .sort({ enrolledCount: -1 }).skip(skip).limit(parseInt(limit)),
                Course.countDocuments(filters),
            ]);
            const result = { data: courses, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) };
            await RedisCache.set(cacheKey, result, CacheTTL.courses);
            return res.json({ success: true, ...result });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    static async getById(req, res) {
        try {
            const course = await Course.findById(req.params.id).populate('instructor', 'name avatarUrl bio');
            if (!course)
                return res.status(404).json({ success: false, message: 'Course not found' });
            return res.json({ success: true, data: course });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    static async create(req, res) {
        try {
            const course = await Course.create({
                ...req.body,
                instructor: req.user._id,
                instructorName: req.user.name,
                department: req.body.department || req.user.department,
            });
            await RedisCache.flush('courses:*');
            return res.status(201).json({ success: true, data: course, message: 'Course created successfully.' });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    static async update(req, res) {
        try {
            const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!course)
                return res.status(404).json({ success: false, message: 'Course not found' });
            await RedisCache.flush('courses:*');
            return res.json({ success: true, data: course, message: 'Course updated.' });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    static async delete(req, res) {
        try {
            await Course.findByIdAndDelete(req.params.id);
            await RedisCache.flush('courses:*');
            return res.json({ success: true, message: 'Course deleted.' });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * GET /api/v1/courses/:id/progress
     * Retrieves per-student completed lessons and progress percentage from MongoDB
     */
    static async getUserProgress(req, res) {
        try {
            const courseId = req.params.id;
            const userId = req.user._id;
            let progress = await UserCourseProgress.findOne({ userId, courseId });
            if (!progress) {
                progress = await UserCourseProgress.create({
                    userId,
                    courseId,
                    completedLessonKeys: [],
                    completedCount: 0,
                    totalLessons: 11,
                    progressPct: 0,
                    isCompleted: false,
                });
            }
            return res.json({
                success: true,
                data: {
                    completedLessonKeys: progress.completedLessonKeys,
                    completedCount: progress.completedCount,
                    totalLessons: progress.totalLessons,
                    progressPct: progress.progressPct,
                    isCompleted: progress.isCompleted,
                }
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * POST /api/v1/courses/:id/progress
     * Saves completed lesson key to MongoDB for student, updates percentage & awards XP
     */
    static async updateUserProgress(req, res) {
        try {
            const courseId = req.params.id;
            const userId = req.user._id;
            const { lessonKey, isCompleted, totalLessons = 11 } = req.body;
            let progress = await UserCourseProgress.findOne({ userId, courseId });
            if (!progress) {
                progress = new UserCourseProgress({
                    userId,
                    courseId,
                    completedLessonKeys: [],
                    completedCount: 0,
                    totalLessons,
                    progressPct: 0,
                    isCompleted: false,
                });
            }
            let keysSet = new Set(progress.completedLessonKeys || []);
            const wasAlreadyCompleted = keysSet.has(lessonKey);
            if (isCompleted) {
                keysSet.add(lessonKey);
            }
            else {
                keysSet.delete(lessonKey);
            }
            const updatedKeys = Array.from(keysSet);
            const count = updatedKeys.length;
            const pct = Math.min(100, Math.round((count / totalLessons) * 100));
            progress.completedLessonKeys = updatedKeys;
            progress.completedCount = count;
            progress.totalLessons = totalLessons;
            progress.progressPct = pct;
            progress.isCompleted = pct >= 100;
            await progress.save();
            // Award +50 XP on newly completed lesson
            if (isCompleted && !wasAlreadyCompleted) {
                try {
                    let gami = await Gamification.findOne({ userId });
                    if (gami) {
                        gami.xp += 50;
                        await gami.save();
                    }
                    let twin = await StudentDigitalTwin.findOne({ userId });
                    if (twin && twin.predictions) {
                        twin.predictions.courseCompletionRatePct = Math.min(100, (twin.predictions.courseCompletionRatePct || 0) + 2);
                        await twin.save();
                    }
                }
                catch {
                    // non-critical
                }
            }
            return res.json({
                success: true,
                data: {
                    completedLessonKeys: progress.completedLessonKeys,
                    completedCount: progress.completedCount,
                    totalLessons: progress.totalLessons,
                    progressPct: progress.progressPct,
                    isCompleted: progress.isCompleted,
                },
                message: isCompleted ? 'Lesson marked complete & saved to database (+50 XP).' : 'Lesson un-marked.'
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * POST /api/v1/courses/:id/materials
     * Allows teachers to upload / add video, quiz, game, assignment, or reading materials to a course section
     */
    static async addMaterial(req, res) {
        try {
            const courseId = req.params.id;
            const { sectionId = 'sec-1', title, type, duration = 30, contentUrl, description, gameConfig, quizQuestions, assignmentDetails } = req.body;
            if (!title || !type) {
                return res.status(400).json({ success: false, message: 'Material title and type (video, quiz, game, assignment, reading) are required.' });
            }
            const course = await Course.findById(courseId);
            if (!course)
                return res.status(404).json({ success: false, message: 'Course not found' });
            const newModule = {
                id: `mod-${Date.now()}`,
                title,
                type,
                duration: parseInt(String(duration), 10) || 30,
                contentUrl,
                description,
                gameConfig,
                quizQuestions,
                assignmentDetails,
                isCompleted: false,
            };
            let sec = course.curriculum.find(s => s.id === sectionId);
            if (!sec) {
                if (course.curriculum.length > 0) {
                    sec = course.curriculum[0];
                }
                else {
                    sec = { id: 'sec-1', title: 'Module 1: Foundations & Core Concepts', modules: [] };
                    course.curriculum.push(sec);
                }
            }
            sec.modules.push(newModule);
            await course.save();
            await RedisCache.flush('courses:*');
            return res.status(201).json({
                success: true,
                data: newModule,
                message: `Teacher material '${title}' (${type}) added to ${course.title} successfully ✓`,
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
}
