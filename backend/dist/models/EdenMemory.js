import mongoose, { Schema } from 'mongoose';
const EdenMemorySchema = new Schema({
    userId: { type: String, required: true, unique: true, index: true },
    role: { type: String, required: true, default: 'student' },
    facts: [{ type: String }],
    factEmbeddings: [
        {
            fact: { type: String },
            vector: [{ type: Number }],
        },
    ],
    careerGoal: { type: String },
    preferredLanguages: [{ type: String }],
    lastActiveRoute: { type: String },
    summaryNotes: { type: String },
}, { timestamps: true });
export const EdenMemory = mongoose.model('EdenMemory', EdenMemorySchema);
