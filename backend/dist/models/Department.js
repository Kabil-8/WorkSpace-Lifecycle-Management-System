import mongoose, { Schema } from 'mongoose';
const DepartmentSchema = new Schema({
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    hodId: { type: Schema.Types.ObjectId, ref: 'User' },
    hodName: { type: String },
    facultyCount: { type: Number, default: 0 },
    studentCount: { type: Number, default: 0 },
    courseCount: { type: Number, default: 0 },
    description: { type: String },
    established: { type: Number },
    building: { type: String },
    email: { type: String },
    phone: { type: String },
}, { timestamps: true });
export default mongoose.model('Department', DepartmentSchema);
