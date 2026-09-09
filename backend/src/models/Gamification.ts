import mongoose, { Schema, Document } from 'mongoose'

export interface IDailyMission {
  id: string
  title: string
  xpReward: number
  isCompleted: boolean
  completedAt?: Date
}

export interface IBadge {
  id: string
  name: string
  icon: string
  description: string
  earnedAt: Date
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface IGamification extends Document {
  userId: mongoose.Types.ObjectId
  xp: number
  level: number
  streak: number
  maxStreak: number
  lastActiveDate: Date
  badges: IBadge[]
  dailyMissions: IDailyMission[]
  leaderboardRank?: number
  weeklyXp: number
  monthlyXp: number
  totalCoursesCompleted: number
  totalAssignmentsSubmitted: number
  totalQuizzesTaken: number
  placementReadinessPct: number
  cgpa: number
  updatedAt: Date
}

const BadgeSchema = new Schema<IBadge>({
  id: { type: String },
  name: { type: String },
  icon: { type: String },
  description: { type: String },
  earnedAt: { type: Date, default: Date.now },
  rarity: { type: String, enum: ['common', 'rare', 'epic', 'legendary'], default: 'common' },
})

const MissionSchema = new Schema<IDailyMission>({
  id: { type: String },
  title: { type: String },
  xpReward: { type: Number, default: 50 },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date },
})

const GamificationSchema = new Schema<IGamification>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  streak: { type: Number, default: 0 },
  maxStreak: { type: Number, default: 0 },
  lastActiveDate: { type: Date, default: Date.now },
  badges: [BadgeSchema],
  dailyMissions: [MissionSchema],
  leaderboardRank: { type: Number },
  weeklyXp: { type: Number, default: 0 },
  monthlyXp: { type: Number, default: 0 },
  totalCoursesCompleted: { type: Number, default: 0 },
  totalAssignmentsSubmitted: { type: Number, default: 0 },
  totalQuizzesTaken: { type: Number, default: 0 },
  placementReadinessPct: { type: Number, default: 40 },
  cgpa: { type: Number, default: 7.0 },
}, { timestamps: true })

export default mongoose.model<IGamification>('Gamification', GamificationSchema)
