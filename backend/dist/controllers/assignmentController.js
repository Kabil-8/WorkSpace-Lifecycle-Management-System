import mongoose from 'mongoose';
import Assignment from '../models/Assignment.js';
import Notification from '../models/Notification.js';
import { eventBus, Events } from '../events/eventBus.js';
import { LearningEvent } from '../models/LearningEvent.js';
export class AssignmentController {
    static async getAll(req, res) {
        try {
            const { department, status, courseName, search, priority, page = '1', limit = '50' } = req.query;
            const role = req.user?.role || 'student';
            const filters = {};
            if (department) {
                filters.department = department;
            }
            else if (role === 'student' && req.user?.department) {
                filters.department = req.user.department;
            }
            if (courseName) {
                filters.courseName = new RegExp(courseName, 'i');
            }
            if (priority && priority !== 'all') {
                filters.priority = priority;
            }
            if (search) {
                filters.$or = [
                    { title: new RegExp(search, 'i') },
                    { courseName: new RegExp(search, 'i') },
                    { description: new RegExp(search, 'i') },
                ];
            }
            const skip = (parseInt(page) - 1) * parseInt(limit);
            const [assignments, total] = await Promise.all([
                Assignment.find(filters).sort({ dueDate: 1 }).skip(skip).limit(parseInt(limit)).lean(),
                Assignment.countDocuments(filters),
            ]);
            // If user is a student, augment assignments with their specific submission state
            const userIdStr = req.user?._id?.toString();
            const augmented = assignments.map((a) => {
                const mySub = (a.submissions || []).find((s) => s.studentId?.toString() === userIdStr);
                let studentStatus = a.status || 'todo';
                if (mySub) {
                    studentStatus = mySub.grade !== undefined && mySub.grade !== null ? 'graded' : 'submitted';
                }
                else {
                    const isOverdue = new Date(a.dueDate).getTime() < Date.now();
                    studentStatus = isOverdue ? 'overdue' : (a.status === 'in_progress' ? 'in_progress' : 'todo');
                }
                return {
                    ...a,
                    userSubmission: mySub || null,
                    computedStatus: studentStatus,
                    status: role === 'student' ? studentStatus : a.status,
                    submissionCount: (a.submissions || []).length,
                };
            });
            // If filtering by status, apply status filter on computed status
            let result = augmented;
            if (status && status !== 'all') {
                result = augmented.filter((a) => a.status === status);
            }
            return res.json({ success: true, data: result, total: result.length, page: parseInt(page) });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    static async getById(req, res) {
        try {
            const assignment = await Assignment.findById(req.params.id);
            if (!assignment)
                return res.status(404).json({ success: false, message: 'Assignment not found' });
            return res.json({ success: true, data: assignment });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    static async create(req, res) {
        try {
            let courseId = req.body.courseId;
            if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
                courseId = new mongoose.Types.ObjectId();
            }
            const assignment = await Assignment.create({
                ...req.body,
                courseId,
                instructorId: req.user._id,
                instructorName: req.user.name || 'Faculty Instructor',
                department: req.body.department || req.user.department || 'Computer Science & Engineering',
                dueDate: req.body.dueDate ? new Date(req.body.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                maxMarks: Number(req.body.maxMarks) || 100,
                priority: req.body.priority || 'medium',
                status: 'todo',
                submissions: [],
            });
            // Notify students in department
            try {
                const User = (await import('../models/User.js')).default;
                const students = await User.find({
                    role: 'student', department: assignment.department, isActive: true,
                }).select('_id');
                if (students.length > 0) {
                    await Notification.insertMany(students.map(s => ({
                        userId: s._id,
                        title: 'New Assignment Posted',
                        message: `${assignment.title} (${assignment.courseName}) is due on ${new Date(assignment.dueDate).toLocaleDateString()}`,
                        type: 'assignment',
                        priority: assignment.priority === 'urgent' ? 'urgent' : 'medium',
                        actionUrl: `/assignments`,
                    })));
                }
            }
            catch {
                // Notification failure shouldn't fail assignment creation
            }
            return res.status(201).json({ success: true, message: 'Assignment created successfully', data: assignment });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    static async update(req, res) {
        try {
            const assignment = await Assignment.findById(req.params.id);
            if (!assignment)
                return res.status(404).json({ success: false, message: 'Assignment not found' });
            const allowedFields = ['title', 'description', 'courseName', 'dueDate', 'maxMarks', 'priority', 'department', 'semester'];
            for (const field of allowedFields) {
                if (req.body[field] !== undefined) {
                    if (field === 'dueDate') {
                        assignment.dueDate = new Date(req.body.dueDate);
                    }
                    else if (field === 'maxMarks') {
                        assignment.maxMarks = Number(req.body.maxMarks);
                    }
                    else {
                        assignment[field] = req.body[field];
                    }
                }
            }
            await assignment.save();
            return res.json({ success: true, message: 'Assignment updated successfully', data: assignment });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    static async delete(req, res) {
        try {
            const assignment = await Assignment.findByIdAndDelete(req.params.id);
            if (!assignment)
                return res.status(404).json({ success: false, message: 'Assignment not found' });
            return res.json({ success: true, message: 'Assignment deleted successfully' });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    static async submit(req, res) {
        try {
            const assignment = await Assignment.findById(req.params.id);
            if (!assignment)
                return res.status(404).json({ success: false, message: 'Assignment not found' });
            const { content, fileUrl, fileName } = req.body;
            const rawFileName = fileName || (fileUrl ? fileUrl.split('/').pop() : 'solution.pdf');
            const sanitizedStudent = (req.user.name || 'Student').replace(/[^a-zA-Z0-9_-]/g, '_');
            const sanitizedTitle = (assignment.title || 'Assignment').replace(/[^a-zA-Z0-9_-]/g, '_');
            const formattedFileName = `${sanitizedStudent}_${sanitizedTitle}_${rawFileName}`;
            // Check if user already submitted - update or push
            const userIdStr = req.user._id.toString();
            const existingSubIndex = assignment.submissions.findIndex(s => s.studentId?.toString() === userIdStr);
            const submissionPayload = {
                studentId: req.user._id,
                studentName: req.user.name || 'Student',
                submittedAt: new Date(),
                content: content || 'Submitted via academic portal',
                fileUrl: fileUrl || `http://localhost:5000/uploads/assignments/${formattedFileName}`,
                formattedFileName,
                originalFileName: rawFileName,
            };
            if (existingSubIndex >= 0) {
                assignment.submissions[existingSubIndex] = {
                    ...assignment.submissions[existingSubIndex],
                    ...submissionPayload,
                };
            }
            else {
                assignment.submissions.push(submissionPayload);
            }
            assignment.status = 'submitted';
            await assignment.save();
            eventBus.emit(Events.ASSIGNMENT_SUBMITTED, {
                userId: req.user._id.toString(),
                studentId: req.user._id,
                assignmentId: assignment._id,
                assignmentTitle: assignment.title,
                instructorId: assignment.instructorId,
                department: assignment.department,
            });
            // Persist learning event
            LearningEvent.create({
                userId: req.user._id,
                eventType: 'ASSIGNMENT_SUBMITTED',
                subject: assignment.courseName || assignment.department,
                metadata: { assignmentId: assignment._id, assignmentTitle: assignment.title },
            }).catch(() => { });
            return res.json({
                success: true,
                message: 'Assignment submitted and pending teacher assessment.',
                formattedFileName,
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    static async grade(req, res) {
        try {
            const { submissionId, grade, feedback } = req.body;
            const assignment = await Assignment.findById(req.params.id);
            if (!assignment)
                return res.status(404).json({ success: false, message: 'Assignment not found' });
            const submission = assignment.submissions.find(s => s._id?.toString() === submissionId || s.studentId?.toString() === submissionId);
            if (!submission) {
                return res.status(404).json({ success: false, message: 'Submission not found for this assignment' });
            }
            submission.grade = Number(grade);
            if (feedback !== undefined)
                submission.feedback = feedback;
            assignment.status = 'graded';
            await assignment.save();
            // Notify the student and emit graded event
            eventBus.emit(Events.ASSIGNMENT_GRADED, {
                userId: submission.studentId?.toString(),
                studentId: submission.studentId,
                assignmentId: assignment._id,
                assignmentTitle: assignment.title,
                grade: Number(grade),
                maxMarks: assignment.maxMarks,
            });
            LearningEvent.create({
                userId: submission.studentId,
                eventType: 'ASSIGNMENT_GRADED',
                score: Number(grade),
                subject: assignment.courseName || assignment.department,
                metadata: { assignmentId: assignment._id, feedback },
            }).catch(() => { });
            return res.json({ success: true, message: 'Assignment graded successfully.', data: submission });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
}
