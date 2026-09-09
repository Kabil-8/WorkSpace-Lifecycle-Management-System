import mongoose, { Schema } from 'mongoose';
const StudentAttendanceSchema = new Schema({
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    studentName: { type: String, required: true },
    rollNo: { type: String, required: true },
    subject: { type: String, required: true, index: true },
    department: { type: String, default: 'Computer Science & Engineering' },
    date: { type: Date, default: Date.now, index: true },
    status: { type: String, enum: ['Present', 'Absent', 'Late', 'Excused', 'Medical Leave', 'present', 'absent', 'late'], default: 'Present', index: true },
    method: { type: String, default: 'Manual' },
    remarks: { type: String, default: '' },
}, { timestamps: true });
StudentAttendanceSchema.index({ studentId: 1, date: -1 });
StudentAttendanceSchema.index({ studentId: 1, status: 1 });
export const StudentAttendance = mongoose.models.StudentAttendance
    || mongoose.model('StudentAttendance', StudentAttendanceSchema);
