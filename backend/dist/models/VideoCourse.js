import mongoose, { Schema } from 'mongoose';
const VideoLessonSchema = new Schema({
    lessonId: { type: String, required: true },
    title: { type: String, required: true },
    durationMinutes: { type: Number, default: 10 },
    videoUrl: { type: String, required: true },
    description: { type: String, default: '' },
    resources: [{ name: String, url: String }],
    isFreePreview: { type: Boolean, default: false },
}, { _id: false });
const VideoSectionSchema = new Schema({
    sectionId: { type: String, required: true },
    title: { type: String, required: true },
    lessons: [VideoLessonSchema],
}, { _id: false });
const VideoCourseSchema = new Schema({
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, index: true },
    description: { type: String, required: true },
    thumbnail: { type: String, default: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97' },
    instructorName: { type: String, required: true },
    category: { type: String, required: true, index: true },
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
    durationHours: { type: Number, default: 10 },
    skills: [{ type: String }],
    sections: [VideoSectionSchema],
    published: { type: Boolean, default: true, index: true },
    rating: { type: Number, default: 4.8, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    enrolledCount: { type: Number, default: 0 },
}, { timestamps: true });
VideoCourseSchema.index({ title: 'text', description: 'text', skills: 'text', category: 'text' });
export const VideoCourse = mongoose.model('VideoCourse', VideoCourseSchema);
const VideoProgressSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    videoCourseId: { type: Schema.Types.ObjectId, ref: 'VideoCourse', required: true, index: true },
    watchedLessonIds: [{ type: String }],
    completedLessonIds: [{ type: String }],
    lastWatchedLessonId: { type: String },
    lastWatchedTimeSeconds: { type: Number, default: 0 },
    completionPct: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
}, { timestamps: true });
VideoProgressSchema.index({ userId: 1, videoCourseId: 1 }, { unique: true });
export const VideoProgress = mongoose.model('VideoProgress', VideoProgressSchema);
const VideoCertificateSchema = new Schema({
    certificateId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    videoCourseId: { type: Schema.Types.ObjectId, ref: 'VideoCourse', required: true, index: true },
    studentName: { type: String, required: true },
    courseTitle: { type: String, required: true },
    issuedAt: { type: Date, default: Date.now },
}, { timestamps: true });
VideoCertificateSchema.index({ userId: 1, videoCourseId: 1 }, { unique: true });
export const VideoCertificate = mongoose.model('VideoCertificate', VideoCertificateSchema);
const VideoBookmarkSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    videoCourseId: { type: Schema.Types.ObjectId, ref: 'VideoCourse', required: true, index: true },
    lessonId: { type: String, required: true },
    title: { type: String, required: true },
}, { timestamps: true });
VideoBookmarkSchema.index({ userId: 1, videoCourseId: 1, lessonId: 1 }, { unique: true });
export const VideoBookmark = mongoose.model('VideoBookmark', VideoBookmarkSchema);
const VideoNoteSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    videoCourseId: { type: Schema.Types.ObjectId, ref: 'VideoCourse', required: true, index: true },
    lessonId: { type: String, required: true },
    timestampSeconds: { type: Number, default: 0 },
    noteText: { type: String, required: true },
}, { timestamps: true });
export const VideoNote = mongoose.model('VideoNote', VideoNoteSchema);
const VideoQuizSchema = new Schema({
    videoCourseId: { type: Schema.Types.ObjectId, ref: 'VideoCourse', required: true, index: true },
    lessonId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    questions: { type: Schema.Types.Mixed, default: [] },
}, { timestamps: true });
export const VideoQuiz = mongoose.model('VideoQuiz', VideoQuizSchema);
const VideoQuizAttemptSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    videoQuizId: { type: Schema.Types.ObjectId, ref: 'VideoQuiz', required: true, index: true },
    score: { type: Number, required: true },
    totalPoints: { type: Number, required: true },
    percentage: { type: Number, required: true },
    passed: { type: Boolean, required: true },
    attemptedAt: { type: Date, default: Date.now },
}, { timestamps: true });
export const VideoQuizAttempt = mongoose.model('VideoQuizAttempt', VideoQuizAttemptSchema);
