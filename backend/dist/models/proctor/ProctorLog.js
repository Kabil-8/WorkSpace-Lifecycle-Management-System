import mongoose, { Schema } from 'mongoose';
const ProctorLogSchema = new Schema({
    attemptId: { type: Schema.Types.ObjectId, ref: 'StudentAttempt', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    eyeTrackingLogs: [{
            timestamp: String,
            gazeDirection: String,
            irisRatio: Number,
            eyeFocusScore: Number,
        }],
    headMovementLogs: [{
            timestamp: String,
            orientation: String,
            pitch: Number,
            yaw: Number,
            roll: Number,
        }],
    browserEvents: [{
            timestamp: String,
            eventType: String,
            details: String,
            severity: String,
        }],
    warningLogs: [{
            timestamp: String,
            warningNumber: Number,
            type: { type: String },
            message: String,
        }],
    integrityHistory: [{
            timestamp: String,
            score: Number,
        }],
}, { timestamps: true });
export const ProctorLog = mongoose.model('ProctorLog', ProctorLogSchema);
