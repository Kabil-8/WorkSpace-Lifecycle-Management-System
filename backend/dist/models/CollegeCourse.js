import mongoose, { Schema } from 'mongoose';
const UnitTopicSchema = new Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    contentType: { type: String, enum: ['lecture', 'pdf', 'lab', 'discussion'], default: 'lecture' },
    resourceUrl: { type: String },
}, { _id: false });
const UnitSchema = new Schema({
    unitNumber: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    topics: [UnitTopicSchema],
}, { _id: false });
const CollegeCourseSchema = new Schema({
    courseCode: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, index: true },
    department: { type: String, required: true, index: true },
    semester: { type: Number, required: true, index: true },
    credits: { type: Number, default: 4 },
    academicYear: { type: String, default: '2025-2026' },
    instructorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    instructorName: { type: String, required: true },
    description: { type: String, default: '' },
    syllabus: { type: String, default: '' },
    units: [UnitSchema],
    prerequisites: [{ type: String }],
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
}, { timestamps: true });
CollegeCourseSchema.index({ department: 1, semester: 1 });
export const CollegeCourse = mongoose.model('CollegeCourse', CollegeCourseSchema);
const CollegeCourseEnrollmentSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    collegeCourseId: { type: Schema.Types.ObjectId, ref: 'CollegeCourse', required: true, index: true },
    courseCode: { type: String, required: true },
    department: { type: String, required: true },
    section: { type: String, default: 'A' },
    semester: { type: Number, required: true },
    academicYear: { type: String, default: '2025-2026' },
    enrolledAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'completed', 'dropped'], default: 'active' },
}, { timestamps: true });
CollegeCourseEnrollmentSchema.index({ userId: 1, collegeCourseId: 1 }, { unique: true });
CollegeCourseEnrollmentSchema.index({ userId: 1, department: 1, semester: 1 });
export const CollegeCourseEnrollment = mongoose.model('CollegeCourseEnrollment', CollegeCourseEnrollmentSchema);
const CollegeAssignmentSchema = new Schema({
    collegeCourseId: { type: Schema.Types.ObjectId, ref: 'CollegeCourse', required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    dueDate: { type: Date, required: true },
    maxMarks: { type: Number, default: 100 },
    department: { type: String, required: true },
    semester: { type: Number, required: true },
    createdByName: { type: String, default: 'Faculty' },
}, { timestamps: true });
export const CollegeAssignment = mongoose.model('CollegeAssignment', CollegeAssignmentSchema);
const CollegeAssignmentSubmissionSchema = new Schema({
    assignmentId: { type: Schema.Types.ObjectId, ref: 'CollegeAssignment', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    submissionText: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now },
    marksObtained: { type: Number },
    feedback: { type: String },
    status: { type: String, enum: ['submitted', 'graded'], default: 'submitted' },
}, { timestamps: true });
CollegeAssignmentSubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });
export const CollegeAssignmentSubmission = mongoose.model('CollegeAssignmentSubmission', CollegeAssignmentSubmissionSchema);
const CollegeQuizSchema = new Schema({
    collegeCourseId: { type: Schema.Types.ObjectId, ref: 'CollegeCourse', required: true, index: true },
    title: { type: String, required: true },
    durationMinutes: { type: Number, default: 20 },
    totalPoints: { type: Number, default: 50 },
    passingScorePct: { type: Number, default: 70 },
    questions: { type: Schema.Types.Mixed, default: [] },
}, { timestamps: true });
export const CollegeQuiz = mongoose.model('CollegeQuiz', CollegeQuizSchema);
const CollegeQuizResultSchema = new Schema({
    quizId: { type: Schema.Types.ObjectId, ref: 'CollegeQuiz', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    score: { type: Number, required: true },
    totalPoints: { type: Number, required: true },
    percentage: { type: Number, required: true },
    passed: { type: Boolean, required: true },
    submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });
export const CollegeQuizResult = mongoose.model('CollegeQuizResult', CollegeQuizResultSchema);
const CollegeExamSchema = new Schema({
    collegeCourseId: { type: Schema.Types.ObjectId, ref: 'CollegeCourse', required: true, index: true },
    title: { type: String, required: true },
    examType: { type: String, enum: ['Midterm 1', 'Midterm 2', 'Semester End Exam', 'Lab Practical'], default: 'Midterm 1' },
    date: { type: Date, required: true },
    maxMarks: { type: Number, default: 100 },
    weightagePct: { type: Number, default: 30 },
}, { timestamps: true });
export const CollegeExam = mongoose.model('CollegeExam', CollegeExamSchema);
const CollegeExamResultSchema = new Schema({
    examId: { type: Schema.Types.ObjectId, ref: 'CollegeExam', required: true, index: true },
    collegeCourseId: { type: Schema.Types.ObjectId, ref: 'CollegeCourse', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    marksObtained: { type: Number, required: true },
    maxMarks: { type: Number, required: true },
    grade: { type: String, required: true },
    remarks: { type: String },
}, { timestamps: true });
CollegeExamResultSchema.index({ examId: 1, studentId: 1 }, { unique: true });
export const CollegeExamResult = mongoose.model('CollegeExamResult', CollegeExamResultSchema);
