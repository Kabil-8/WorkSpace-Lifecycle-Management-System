import mongoose, { Schema, Document } from 'mongoose'

export interface ITestCase {
  input: string
  output: string
  isHidden?: boolean
}

export interface IQuestion {
  id: string
  text: string
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'coding'
  options?: string[]
  correctAnswer: string
  points: number
  language?: string
  starterCode?: string
  visibleTestCases?: ITestCase[]
  hiddenTestCases?: ITestCase[]
}

export interface IProctorConfig {
  eyeTrackingSensitivity: number // 1-10
  maxWarningsAllowed: number // Default 3
  allowedTabSwitches: number // Default 0
  requireFacialVerification: boolean
  requireAudioMonitoring: boolean
  headPoseRotationLimit: number // Degrees (e.g. 25 deg)
}

export interface IExam extends Document {
  title: string
  subject: string
  department: string
  description: string
  durationMinutes: number
  passingScore: number
  totalPoints: number
  scheduledAt: Date
  expiresAt: Date
  createdBy: mongoose.Types.ObjectId
  createdByName: string
  proctorConfig: IProctorConfig
  questions: IQuestion[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const TestCaseSchema = new Schema<ITestCase>({
  input: { type: String, default: '' },
  output: { type: String, default: '' },
  isHidden: { type: Boolean, default: false }
})

const QuestionSchema = new Schema<IQuestion>({
  id: { type: String, required: true },
  text: { type: String, required: true },
  type: { type: String, enum: ['multiple_choice', 'true_false', 'short_answer', 'coding'], default: 'multiple_choice' },
  options: [{ type: String }],
  correctAnswer: { type: String, default: '' },
  points: { type: Number, default: 5 },
  language: { type: String, default: 'python' },
  starterCode: { type: String, default: '' },
  visibleTestCases: [TestCaseSchema],
  hiddenTestCases: [TestCaseSchema]
})

const ProctorConfigSchema = new Schema<IProctorConfig>({
  eyeTrackingSensitivity: { type: Number, default: 7 },
  maxWarningsAllowed: { type: Number, default: 3 },
  allowedTabSwitches: { type: Number, default: 0 },
  requireFacialVerification: { type: Boolean, default: true },
  requireAudioMonitoring: { type: Boolean, default: true },
  headPoseRotationLimit: { type: Number, default: 25 },
})

const ExamSchema = new Schema<IExam>(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true },
    department: { type: String, default: 'Computer Science' },
    description: { type: String, default: '' },
    durationMinutes: { type: Number, required: true, default: 60 },
    passingScore: { type: Number, default: 70 },
    totalPoints: { type: Number, default: 100 },
    scheduledAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdByName: { type: String, default: 'Faculty Instructor' },
    proctorConfig: { type: ProctorConfigSchema, default: () => ({}) },
    questions: [QuestionSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const Exam = mongoose.model<IExam>('Exam', ExamSchema)
