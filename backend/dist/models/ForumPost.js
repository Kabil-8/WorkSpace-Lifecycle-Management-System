import mongoose, { Schema } from 'mongoose';
const ReplySchema = new Schema({
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    authorRole: { type: String, default: 'student' },
    content: { type: String, required: true },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now },
});
const ForumPostSchema = new Schema({
    title: { type: String, required: true, index: true },
    content: { type: String, required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    authorRole: { type: String, default: 'student' },
    authorDepartment: { type: String },
    tags: [{ type: String }],
    category: {
        type: String,
        enum: ['doubt', 'discussion', 'announcement', 'resource', 'project', 'placement', 'general'],
        default: 'general',
    },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    replies: [ReplySchema],
    views: { type: Number, default: 0 },
    isPinned: { type: Boolean, default: false },
    isResolved: { type: Boolean, default: false },
    department: { type: String },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
}, { timestamps: true });
ForumPostSchema.index({ title: 'text', content: 'text', tags: 'text' });
export default mongoose.model('ForumPost', ForumPostSchema);
