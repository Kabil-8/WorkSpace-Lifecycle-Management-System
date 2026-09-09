import mongoose, { Schema, Document } from 'mongoose'

export interface ISubmission {
  _id?: mongoose.Types.ObjectId
  studentId: mongoose.Types.ObjectId
  studentName: string
  submittedAt: Date
  fileUrl?: string
  formattedFileName?: string
  originalFileName?: string
  content?: string
  grade?: number
  feedback?: string
  plagiarismScore?: number
}

export interface IAssignment extends Document {
  title: string
  description: string
  courseId: mongoose.Types.ObjectId
  courseName: string
  instructorId: mongoose.Types.ObjectId
  instructorName: string
  dueDate: Date
  maxMarks: number
  allowedFileTypes: string[]
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'todo' | 'in_progress' | 'submitted' | 'graded' | 'overdue'
  submissions: ISubmission[]
  department: string
  semester?: number
  createdAt: Date
  updatedAt: Date
}

const SubmissionSchema = new Schema<ISubmission>({
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
})

const AssignmentSchema = new Schema<IAssignment>({
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
}, { timestamps: true })

AssignmentSchema.index({ title: 'text', description: 'text' })

export default mongoose.model<IAssignment>('Assignment', AssignmentSchema)
