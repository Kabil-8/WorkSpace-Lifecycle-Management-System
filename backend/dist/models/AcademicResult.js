import mongoose, { Schema } from 'mongoose';
const CourseGradeSchema = new Schema({
    collegeCourseId: { type: Schema.Types.ObjectId, ref: 'CollegeCourse' },
    courseCode: { type: String, required: true },
    courseTitle: { type: String, required: true },
    credits: { type: Number, default: 4 },
    internalMarks: { type: Number, default: 0 },
    endSemMarks: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    grade: { type: String, enum: ['S', 'A', 'B', 'C', 'D', 'F'], default: 'B' },
    gradePoints: { type: Number, default: 8 },
}, { _id: false });
const AcademicResultSchema = new Schema({
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    studentName: { type: String, required: true },
    rollNo: { type: String, required: true },
    department: { type: String, required: true, index: true },
    semester: { type: Number, required: true, index: true },
    academicYear: { type: String, default: '2025-2026' },
    courseGrades: [CourseGradeSchema],
    sgpa: { type: Number, required: true },
    cgpa: { type: Number, required: true },
    totalCreditsEarned: { type: Number, default: 0 },
    status: { type: String, enum: ['passed', 'failed', 'withheld'], default: 'passed' },
}, { timestamps: true });
AcademicResultSchema.index({ studentId: 1, semester: 1 }, { unique: true });
export const AcademicResult = mongoose.models.AcademicResult
    || mongoose.model('AcademicResult', AcademicResultSchema);
