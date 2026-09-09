import mongoose, { Schema } from 'mongoose';
const ModuleSchema = new Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    duration: { type: Number, default: 30 },
    type: { type: String, enum: ['video', 'quiz', 'assignment', 'reading', 'game'], default: 'video' },
    contentUrl: { type: String },
    description: { type: String },
    gameConfig: { type: Schema.Types.Mixed },
    quizQuestions: { type: Schema.Types.Mixed },
    assignmentDetails: { type: Schema.Types.Mixed },
    isCompleted: { type: Boolean, default: false },
});
const SectionSchema = new Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    modules: [ModuleSchema],
});
const CourseSchema = new Schema({
    title: { type: String, required: true, index: true },
    description: { type: String, default: '' },
    instructor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    instructorName: { type: String, required: true },
    department: { type: String, required: true, index: true },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published' },
    tags: [{ type: String }],
    duration: { type: Number, default: 40 },
    enrolledCount: { type: Number, default: 0 },
    rating: { type: Number, default: 4.5, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    curriculum: [SectionSchema],
    prerequisites: [{ type: String }],
    objectives: [{ type: String }],
    language: { type: String, default: 'English' },
    thumbnail: { type: String },
    schedule: { type: String },
    semester: { type: Number },
    credits: { type: Number, default: 3 },
}, { timestamps: true });
CourseSchema.index({ title: 'text', description: 'text', tags: 'text' });
export default mongoose.model('Course', CourseSchema);
