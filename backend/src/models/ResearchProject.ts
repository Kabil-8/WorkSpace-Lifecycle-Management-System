import mongoose, { Schema, Document } from 'mongoose'

export interface IResearchProject extends Document {
  title: string
  description: string
  principalInvestigatorId: mongoose.Types.ObjectId
  principalInvestigatorName: string
  department: string
  fundingAgency: string
  grantAmountINR: number
  status: 'proposed' | 'ongoing' | 'completed' | 'patented'
  startDate: Date
  endDate?: Date
  citationsCount: number
  createdAt: Date
  updatedAt: Date
}

const ResearchProjectSchema = new Schema<IResearchProject>(
  {
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
  },
  { timestamps: true }
)

export default mongoose.model<IResearchProject>('ResearchProject', ResearchProjectSchema)
