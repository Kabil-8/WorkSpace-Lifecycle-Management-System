import mongoose, { Schema } from 'mongoose';
const UserCourseProgressSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: String, required: true, index: true },
    completedLessonKeys: { type: [String], default: [] },
    completedCount: { type: Number, default: 0 },
    totalLessons: { type: Number, default: 11 },
    progressPct: { type: Number, default: 0 },
    isCompleted: { type: Boolean, default: false },
}, { timestamps: true });
UserCourseProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });
export default mongoose.model('UserCourseProgress', UserCourseProgressSchema);
