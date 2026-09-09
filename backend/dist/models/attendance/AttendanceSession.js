import mongoose, { Schema } from 'mongoose';
const AttendanceSessionSchema = new Schema({
    subject: { type: String, required: true },
    department: { type: String, default: 'Computer Science' },
    facultyId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    facultyName: { type: String, required: true },
    qrToken: { type: String, required: true },
    otpCode: { type: String, required: true },
    date: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 60 * 1000) },
}, { timestamps: true });
export const AttendanceSession = mongoose.model('AttendanceSession', AttendanceSessionSchema);
