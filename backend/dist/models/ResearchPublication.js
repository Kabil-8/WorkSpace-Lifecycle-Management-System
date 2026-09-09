import mongoose, { Schema } from 'mongoose';
const ResearchPublicationSchema = new Schema({
    title: { type: String, required: true },
    authors: [{ type: String }],
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    journalOrConference: { type: String, required: true },
    publicationYear: { type: Number, default: new Date().getFullYear() },
    doi: { type: String },
    citations: { type: Number, default: 0 },
    impactFactor: { type: Number, default: 1.0 },
    hIndexContribution: { type: Number, default: 1 },
    department: { type: String, required: true },
    publisher: { type: String, default: 'IEEE / Springer' },
}, { timestamps: true });
export default mongoose.model('ResearchPublication', ResearchPublicationSchema);
