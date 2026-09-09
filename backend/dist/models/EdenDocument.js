import mongoose, { Schema } from 'mongoose';
const EdenDocumentSchema = new Schema({
    title: { type: String, required: true, index: true },
    category: { type: String, required: true, default: 'general' },
    department: { type: String, default: 'All Departments' },
    content: { type: String, required: true },
    embedding: [{ type: Number }],
    chunks: [
        {
            text: { type: String, required: true },
            keywords: [{ type: String }],
            embedding: [{ type: Number }],
        }
    ],
    uploadedBy: { type: mongoose.Schema.Types.Mixed, default: null },
    fileName: { type: String },
    fileSize: { type: Number },
}, { timestamps: true });
export const EdenDocument = mongoose.model('EdenDocument', EdenDocumentSchema);
