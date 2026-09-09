import mongoose, { Schema } from 'mongoose';
const CodeSubmissionSchema = new Schema({
    userId: { type: String, required: true },
    language: { type: String, required: true },
    code: { type: String, required: true },
    input: { type: String },
    stdout: { type: String, default: '' },
    stderr: { type: String, default: '' },
    status: { type: String, enum: ['success', 'error', 'timeout'], required: true },
    executionTimeMs: { type: Number, default: 0 },
    exitCode: { type: Number, default: null },
    createdAt: { type: Date, default: Date.now },
});
export default mongoose.model('CodeSubmission', CodeSubmissionSchema);
