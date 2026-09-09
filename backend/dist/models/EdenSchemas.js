import mongoose, { Schema } from 'mongoose';
const EdenConversationSchema = new Schema({
    userId: { type: String, required: true, index: true },
    title: { type: String, default: 'New Conversation' },
    mode: { type: String, default: 'chat' },
    messages: [
        {
            sender: { type: String, enum: ['user', 'eden'], required: true },
            text: { type: String, required: true },
            timestamp: { type: Date, default: Date.now },
            multimodalType: { type: String, default: 'text' },
            attachmentUrl: { type: String },
        }
    ],
}, { timestamps: true });
const EdenDigitalTwinSchema = new Schema({
    userId: { type: String, required: true, unique: true, index: true },
    xp: { type: Number, default: 2450 },
    evolutionStage: { type: String, default: 'Assistant' },
    learningScore: { type: Number, default: 85 },
    productivityScore: { type: Number, default: 88 },
    focusScore: { type: Number, default: 82 },
    growthScore: { type: Number, default: 90 },
    skillScore: { type: Number, default: 87 },
    predictedGpa: { type: Number, default: 8.6 },
    placementReadinessPct: { type: Number, default: 85 },
    backlogRisk: { type: String, default: 'Low' },
}, { timestamps: true });
export const EdenConversation = mongoose.models.EdenConversation || mongoose.model('EdenConversation', EdenConversationSchema);
export const EdenDigitalTwin = mongoose.models.EdenDigitalTwin || mongoose.model('EdenDigitalTwin', EdenDigitalTwinSchema);
