import mongoose, { Schema, Document } from 'mongoose'

export interface IStudentAttempt extends Document {
  examId: mongoose.Types.ObjectId
  studentId: mongoose.Types.ObjectId
  studentName: string
  studentEmail: string
  startTime: Date
  endTime?: Date
  status: 'in_progress' | 'completed' | 'terminated' | 'under_review'
  answers: Record<string, string>
  score: number
  totalQuestions: number
  correctAnswersCount: number
  integrityScore: number // 0 - 100
  riskCategory: 'Safe' | 'Low Risk' | 'Moderate Risk' | 'Suspicious' | 'High Risk'
  warningsCount: number
  eyeFocusPercentage: number
  facePresencePercentage: number
  headMovementPercentage: number
  browserViolationsCount: number
  keyboardViolationsCount: number
  facultyRemarks?: string
  reviewedBy?: string
  createdAt: Date
  updatedAt: Date
}

const StudentAttemptSchema = new Schema<IStudentAttempt>(
  {
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentName: { type: String, required: true },
    studentEmail: { type: String, required: true },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    status: { type: String, enum: ['in_progress', 'completed', 'terminated', 'under_review'], default: 'in_progress' },
    answers: { type: Map, of: String, default: {} },
    score: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    correctAnswersCount: { type: Number, default: 0 },
    integrityScore: { type: Number, default: 100 },
    riskCategory: { type: String, enum: ['Safe', 'Low Risk', 'Moderate Risk', 'Suspicious', 'High Risk'], default: 'Safe' },
    warningsCount: { type: Number, default: 0 },
    eyeFocusPercentage: { type: Number, default: 100 },
    facePresencePercentage: { type: Number, default: 100 },
    headMovementPercentage: { type: Number, default: 100 },
    browserViolationsCount: { type: Number, default: 0 },
    keyboardViolationsCount: { type: Number, default: 0 },
    facultyRemarks: { type: String, default: '' },
    reviewedBy: { type: String, default: '' },
  },
  { timestamps: true }
)

export const StudentAttempt = mongoose.model<IStudentAttempt>('StudentAttempt', StudentAttemptSchema)
