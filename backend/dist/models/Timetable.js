import mongoose, { Schema } from 'mongoose';
const TimetableItemSchema = new Schema({
    department: { type: String, required: true, index: true },
    semester: { type: Number, default: 7 },
    section: { type: String, default: 'Section A', index: true },
    day: { type: Number, required: true },
    startPeriod: { type: Number, required: true },
    duration: { type: Number, default: 1 },
    subject: { type: String, required: true },
    room: { type: String, required: true },
    type: { type: String, enum: ['Lecture', 'Lab', 'Tutorial'], default: 'Lecture' },
    color: { type: String, default: '#2563EB' },
    instructorId: { type: Schema.Types.ObjectId, ref: 'User' },
    instructorName: { type: String },
    allocatedById: { type: Schema.Types.ObjectId, ref: 'User' },
    allocatedByName: { type: String },
}, { timestamps: true });
TimetableItemSchema.index({ department: 1, semester: 1, section: 1, day: 1, startPeriod: 1 });
export default mongoose.model('TimetableItem', TimetableItemSchema);
