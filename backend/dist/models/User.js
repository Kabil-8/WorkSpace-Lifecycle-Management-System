import mongoose, { Schema } from 'mongoose';
const UserSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: {
        type: String,
        enum: ['student', 'faculty', 'admin', 'mentor', 'recruiter', 'parent', 'placement_officer', 'hod', 'researcher', 'alumni', 'industry_partner', 'super_admin'],
        default: 'student',
    },
    department: { type: String },
    avatarUrl: { type: String },
    bio: { type: String },
    phone: { type: String },
    // Gamification
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    skills: [{ type: String }],
    // Academic
    rollNumber: { type: String },
    employeeId: { type: String },
    semester: { type: Number, default: 7 },
    section: { type: String, default: 'Section A' },
    batch: { type: String },
    cgpa: { type: Number, default: 0 },
    classTeacherId: { type: Schema.Types.ObjectId, ref: 'User' },
    classTeacherName: { type: String },
    isClassTeacher: { type: Boolean, default: false },
    classTeacherSection: { type: String },
    classTeacherDepartment: { type: String },
    classTeacherSemester: { type: Number },
    weakSubjects: [{ type: String }],
    strongSubjects: [{ type: String }],
    // Career
    placementReadiness: { type: Number, default: 0 },
    careerGoal: { type: String },
    atsData: {
        score: { type: Number, default: 0 },
        modelVersion: { type: String, default: 'v2.1-staging' },
        calculatedAt: { type: Date, default: Date.now },
        dataQuality: { type: String, default: 'candidate_self_reported' },
        source: { type: String, default: 'ml_service' },
        breakdown: {
            keywordCoverage: { type: Number, default: 0 },
            sectionHealth: { type: Number, default: 0 },
            actionVerbsAndMetrics: { type: Number, default: 0 },
            contactLinks: { type: Number, default: 0 }
        }
    },
    // External Profiles & Developer Ranking
    externalProfiles: {
        leetcode: {
            username: { type: String },
            profileUrl: { type: String },
            ranking: { type: Number, default: 0 },
            campusRank: { type: Number, default: 0 },
            totalSolved: { type: Number, default: 0 },
            easySolved: { type: Number, default: 0 },
            mediumSolved: { type: Number, default: 0 },
            hardSolved: { type: Number, default: 0 },
            contestRating: { type: Number, default: 0 },
            acceptanceRate: { type: Number, default: 0 },
            streak: { type: Number, default: 0 },
            topBadge: { type: String },
            lastSyncedAt: { type: Date },
        },
        github: {
            username: { type: String },
            profileUrl: { type: String },
            publicRepos: { type: Number, default: 0 },
            totalStars: { type: Number, default: 0 },
            totalCommits: { type: Number, default: 0 },
            topLanguages: [{ type: String }],
            followers: { type: Number, default: 0 },
            contributionsThisYear: { type: Number, default: 0 },
            campusRank: { type: Number, default: 0 },
            developerScore: { type: Number, default: 0 },
            lastSyncedAt: { type: Date },
        },
        linkedin: {
            profileUrl: { type: String },
            username: { type: String },
            headline: { type: String },
            connections: { type: Number, default: 0 },
            verifiedSkills: [{ type: String }],
            certifications: [{ type: String }],
            lastSyncedAt: { type: Date },
        },
        overallDeveloperRank: {
            score: { type: Number, default: 0 },
            campusRank: { type: Number, default: 0 },
            totalStudents: { type: Number, default: 0 },
            campusPercentile: { type: Number, default: 0 },
            globalTier: { type: String, default: 'Bronze' },
            badge: { type: String, default: 'Aspiring Developer' },
        },
    },
    // EDEN AI
    edenStage: { type: String, default: 'seed' },
    edenPersonality: { type: String, default: 'mentor' },
    preferredLang: { type: String, default: 'English' },
    // Family
    parentId: { type: Schema.Types.ObjectId, ref: 'User' },
    // System
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    streak: { type: Number, default: 0 },
    maxStreak: { type: Number, default: 0 },
}, { timestamps: true });
UserSchema.index({ name: 'text', email: 'text', department: 'text' });
export default mongoose.model('User', UserSchema);
