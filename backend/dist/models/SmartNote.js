import mongoose, { Schema } from 'mongoose';
const SmartNoteSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userName: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    tags: { type: [String], default: [] },
    courseName: { type: String, default: 'General Studies' },
    isPublic: { type: Boolean, default: false },
    aiSummary: { type: String },
}, { timestamps: true });
export default mongoose.model('SmartNote', SmartNoteSchema);
