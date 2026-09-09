import mongoose, { Schema, Document } from 'mongoose'

export interface IInterviewAttempt extends Document {
  userId: mongoose.Types.ObjectId
  userName: string
  targetRole: string
  overallScore: number
  grade: string
  breakdown: {
    keywordRelevance: number
    starStructure: number
    completeness: number
    confidence: number
  }
  questionsAnsweredCount: number
  durationMinutes: number
  feedbackSummary: string
  createdAt: Date
  updatedAt: Date
}

const InterviewAttemptSchema = new Schema<IInterviewAttempt>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    targetRole: { type: String, required: true, default: 'Fullstack Developer' },
    overallScore: { type: Number, required: true, default: 0 },
    grade: { type: String, default: 'B' },
    breakdown: {
      keywordRelevance: { type: Number, default: 0 },
      starStructure: { type: Number, default: 0 },
      completeness: { type: Number, default: 0 },
      confidence: { type: Number, default: 0 },
    },
    questionsAnsweredCount: { type: Number, default: 4 },
    durationMinutes: { type: Number, default: 20 },
    feedbackSummary: { type: String, default: 'Strong technical performance.' },
  },
  { timestamps: true }
)

export default mongoose.model<IInterviewAttempt>('InterviewAttempt', InterviewAttemptSchema)
