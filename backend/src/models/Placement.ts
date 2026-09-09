import mongoose, { Schema, Document } from 'mongoose'

export interface IPlacementDrive extends Document {
  companyName: string
  companyLogo?: string
  roleTitle: string
  packageLpa: number
  location: string
  minCgpa: number
  eligibleDepartments: string[]
  driveDate: Date
  appliedStudentsCount: number
  offersCount: number
  status: 'upcoming' | 'ongoing' | 'completed'
  createdAt: Date
  updatedAt: Date
}

const PlacementDriveSchema = new Schema<IPlacementDrive>({
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
}, { timestamps: true })

export default mongoose.model<IPlacementDrive>('PlacementDrive', PlacementDriveSchema)
