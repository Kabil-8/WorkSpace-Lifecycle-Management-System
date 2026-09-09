import mongoose, { Schema, Document } from 'mongoose'

// ─── Review History Entry ────────────────────────────────────────────────────
export interface IReviewHistoryEntry {
  reviewedAt: Date
  quality: 1 | 3 | 5
  previousInterval: number
  newInterval: number
  previousEaseFactor: number
  newEaseFactor: number
  responseTime: number   // milliseconds
  correct: boolean       // quality >= 3
  source: 'manual' | 'quiz' | 'assignment' | 'eden'
}

// ─── RecallItem Document ─────────────────────────────────────────────────────
export interface IRecallItem extends Document {
  userId: mongoose.Types.ObjectId
  courseId: string
  subjectId: string
  topicId: string        // unique slug: course_subject_topic
  topicName: string
  subjectName: string
  courseName: string

  // SM-2 state
  repetitions: number
  easeFactor: number
  interval: number       // days until next review
  quality: 1 | 3 | 5    // last recorded quality
  retention: number      // 0-100%
  mastery: number        // 0-100%
  confidence: number     // 0-100%
  mistakeCount: number
  successCount: number

  // Scheduling
  lastReviewedAt: Date | null
  nextReviewAt: Date

  // History
  reviewHistory: IReviewHistoryEntry[]

  createdAt: Date
  updatedAt: Date
}

// ─── Sub-Schemas ─────────────────────────────────────────────────────────────
const ReviewHistorySchema = new Schema<IReviewHistoryEntry>({
  reviewedAt:           { type: Date,   default: Date.now },
  quality:              { type: Number, enum: [1, 3, 5], required: true },
  previousInterval:     { type: Number, default: 0 },
  newInterval:          { type: Number, default: 1 },
  previousEaseFactor:   { type: Number, default: 2.5 },
  newEaseFactor:        { type: Number, default: 2.5 },
  responseTime:         { type: Number, default: 0 },
  correct:              { type: Boolean, default: false },
  source:               { type: String, enum: ['manual', 'quiz', 'assignment', 'eden'], default: 'manual' },
}, { _id: false })

// ─── Main Schema ─────────────────────────────────────────────────────────────
const RecallItemSchema = new Schema<IRecallItem>({
  userId:       { type: Schema.Types.ObjectId, ref: 'User',   required: true },
  courseId:     { type: String, default: '' },
  subjectId:    { type: String, default: '' },
  topicId:      { type: String, required: true },
  topicName:    { type: String, required: true },
  subjectName:  { type: String, default: 'General' },
  courseName:   { type: String, default: 'General' },

  // SM-2 state — never hardcoded; all computed by SM2Engine
  repetitions:  { type: Number, default: 0 },
  easeFactor:   { type: Number, default: 2.5 },
  interval:     { type: Number, default: 1 },
  quality:      { type: Number, enum: [1, 3, 5], default: 1 },
  retention:    { type: Number, default: 0 },   // 0 until first real review
  mastery:      { type: Number, default: 0 },   // 0 until first real review
  confidence:   { type: Number, default: 0 },
  mistakeCount: { type: Number, default: 0 },
  successCount: { type: Number, default: 0 },

  // Scheduling
  lastReviewedAt: { type: Date, default: null },
  nextReviewAt:   { type: Date, default: Date.now },

  // Full review history
  reviewHistory: { type: [ReviewHistorySchema], default: [] },

}, { timestamps: true })

// ─── Indexes ──────────────────────────────────────────────────────────────────
RecallItemSchema.index({ userId: 1, nextReviewAt: 1 })
RecallItemSchema.index({ userId: 1, courseId: 1 })
RecallItemSchema.index({ userId: 1, topicId: 1 }, { unique: true })

export default mongoose.model<IRecallItem>('RecallItem', RecallItemSchema)
