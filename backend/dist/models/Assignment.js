import mongoose, { Schema } from 'mongoose';
const SubmissionSchema = new Schema({
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentName: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now },
    fileUrl: { type: String },
    formattedFileName: { type: String },
    originalFileName: { type: String },
    content: { type: String },
    grade: { type: Number },
    feedback: { type: String },
    plagiarismScore: { type: Number, default: 0 },
});
const AssignmentSchema = new Schema({
    title: { type: String, required: true, index: true },
    description: { type: String, default: '' },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    courseName: { type: String, required: true },
    instructorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    instructorName: { type: String, required: true },
    dueDate: { type: Date, required: true },
    maxMarks: { type: Number, default: 100 },
    allowedFileTypes: [{ type: String }],
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    status: { type: String, enum: ['todo', 'in_progress', 'submitted', 'graded', 'overdue'], default: 'todo' },
    submissions: [SubmissionSchema],
    department: { type: String, required: true },
    semester: { type: Number },
}, { timestamps: true });
AssignmentSchema.index({ title: 'text', description: 'text' });
export default mongoose.model('Assignment', AssignmentSchema);
