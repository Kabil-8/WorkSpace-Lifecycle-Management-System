import mongoose, { Schema } from 'mongoose';
const JobSchema = new Schema({
    title: { type: String, required: true, index: true },
    company: { type: String, required: true },
    companyLogo: { type: String },
    location: { type: String, required: true },
    locationType: { type: String, enum: ['on-site', 'remote', 'hybrid'], default: 'on-site' },
    type: { type: String, enum: ['full-time', 'part-time', 'internship', 'contract'], default: 'full-time' },
    salary: { type: String, default: 'Competitive' },
    salaryMin: { type: Number },
    salaryMax: { type: Number },
    description: { type: String, default: '' },
    applyUrl: { type: String },
    requirements: [{ type: String }],
    skills: [{ type: String }],
    postedById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    postedByName: { type: String, required: true },
    deadline: { type: Date, required: true },
    applicants: [{
            userId: { type: Schema.Types.ObjectId, ref: 'User' },
            appliedAt: { type: Date, default: Date.now },
            status: { type: String, enum: ['applied', 'reviewed', 'shortlisted', 'rejected', 'offered'], default: 'applied' },
        }],
    isActive: { type: Boolean, default: true },
    experienceLevel: { type: String, enum: ['fresher', 'junior', 'mid', 'senior', 'lead'], default: 'fresher' },
    domain: { type: String, default: 'Technology' },
    tags: [{ type: String }],
}, { timestamps: true });
JobSchema.index({ title: 'text', company: 'text', description: 'text', skills: 'text' });
export default mongoose.model('Job', JobSchema);
