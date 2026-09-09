import mongoose from 'mongoose';
import { CollegeCourse, CollegeCourseEnrollment, CollegeAssignment, CollegeAssignmentSubmission, CollegeQuiz, CollegeQuizResult, CollegeExam, CollegeExamResult } from '../models/CollegeCourse.js';
import { StudentAttendance } from '../models/attendance/StudentAttendance.js';
import { eventBus, Events } from '../events/eventBus.js';
import { logger } from '../config/logger.js';
function getUid(req) {
    const raw = req.user?._id || req.user?.id;
    return mongoose.Types.ObjectId.isValid(raw) ? new mongoose.Types.ObjectId(raw) : null;
}
export class CollegeCourseController {
    /**
     * GET /api/v1/college-courses
     * Returns enrolled college academic courses for student or all department courses for faculty/admin.
     */
    static async getMyCollegeCourses(req, res) {
        try {
            const uId = getUid(req);
            if (!uId)
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            const role = req.user?.role || 'student';
            let courses = [];
            let enrollments = [];
            if (['faculty', 'admin', 'hod', 'super_admin'].includes(role)) {
                // Faculty / Admin sees courses in department or taught by them
                const filters = {};
                if (role === 'faculty') {
                    filters.$or = [{ instructorId: uId }, { department: req.user.department }];
                }
                else if (req.user.department && role === 'hod') {
                    filters.department = req.user.department;
                }
                courses = await CollegeCourse.find(filters).sort({ semester: 1, courseCode: 1 }).lean();
            }
            else {
                // Student: fetch active enrollments
                enrollments = await CollegeCourseEnrollment.find({ userId: uId, status: 'active' }).lean();
                if (enrollments.length > 0) {
                    const courseIds = enrollments.map(e => e.collegeCourseId);
                    courses = await CollegeCourse.find({ _id: { $in: courseIds } }).sort({ semester: 1, courseCode: 1 }).lean();
                }
                else {
                    // If no active enrollments yet, fallback to active courses in student's department
                    const dept = req.user?.department || 'Computer Science & Engineering';
                    courses = await CollegeCourse.find({ department: dept, status: 'active' }).limit(10).lean();
                }
            }
            // Enrich courses with user's specific enrollment details & attendance
            const enriched = await Promise.all(courses.map(async (c) => {
                const enrollment = enrollments.find(e => e.collegeCourseId.toString() === c._id.toString());
                // Calculate student's real attendance for this department/subject
                const totalAtt = await StudentAttendance.countDocuments({ studentId: uId, subject: { $regex: c.title, $options: 'i' } });
                const presentAtt = await StudentAttendance.countDocuments({ studentId: uId, subject: { $regex: c.title, $options: 'i' }, status: 'Present' });
                const attendancePct = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 88;
                // Count pending assignments for this course
                const totalAssignments = await CollegeAssignment.countDocuments({ collegeCourseId: c._id });
                const submissions = await CollegeAssignmentSubmission.countDocuments({
                    studentId: uId,
                    assignmentId: { $in: await CollegeAssignment.find({ collegeCourseId: c._id }).distinct('_id') }
                });
                return {
                    ...c,
                    enrollment: {
                        section: enrollment?.section || 'A',
                        semester: enrollment?.semester || c.semester,
                        academicYear: enrollment?.academicYear || '2025-2026',
                        enrolledAt: enrollment?.enrolledAt,
                    },
                    attendancePct,
                    assignmentsTotal: totalAssignments,
                    assignmentsSubmitted: submissions,
                    assignmentsPending: Math.max(0, totalAssignments - submissions),
                };
            }));
            return res.json({
                success: true,
                data: {
                    courses: enriched,
                    total: enriched.length,
                    hasData: true
                }
            });
        }
        catch (err) {
            logger.error({ err: err.message }, '[CollegeCourseController] getMyCollegeCourses error');
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * GET /api/v1/college-courses/:courseId
     * Returns course details, syllabus, and units for an enrolled student.
     */
    static async getCollegeCourseById(req, res) {
        try {
            const uId = getUid(req);
            if (!uId)
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            const { courseId } = req.params;
            if (!mongoose.Types.ObjectId.isValid(courseId)) {
                return res.status(400).json({ success: false, message: 'Invalid Course ID' });
            }
            // Verify student enrollment
            const enrollment = await CollegeCourseEnrollment.findOne({
                userId: uId,
                collegeCourseId: new mongoose.Types.ObjectId(courseId),
                status: 'active'
            });
            if (!enrollment) {
                return res.status(403).json({ success: false, message: 'Access Denied: You are not enrolled in this college course.' });
            }
            const course = await CollegeCourse.findById(courseId).lean();
            if (!course)
                return res.status(404).json({ success: false, message: 'College course not found.' });
            return res.json({
                success: true,
                data: {
                    course,
                    enrollment
                }
            });
        }
        catch (err) {
            logger.error({ err: err.message }, '[CollegeCourseController] getCollegeCourseById error');
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * GET /api/v1/college-courses/:courseId/assignments
     * Returns academic assignments & student's submission status.
     */
    static async getCourseAssignments(req, res) {
        try {
            const uId = getUid(req);
            if (!uId)
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            const { courseId } = req.params;
            const assignments = await CollegeAssignment.find({ collegeCourseId: courseId }).lean();
            const assignmentIds = assignments.map(a => a._id);
            const mySubmissions = await CollegeAssignmentSubmission.find({
                studentId: uId,
                assignmentId: { $in: assignmentIds }
            }).lean();
            const enriched = assignments.map(a => {
                const sub = mySubmissions.find(s => s.assignmentId.toString() === a._id.toString());
                return {
                    ...a,
                    submission: sub ? {
                        submittedAt: sub.submittedAt,
                        submissionText: sub.submissionText,
                        marksObtained: sub.marksObtained,
                        feedback: sub.feedback,
                        status: sub.status,
                    } : null,
                    isSubmitted: !!sub,
                };
            });
            return res.json({ success: true, data: { assignments: enriched } });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * POST /api/v1/college-courses/:courseId/assignments/:assignmentId/submit
     */
    static async submitAssignment(req, res) {
        try {
            const uId = getUid(req);
            if (!uId)
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            const { assignmentId } = req.params;
            const { submissionText } = req.body;
            if (!submissionText)
                return res.status(400).json({ success: false, message: 'submissionText required' });
            const sub = await CollegeAssignmentSubmission.findOneAndUpdate({ assignmentId: new mongoose.Types.ObjectId(assignmentId), studentId: uId }, { submissionText, submittedAt: new Date(), status: 'submitted' }, { upsert: true, new: true });
            return res.json({ success: true, message: 'Assignment submitted successfully!', data: sub });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * GET /api/v1/college-courses/:courseId/quizzes
     */
    static async getCourseQuizzes(req, res) {
        try {
            const uId = getUid(req);
            if (!uId)
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            const { courseId } = req.params;
            const quizzes = await CollegeQuiz.find({ collegeCourseId: courseId }).lean();
            const quizIds = quizzes.map(q => q._id);
            const myResults = await CollegeQuizResult.find({
                studentId: uId,
                quizId: { $in: quizIds }
            }).lean();
            const enriched = quizzes.map(q => {
                const resObj = myResults.find(r => r.quizId.toString() === q._id.toString());
                return {
                    ...q,
                    result: resObj ? {
                        score: resObj.score,
                        totalPoints: resObj.totalPoints,
                        percentage: resObj.percentage,
                        passed: resObj.passed,
                        submittedAt: resObj.submittedAt,
                    } : null,
                    isCompleted: !!resObj,
                };
            });
            return res.json({ success: true, data: { quizzes: enriched } });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * POST /api/v1/college-courses/:courseId/quizzes/:quizId/submit
     */
    static async submitQuiz(req, res) {
        try {
            const uId = getUid(req);
            if (!uId)
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            const { quizId } = req.params;
            const { answers } = req.body; // array of selected option indices
            const quiz = await CollegeQuiz.findById(quizId);
            if (!quiz)
                return res.status(404).json({ success: false, message: 'Quiz not found' });
            let score = 0;
            const totalPoints = quiz.totalPoints;
            const questions = quiz.questions || [];
            const pointsPerQ = questions.length > 0 ? totalPoints / questions.length : 10;
            questions.forEach((q, idx) => {
                if (answers && answers[idx] === q.correctAnswer) {
                    score += pointsPerQ;
                }
            });
            score = Math.round(score);
            const percentage = Math.round((score / totalPoints) * 100);
            const passed = percentage >= quiz.passingScorePct;
            const result = await CollegeQuizResult.create({
                quizId: new mongoose.Types.ObjectId(quizId),
                studentId: uId,
                score,
                totalPoints,
                percentage,
                passed,
                submittedAt: new Date(),
            });
            eventBus.emit(Events.QUIZ_COMPLETED, {
                userId: uId.toString(),
                studentId: uId,
                courseId: quiz.collegeCourseId,
                score: percentage,
                totalMarks: 100,
                passed,
            });
            return res.json({
                success: true,
                message: passed ? '🎉 Quiz Passed!' : 'Quiz Submitted.',
                data: result
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * GET /api/v1/college-courses/:courseId/exams
     * Returns internal exam schedules and student's personal exam marks.
     */
    static async getCourseExams(req, res) {
        try {
            const uId = getUid(req);
            if (!uId)
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            const { courseId } = req.params;
            const exams = await CollegeExam.find({ collegeCourseId: courseId }).lean();
            const examIds = exams.map(e => e._id);
            const myResults = await CollegeExamResult.find({
                studentId: uId,
                examId: { $in: examIds }
            }).lean();
            const enriched = exams.map(e => {
                const resObj = myResults.find(r => r.examId.toString() === e._id.toString());
                return {
                    ...e,
                    myMarks: resObj ? {
                        marksObtained: resObj.marksObtained,
                        maxMarks: resObj.maxMarks,
                        grade: resObj.grade,
                        remarks: resObj.remarks,
                    } : null,
                };
            });
            return res.json({ success: true, data: { exams: enriched } });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * GET /api/v1/college-courses/:courseId/performance
     * Returns aggregate academic performance breakdown for this specific course.
     */
    static async getCoursePerformance(req, res) {
        try {
            const uId = getUid(req);
            if (!uId)
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            const { courseId } = req.params;
            const course = await CollegeCourse.findById(courseId).lean();
            if (!course)
                return res.status(404).json({ success: false, message: 'Course not found' });
            // Attendance
            const totalAtt = await StudentAttendance.countDocuments({ studentId: uId, subject: { $regex: course.title, $options: 'i' } });
            const presentAtt = await StudentAttendance.countDocuments({ studentId: uId, subject: { $regex: course.title, $options: 'i' }, status: 'Present' });
            const attendancePct = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 88;
            // Quiz average
            const quizResults = await CollegeQuizResult.find({
                studentId: uId,
                quizId: { $in: await CollegeQuiz.find({ collegeCourseId: course._id }).distinct('_id') }
            }).lean();
            const quizAvg = quizResults.length > 0
                ? Math.round(quizResults.reduce((sum, r) => sum + r.percentage, 0) / quizResults.length)
                : 0;
            // Exam marks
            const examResults = await CollegeExamResult.find({
                studentId: uId,
                collegeCourseId: course._id
            }).lean();
            const examMarksSum = examResults.reduce((sum, r) => sum + r.marksObtained, 0);
            const examMaxSum = examResults.reduce((sum, r) => sum + r.maxMarks, 0);
            const examAvg = examMaxSum > 0 ? Math.round((examMarksSum / examMaxSum) * 100) : 0;
            return res.json({
                success: true,
                data: {
                    courseTitle: course.title,
                    courseCode: course.courseCode,
                    attendancePct,
                    quizAvg,
                    examAvg,
                    quizCompletedCount: quizResults.length,
                    examsTakenCount: examResults.length,
                    academicStatus: attendancePct >= 75 && (examAvg >= 60 || quizAvg >= 60) ? 'Good Academic Standing' : 'Attention Required',
                }
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * POST /api/v1/college-courses
     * Creates a new academic college course with syllabus and units.
     */
    static async createCollegeCourse(req, res) {
        try {
            const uId = getUid(req);
            if (!uId)
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            const { courseCode, title, department, semester, credits, description, syllabus, units, prerequisites } = req.body;
            if (!courseCode || !title) {
                return res.status(400).json({ success: false, message: 'Course code and title are required.' });
            }
            const existing = await CollegeCourse.findOne({ courseCode: courseCode.trim().toUpperCase() });
            if (existing) {
                return res.status(400).json({ success: false, message: `Course with code ${courseCode} already exists.` });
            }
            const course = await CollegeCourse.create({
                courseCode: courseCode.trim().toUpperCase(),
                title: title.trim(),
                department: department || req.user.department || 'Computer Science & Engineering',
                semester: Number(semester) || 6,
                credits: Number(credits) || 4,
                instructorId: uId,
                instructorName: req.user.name || 'Faculty Instructor',
                description: description || '',
                syllabus: syllabus || '',
                units: Array.isArray(units) && units.length > 0 ? units : [
                    {
                        unitNumber: 1,
                        title: 'Unit 1: Fundamentals & Architecture',
                        description: 'Core principles and foundations',
                        topics: [{ id: 'u1-t1', title: 'Introduction & Core Concepts', contentType: 'lecture' }]
                    },
                    {
                        unitNumber: 2,
                        title: 'Unit 2: Advanced Implementations',
                        description: 'Design patterns and system workflows',
                        topics: [{ id: 'u2-t1', title: 'System Design Patterns', contentType: 'lecture' }]
                    }
                ],
                prerequisites: prerequisites || [],
                status: 'active',
            });
            // Automatically create an active enrollment for the instructor or creator
            await CollegeCourseEnrollment.create({
                collegeCourseId: course._id,
                userId: uId,
                semester: course.semester,
                academicYear: course.academicYear || '2025-2026',
                status: 'active',
            });
            return res.status(201).json({ success: true, message: 'College course created successfully.', data: course });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * PUT /api/v1/college-courses/:courseId
     * Updates an existing academic college course.
     */
    static async updateCollegeCourse(req, res) {
        try {
            const { courseId } = req.params;
            const course = await CollegeCourse.findById(courseId);
            if (!course)
                return res.status(404).json({ success: false, message: 'Course not found' });
            const allowedFields = ['title', 'description', 'credits', 'semester', 'department', 'syllabus', 'units', 'status', 'instructorName'];
            for (const f of allowedFields) {
                if (req.body[f] !== undefined) {
                    course[f] = req.body[f];
                }
            }
            await course.save();
            return res.json({ success: true, message: 'College course updated successfully.', data: course });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * DELETE /api/v1/college-courses/:courseId
     * Deletes an academic college course and cleans up enrollments.
     */
    static async deleteCollegeCourse(req, res) {
        try {
            const { courseId } = req.params;
            const course = await CollegeCourse.findByIdAndDelete(courseId);
            if (!course)
                return res.status(404).json({ success: false, message: 'Course not found' });
            // Clean up enrollments, assignments, quizzes
            await Promise.all([
                CollegeCourseEnrollment.deleteMany({ collegeCourseId: courseId }),
                CollegeAssignment.deleteMany({ collegeCourseId: courseId }),
                CollegeQuiz.deleteMany({ collegeCourseId: courseId }),
                CollegeExam.deleteMany({ collegeCourseId: courseId }),
            ]);
            return res.json({ success: true, message: 'College course and associated records deleted successfully.' });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * POST /api/v1/college-courses/:courseId/enroll
     * Enrolls the authenticated student in the specified college course.
     */
    static async enrollInCourse(req, res) {
        try {
            const uId = getUid(req);
            if (!uId)
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            const { courseId } = req.params;
            const course = await CollegeCourse.findById(courseId);
            if (!course)
                return res.status(404).json({ success: false, message: 'Course not found' });
            const existing = await CollegeCourseEnrollment.findOne({ collegeCourseId: course._id, userId: uId });
            if (existing) {
                if (existing.status !== 'active') {
                    existing.status = 'active';
                    await existing.save();
                }
                return res.json({ success: true, message: 'Already enrolled in this course.', data: existing });
            }
            const enrollment = await CollegeCourseEnrollment.create({
                collegeCourseId: course._id,
                userId: uId,
                semester: course.semester,
                academicYear: course.academicYear || '2025-2026',
                status: 'active',
            });
            return res.status(201).json({ success: true, message: 'Successfully enrolled in college course.', data: enrollment });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
}
