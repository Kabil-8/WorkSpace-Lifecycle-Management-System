import mongoose, { Schema, Document } from 'mongoose'

// ─── College Course Unit / Syllabus Sub-schema ────────────────────────────────
export interface ICollegeUnitTopic {
  id: string
  title: string
  description?: string
  contentType?: 'lecture' | 'pdf' | 'lab' | 'discussion'
  resourceUrl?: string
}

export interface ICollegeUnit {
  unitNumber: number
  title: string
  description: string
  topics: ICollegeUnitTopic[]
}

// ─── Main College Course Document ─────────────────────────────────────────────
export interface ICollegeCourse extends Document {
  courseCode: string
  title: string
  department: string
  semester: number
  credits: number
  academicYear: string
  instructorId: mongoose.Types.ObjectId
  instructorName: string
  description: string
  syllabus: string
  units: ICollegeUnit[]
  prerequisites: string[]
  status: 'active' | 'archived'
  createdAt: Date
  updatedAt: Date
}

const UnitTopicSchema = new Schema<ICollegeUnitTopic>({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  contentType: { type: String, enum: ['lecture', 'pdf', 'lab', 'discussion'], default: 'lecture' },
  resourceUrl: { type: String },
}, { _id: false })

const UnitSchema = new Schema<ICollegeUnit>({
  unitNumber: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  topics: [UnitTopicSchema],
}, { _id: false })

const CollegeCourseSchema = new Schema<ICollegeCourse>({
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
}, { timestamps: true })

CollegeCourseSchema.index({ department: 1, semester: 1 })

export const CollegeCourse = mongoose.model<ICollegeCourse>('CollegeCourse', CollegeCourseSchema)

// ─── College Course Enrollment Document ───────────────────────────────────────
export interface ICollegeCourseEnrollment extends Document {
  userId: mongoose.Types.ObjectId
  collegeCourseId: mongoose.Types.ObjectId
  courseCode: string
  department: string
  section: string
  semester: number
  academicYear: string
  enrolledAt: Date
  status: 'active' | 'completed' | 'dropped'
}

const CollegeCourseEnrollmentSchema = new Schema<ICollegeCourseEnrollment>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  collegeCourseId: { type: Schema.Types.ObjectId, ref: 'CollegeCourse', required: true, index: true },
  courseCode: { type: String, required: true },
  department: { type: String, required: true },
  section: { type: String, default: 'A' },
  semester: { type: Number, required: true },
  academicYear: { type: String, default: '2025-2026' },
  enrolledAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'completed', 'dropped'], default: 'active' },
}, { timestamps: true })

CollegeCourseEnrollmentSchema.index({ userId: 1, collegeCourseId: 1 }, { unique: true })
CollegeCourseEnrollmentSchema.index({ userId: 1, department: 1, semester: 1 })

export const CollegeCourseEnrollment = mongoose.model<ICollegeCourseEnrollment>('CollegeCourseEnrollment', CollegeCourseEnrollmentSchema)

// ─── College Assignment & Submission Documents ────────────────────────────────
export interface ICollegeAssignment extends Document {
  collegeCourseId: mongoose.Types.ObjectId
  title: string
  description: string
  dueDate: Date
  maxMarks: number
  department: string
  semester: number
  createdByName: string
  createdAt: Date
}

const CollegeAssignmentSchema = new Schema<ICollegeAssignment>({
  collegeCourseId: { type: Schema.Types.ObjectId, ref: 'CollegeCourse', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  dueDate: { type: Date, required: true },
  maxMarks: { type: Number, default: 100 },
  department: { type: String, required: true },
  semester: { type: Number, required: true },
  createdByName: { type: String, default: 'Faculty' },
}, { timestamps: true })

export const CollegeAssignment = mongoose.model<ICollegeAssignment>('CollegeAssignment', CollegeAssignmentSchema)

export interface ICollegeAssignmentSubmission extends Document {
  assignmentId: mongoose.Types.ObjectId
  studentId: mongoose.Types.ObjectId
  submissionText: string
  submittedAt: Date
  marksObtained?: number
  feedback?: string
  status: 'submitted' | 'graded'
}

const CollegeAssignmentSubmissionSchema = new Schema<ICollegeAssignmentSubmission>({
  assignmentId: { type: Schema.Types.ObjectId, ref: 'CollegeAssignment', required: true, index: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  submissionText: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now },
  marksObtained: { type: Number },
  feedback: { type: String },
  status: { type: String, enum: ['submitted', 'graded'], default: 'submitted' },
}, { timestamps: true })

CollegeAssignmentSubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true })

