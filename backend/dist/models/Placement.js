import mongoose, { Schema } from 'mongoose';
const PlacementDriveSchema = new Schema({
    companyName: { type: String, required: true },
    companyLogo: { type: String },
    roleTitle: { type: String, required: true },
    packageLpa: { type: Number, required: true },
    location: { type: String, default: 'Bangalore / Remote' },
    minCgpa: { type: Number, default: 7.5 },
    eligibleDepartments: { type: [String], default: ['Computer Science', 'Data Science', 'AI & Robotics'] },
    driveDate: { type: Date, required: true },
    appliedStudentsCount: { type: Number, default: 0 },
    offersCount: { type: Number, default: 0 },
    status: { type: String, enum: ['upcoming', 'ongoing', 'completed'], default: 'upcoming' },
}, { timestamps: true });
export default mongoose.model('PlacementDrive', PlacementDriveSchema);
