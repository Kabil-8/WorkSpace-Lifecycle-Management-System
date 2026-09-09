import mongoose, { Schema, Document } from 'mongoose'

export type LearningEventType =
  | 'VIDEO_STARTED'
  | 'VIDEO_COMPLETED'
  | 'QUIZ_STARTED'
  | 'QUIZ_COMPLETED'
  | 'ASSIGNMENT_SUBMITTED'
  | 'ASSIGNMENT_GRADED'
  | 'COURSE_GRADE_RECORDED'
  | 'COURSE_ENROLLED'
  | 'NOTE_CREATED'
  | 'CODE_EXECUTED'
  | 'QUESTION_ASKED'
  | 'LOGIN'
  | 'ATTENDANCE_MARKED'
  | 'EXAM_STARTED'
  | 'EXAM_COMPLETED'
  | 'INTERVIEW_COMPLETED'
  | 'RESUME_UPDATED'
  | 'ACHIEVEMENT_UNLOCKED'
  | 'RECALL_SESSION'
  | 'XP_AWARDED'
  | 'FORUM_POST'
  | 'CODE_SUBMITTED'
  | 'CODE_FAILED'
  | 'TOPIC_MASTERED'
  | 'TOPIC_FAILED'
  | 'INTERVENTION_COMPLETED'
  | 'RESOURCE_COMPLETED'

export interface ILearningEvent extends Document {
  userId: mongoose.Types.ObjectId
  eventType: LearningEventType
  courseId?: mongoose.Types.ObjectId
  topicId?: string
  subject?: string
  score?: number         // percentage or raw score
  duration?: number      // seconds spent on activity
  metadata?: Record<string, any>
  timestamp: Date
}

const LearningEventSchema = new Schema<ILearningEvent>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  eventType: {
    type: String,
    enum: [
      'VIDEO_STARTED', 'VIDEO_COMPLETED', 'QUIZ_STARTED', 'QUIZ_COMPLETED',
      'ASSIGNMENT_SUBMITTED', 'ASSIGNMENT_GRADED', 'COURSE_GRADE_RECORDED', 'COURSE_ENROLLED',
      'NOTE_CREATED', 'CODE_EXECUTED', 'QUESTION_ASKED', 'LOGIN',
      'ATTENDANCE_MARKED', 'EXAM_STARTED', 'EXAM_COMPLETED',
      'INTERVIEW_COMPLETED', 'RESUME_UPDATED', 'ACHIEVEMENT_UNLOCKED',
      'RECALL_SESSION', 'XP_AWARDED', 'FORUM_POST',
      'CODE_SUBMITTED', 'CODE_FAILED', 'TOPIC_MASTERED', 'TOPIC_FAILED',
      'INTERVENTION_COMPLETED', 'RESOURCE_COMPLETED',
    ],
    required: true,
    index: true,
  },
  courseId: { type: Schema.Types.ObjectId, ref: 'CollegeCourse' },
  topicId: { type: String },
  subject: { type: String },
  score: { type: Number },
  duration: { type: Number },
  metadata: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: false })

// Compound indexes for Learning DNA queries
LearningEventSchema.index({ userId: 1, timestamp: -1 })
LearningEventSchema.index({ userId: 1, eventType: 1, timestamp: -1 })
LearningEventSchema.index({ eventType: 1, timestamp: -1 })

// TTL: auto-delete events older than 1 year
LearningEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 })

export const LearningEvent = mongoose.models.LearningEvent
  || mongoose.model<ILearningEvent>('LearningEvent', LearningEventSchema)
