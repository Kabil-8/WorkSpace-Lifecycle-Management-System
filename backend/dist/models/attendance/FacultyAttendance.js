import mongoose, { Schema } from 'mongoose';
const FacultyAttendanceSchema = new Schema({
    facultyId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    facultyName: { type: String, required: true },
    department: { type: String, default: 'Computer Science' },
    date: { type: Date, default: Date.now },
    checkInTime: { type: String, required: true },
    checkOutTime: { type: String, default: '17:00' },
    totalWorkingHours: { type: Number, default: 8.5 },
    status: { type: String, enum: ['Present', 'Late', 'Leave', 'Permission'], default: 'Present' },
    checkInMethod: { type: String, enum: ['Face', 'Fingerprint', 'QR', 'Manual', 'RFID'], default: 'Face' },
    punctualityScore: { type: Number, default: 95 },
}, { timestamps: true });
export const FacultyAttendance = mongoose.model('FacultyAttendance', FacultyAttendanceSchema);