export const CollegeAssignmentSubmission = mongoose.model<ICollegeAssignmentSubmission>('CollegeAssignmentSubmission', CollegeAssignmentSubmissionSchema)

// ─── College Quiz & Quiz Result ───────────────────────────────────────────────
export interface ICollegeQuiz extends Document {
  collegeCourseId: mongoose.Types.ObjectId
  title: string
  durationMinutes: number
  totalPoints: number
  passingScorePct: number
  questions: Array<{ id: string; question: string; options: string[]; correctAnswer: number }>
}

const CollegeQuizSchema = new Schema<ICollegeQuiz>({
  collegeCourseId: { type: Schema.Types.ObjectId, ref: 'CollegeCourse', required: true, index: true },
  title: { type: String, required: true },
  durationMinutes: { type: Number, default: 20 },
  totalPoints: { type: Number, default: 50 },
  passingScorePct: { type: Number, default: 70 },
  questions: { type: Schema.Types.Mixed, default: [] },
}, { timestamps: true })

export const CollegeQuiz = mongoose.model<ICollegeQuiz>('CollegeQuiz', CollegeQuizSchema)

export interface ICollegeQuizResult extends Document {
  quizId: mongoose.Types.ObjectId
  studentId: mongoose.Types.ObjectId
  score: number
  totalPoints: number
  percentage: number
  passed: boolean
  submittedAt: Date
}

const CollegeQuizResultSchema = new Schema<ICollegeQuizResult>({
  quizId: { type: Schema.Types.ObjectId, ref: 'CollegeQuiz', required: true, index: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  score: { type: Number, required: true },
  totalPoints: { type: Number, required: true },
  percentage: { type: Number, required: true },
  passed: { type: Boolean, required: true },
  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true })

export const CollegeQuizResult = mongoose.model<ICollegeQuizResult>('CollegeQuizResult', CollegeQuizResultSchema)

// ─── College Internal Exam & Marks ────────────────────────────────────────────
export interface ICollegeExam extends Document {
  collegeCourseId: mongoose.Types.ObjectId
  title: string
  examType: 'Midterm 1' | 'Midterm 2' | 'Semester End Exam' | 'Lab Practical'
  date: Date
  maxMarks: number
  weightagePct: number
}

const CollegeExamSchema = new Schema<ICollegeExam>({
  collegeCourseId: { type: Schema.Types.ObjectId, ref: 'CollegeCourse', required: true, index: true },
  title: { type: String, required: true },
  examType: { type: String, enum: ['Midterm 1', 'Midterm 2', 'Semester End Exam', 'Lab Practical'], default: 'Midterm 1' },
  date: { type: Date, required: true },
  maxMarks: { type: Number, default: 100 },
  weightagePct: { type: Number, default: 30 },
}, { timestamps: true })

export const CollegeExam = mongoose.model<ICollegeExam>('CollegeExam', CollegeExamSchema)

export interface ICollegeExamResult extends Document {
  examId: mongoose.Types.ObjectId
  collegeCourseId: mongoose.Types.ObjectId
  studentId: mongoose.Types.ObjectId
  marksObtained: number
  maxMarks: number
  grade: string
  remarks?: string
}

const CollegeExamResultSchema = new Schema<ICollegeExamResult>({
  examId: { type: Schema.Types.ObjectId, ref: 'CollegeExam', required: true, index: true },
  collegeCourseId: { type: Schema.Types.ObjectId, ref: 'CollegeCourse', required: true, index: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  marksObtained: { type: Number, required: true },
  maxMarks: { type: Number, required: true },
  grade: { type: String, required: true },
  remarks: { type: String },
}, { timestamps: true })

CollegeExamResultSchema.index({ examId: 1, studentId: 1 }, { unique: true })

export const CollegeExamResult = mongoose.model<ICollegeExamResult>('CollegeExamResult', CollegeExamResultSchema)
