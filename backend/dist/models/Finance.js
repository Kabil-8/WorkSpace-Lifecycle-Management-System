import mongoose, { Schema } from 'mongoose';
const FeeStructureSchema = new Schema({
    academicYear: { type: String, required: true },
    semester: { type: Number, required: true },
    department: { type: String, required: true, default: 'All Departments' },
    tuitionFee: { type: Number, required: true, default: 0 },
    examFee: { type: Number, default: 0 },
    labFee: { type: Number, default: 0 },
    hostelFee: { type: Number, default: 0 },
    transportFee: { type: Number, default: 0 },
    totalFee: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
FeeStructureSchema.index({ academicYear: 1, semester: 1, department: 1 });
export const FeeStructure = mongoose.models.FeeStructure
    || mongoose.model('FeeStructure', FeeStructureSchema);
const PaymentSchema = new Schema({
    amount: { type: Number, required: true },
    paidAt: { type: Date, default: Date.now },
    method: { type: String, enum: ['online', 'cash', 'dd', 'scholarship'], default: 'online' },
    transactionId: { type: String },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    receiptNumber: { type: String },
    notes: { type: String },
}, { _id: true });
const ScholarshipSchema = new Schema({
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    appliedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { _id: false });
const FeeAccountSchema = new Schema({
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    academicYear: { type: String, required: true },
    semester: { type: Number, required: true },
    totalDue: { type: Number, required: true, default: 0 },
    totalPaid: { type: Number, default: 0 },
    totalPending: { type: Number, default: 0 },
    dueDate: { type: Date, required: true },
    isOverdue: { type: Boolean, default: false },
    payments: [PaymentSchema],
    scholarships: [ScholarshipSchema],
    lateFee: { type: Number, default: 0 },
    waiverAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['paid', 'partial', 'pending', 'overdue'], default: 'pending' },
}, { timestamps: true });
FeeAccountSchema.index({ studentId: 1, academicYear: 1, semester: 1 }, { unique: true });
// Auto-compute status and pending before save
FeeAccountSchema.pre('save', function () {
    const effective = this.totalDue - this.waiverAmount;
    this.totalPending = Math.max(0, effective - this.totalPaid);
    this.isOverdue = new Date() > this.dueDate && this.totalPending > 0;
    this.status = this.totalPending === 0 ? 'paid'
        : this.totalPaid > 0 ? 'partial'
            : this.isOverdue ? 'overdue'
                : 'pending';
});
export const FeeAccount = mongoose.models.FeeAccount
    || mongoose.model('FeeAccount', FeeAccountSchema);
