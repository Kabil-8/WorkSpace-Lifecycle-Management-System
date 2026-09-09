import mongoose, { Schema } from 'mongoose';
const ResearchProjectSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    principalInvestigatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    principalInvestigatorName: { type: String, required: true },
    department: { type: String, required: true },
    fundingAgency: { type: String, default: 'DST / SERB' },
    grantAmountINR: { type: Number, default: 0 },
    status: { type: String, enum: ['proposed', 'ongoing', 'completed', 'patented'], default: 'ongoing' },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    citationsCount: { type: Number, default: 0 },
}, { timestamps: true });
export default mongoose.model('ResearchProject', ResearchProjectSchema);
