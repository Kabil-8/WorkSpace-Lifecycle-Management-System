import mongoose, { Schema } from 'mongoose';
const TestCaseSchema = new Schema({
    input: { type: String, default: '' },
    output: { type: String, default: '' },
    isHidden: { type: Boolean, default: false }
});
const QuestionSchema = new Schema({
    id: { type: String, required: true },
    text: { type: String, required: true },
    type: { type: String, enum: ['multiple_choice', 'true_false', 'short_answer', 'coding'], default: 'multiple_choice' },
    options: [{ type: String }],
    correctAnswer: { type: String, default: '' },
    points: { type: Number, default: 5 },
    language: { type: String, default: 'python' },
    starterCode: { type: String, default: '' },
    visibleTestCases: [TestCaseSchema],
    hiddenTestCases: [TestCaseSchema]
});
const ProctorConfigSchema = new Schema({
    eyeTrackingSensitivity: { type: Number, default: 7 },
    maxWarningsAllowed: { type: Number, default: 3 },
    allowedTabSwitches: { type: Number, default: 0 },
    requireFacialVerification: { type: Boolean, default: true },
    requireAudioMonitoring: { type: Boolean, default: true },
    headPoseRotationLimit: { type: Number, default: 25 },
});
const ExamSchema = new Schema({
    title: { type: String, required: true },
    subject: { type: String, required: true },
    department: { type: String, default: 'Computer Science' },
    description: { type: String, default: '' },
    durationMinutes: { type: Number, required: true, default: 60 },
    passingScore: { type: Number, default: 70 },
    totalPoints: { type: Number, default: 100 },
    scheduledAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdByName: { type: String, default: 'Faculty Instructor' },
    proctorConfig: { type: ProctorConfigSchema, default: () => ({}) },
    questions: [QuestionSchema],
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
export const Exam = mongoose.model('Exam', ExamSchema);
