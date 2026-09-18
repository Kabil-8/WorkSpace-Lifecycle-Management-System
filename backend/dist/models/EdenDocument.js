import mongoose, { Schema } from 'mongoose';
const EdenDocumentSchema = new Schema({
    documentId: { type: String, index: true },
    title: { type: String, required: true, index: true },
    category: { type: String, required: true, default: 'general', index: true },
    department: { type: String, default: 'All Departments', index: true },
    semester: { type: Number, index: true },
    content: { type: String, required: true },
    embedding: [{ type: Number }],
    chunks: [
        {
            chunkId: { type: String },
            documentId: { type: String },
            docTitle: { type: String },
            category: { type: String },
            department: { type: String },
            semester: { type: Number },
            sectionTitle: { type: String },
            sourcePage: { type: Number, default: 1 },
            chunkIndex: { type: Number, default: 0 },
            text: { type: String, required: true },
            keywords: [{ type: String }],
            embedding: [{ type: Number }],
        }
    ],
    uploadedBy: { type: mongoose.Schema.Types.Mixed, default: null },
    fileName: { type: String },
    fileSize: { type: Number },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });
export const EdenDocument = mongoose.model('EdenDocument', EdenDocumentSchema);
