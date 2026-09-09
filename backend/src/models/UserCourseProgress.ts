import mongoose, { Schema, Document } from 'mongoose'

export interface IUserCourseProgress extends Document {
  userId: mongoose.Types.ObjectId
  courseId: string
  completedLessonKeys: string[]
  completedCount: number
  totalLessons: number
  progressPct: number
  isCompleted: boolean
  updatedAt: Date
  createdAt: Date
}

const UserCourseProgressSchema = new Schema<IUserCourseProgress>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  courseId: { type: String, required: true, index: true },
  completedLessonKeys: { type: [String], default: [] },
  completedCount: { type: Number, default: 0 },
  totalLessons: { type: Number, default: 11 },
  progressPct: { type: Number, default: 0 },
  isCompleted: { type: Boolean, default: false },
}, { timestamps: true })

UserCourseProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true })

export default mongoose.model<IUserCourseProgress>('UserCourseProgress', UserCourseProgressSchema)
