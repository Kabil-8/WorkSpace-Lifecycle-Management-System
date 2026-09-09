import mongoose, { Schema } from 'mongoose';
const EdenRequestLogSchema = new Schema({
    userId: { type: Schema.Types.Mixed, required: true, index: true },
    userRole: { type: String, required: true },
    query: { type: String, required: true },
    intent: { type: String, default: 'UNKNOWN' },
    provider: { type: String, default: 'gemini' },
    llmModel: { type: String },
    inputTokens: { type: Number },
    outputTokens: { type: Number },
    latencyMs: { type: Number, required: true },
    toolsUsed: [{ type: String }],
    webSearched: { type: Boolean, default: false },
    ragRetrieved: { type: Boolean, default: false },
    ragChunkCount: { type: Number, default: 0 },
    success: { type: Boolean, required: true },
    errorMessage: { type: String },
    timestamp: { type: Date, default: Date.now, index: true },
}, { timestamps: false });
EdenRequestLogSchema.index({ timestamp: -1 });
EdenRequestLogSchema.index({ userId: 1, timestamp: -1 });
EdenRequestLogSchema.index({ intent: 1, timestamp: -1 });
EdenRequestLogSchema.index({ success: 1, timestamp: -1 });
// TTL: auto-delete logs older than 90 days to prevent unbounded growth
EdenRequestLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });
export const EdenRequestLog = mongoose.models.EdenRequestLog
    || mongoose.model('EdenRequestLog', EdenRequestLogSchema);
