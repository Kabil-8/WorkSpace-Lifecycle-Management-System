import mongoose, { Schema } from 'mongoose';
const EdenMessageSchema = new Schema({
    sender: { type: String, enum: ['user', 'eden', 'system'], required: true },
    content: { type: String, required: true },
    intent: { type: String },
    toolCalls: { type: Array, default: [] },
    sources: { type: Array, default: [] },
    timestamp: { type: Date, default: Date.now },
});
const EdenConversationSchema = new Schema({
    conversationId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, default: 'student' },
    title: { type: String, default: 'Eden AI Conversation' },
    messages: [EdenMessageSchema],
}, { timestamps: true });
export default mongoose.models.EdenConversation || mongoose.model('EdenConversation', EdenConversationSchema);
