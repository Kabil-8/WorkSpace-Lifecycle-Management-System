import mongoose, { Schema } from 'mongoose';
const MentorshipAllocationSchema = new Schema({
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    studentName: { type: String, required: true },
    mentorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mentorName: { type: String, required: true },
    mentorRole: { type: String, default: 'mentor' },
    allocatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    allocatedByName: { type: String, required: true },
    topic: { type: String, default: 'Academic & Career Growth' },
    status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
}, { timestamps: true });
export default mongoose.model('MentorshipAllocation', MentorshipAllocationSchema);
