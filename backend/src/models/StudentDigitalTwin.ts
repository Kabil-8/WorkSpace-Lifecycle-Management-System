import mongoose, { Schema, Document } from 'mongoose'

export interface ICognitiveItem {
  topic: string
  subject: string
  mastery: number
  retention: number
  easeFactor: number
  intervalDays: number
  nextReviewDate: Date
  repetitions: number
  forgetProbability: number
  confidence: number
  mistakeCount: number
  practiceCount: number
  predictedDecay: number
}

export interface ITimelineSnapshot {
  version: number
  timestamp: Date
  learningPace: number
  codingScore: number
  placementProbability: number
  predictedCGPA: number
  burnoutRisk: string
  dropoutRisk: number
  interviewScore: number
}

export interface IStudentDigitalTwin extends Document {
  userId: mongoose.Types.ObjectId
  studentId: string
  studentName: string
  department: string
  hasData?: boolean
  learningPaceScore: number
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading'
  codingProficiencyScore: number
  interviewReadinessScore: number
  placementProbabilityPct: number
  predictedCGPA?: number
  burnoutRisk: 'Low' | 'Medium' | 'High'
  backlogRisk?: 'Safe' | 'High Risk'
  academicRiskCategory?: 'Safe' | 'Low Risk' | 'Moderate Risk' | 'High Risk'
  attendanceShortageRisk?: boolean
  dropoutRiskPct: number
  predictionConfidence: number
  estimatedSalaryRange: string
  strongTopics: string[]
  weakTopics: string[]
  studyPatternHours?: number
  predictions: {
    predictedGPA?: number
    predictedSemesterGpa?: number
    placementReadinessPct?: number
    burnoutRisk?: string
    dropoutRisk?: number
    interviewReadinessScore?: number
    attendanceShortageRisk?: boolean
    academicRiskCategory?: 'Safe' | 'Low Risk' | 'Moderate Risk' | 'High Risk'
    courseCompletionRatePct?: number
    estimatedSalaryRange?: string
    predictionConfidence?: number
  }
  message?: string
  cognitiveRecallItems: ICognitiveItem[]
  timeline: ITimelineSnapshot[]
  updatedAt: Date
  createdAt: Date
}

const CognitiveItemSchema = new Schema<ICognitiveItem>({
  topic: { type: String, required: true },
  subject: { type: String, required: true },
  mastery: { type: Number, default: 0 },
  retention: { type: Number, default: 100 },
  easeFactor: { type: Number, default: 2.5 },
  intervalDays: { type: Number, default: 1 },
  nextReviewDate: { type: Date, default: Date.now },
  repetitions: { type: Number, default: 0 },
  forgetProbability: { type: Number, default: 0 },
  confidence: { type: Number, default: 50 },
  mistakeCount: { type: Number, default: 0 },
  practiceCount: { type: Number, default: 0 },
  predictedDecay: { type: Number, default: 0 },
})

const TimelineSnapshotSchema = new Schema<ITimelineSnapshot>({
  version: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  learningPace: { type: Number, default: 0 },
  codingScore: { type: Number, default: 0 },
  placementProbability: { type: Number, default: 0 },
  predictedCGPA: { type: Number, default: 0 },
  burnoutRisk: { type: String, default: 'Low' },
  dropoutRisk: { type: Number, default: 0 },
  interviewScore: { type: Number, default: 0 },
})

const StudentDigitalTwinSchema = new Schema<IStudentDigitalTwin>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true, unique: true },
  studentId: { type: String, required: true, index: true },
  studentName: { type: String, required: true },
  department: { type: String, default: 'Computer Science' },
  learningPaceScore: { type: Number, default: 0 },
  learningStyle: { type: String, enum: ['visual', 'auditory', 'kinesthetic', 'reading'], default: 'visual' },
  codingProficiencyScore: { type: Number, default: 0 },
  interviewReadinessScore: { type: Number, default: 0 },
  placementProbabilityPct: { type: Number, default: 0 },
  predictedCGPA: { type: Number, default: 0 },
  burnoutRisk: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
  backlogRisk: { type: String, enum: ['Safe', 'High Risk'], default: 'Safe' },
  academicRiskCategory: { type: String, enum: ['Safe', 'Low Risk', 'Moderate Risk', 'High Risk'], default: 'Safe' },
  attendanceShortageRisk: { type: Boolean, default: false },
  dropoutRiskPct: { type: Number, default: 0 },
  predictionConfidence: { type: Number, default: 80 },
  estimatedSalaryRange: { type: String, default: 'Pending Data' },
  strongTopics: { type: [String], default: [] },
  weakTopics: { type: [String], default: [] },
  studyPatternHours: { type: Number, default: 0 },
  predictions: {
    predictedGPA: { type: Number, default: 0 },
    predictedSemesterGpa: { type: Number, default: 0 },
    placementReadinessPct: { type: Number, default: 0 },
    burnoutRisk: { type: String, default: 'Low' },
    dropoutRisk: { type: Number, default: 0 },
    interviewReadinessScore: { type: Number, default: 0 },
    attendanceShortageRisk: { type: Boolean, default: false },
    academicRiskCategory: { type: String, enum: ['Safe', 'Low Risk', 'Moderate Risk', 'High Risk'], default: 'Safe' },
    courseCompletionRatePct: { type: Number, default: 0 },
    estimatedSalaryRange: { type: String, default: 'Pending Data' },
    predictionConfidence: { type: Number, default: 80 },
  },
  cognitiveRecallItems: [CognitiveItemSchema],
  timeline: [TimelineSnapshotSchema],
}, { timestamps: true })

export default mongoose.model<IStudentDigitalTwin>('StudentDigitalTwin', StudentDigitalTwinSchema)
