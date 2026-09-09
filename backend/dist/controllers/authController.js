import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Gamification from '../models/Gamification.js';
import AuditLog from '../models/AuditLog.js';
import { logger } from '../config/logger.js';
import { eventBus, Events } from '../events/eventBus.js';
import { StreakService } from '../services/StreakService.js';
const JWT_SECRET = process.env.JWT_SECRET || 'edusphere_jwt_secret_key_2026';
const JWT_EXPIRES = '7d';
function generateToken(userId, role) {
    return jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ success: false, message: 'Email and password are required' });
            return;
        }
        // Real DB lookup
        const user = await User.findOne({ email: email.toLowerCase().trim(), isActive: true });
        if (!user) {
            res.status(401).json({ success: false, message: 'Invalid email or password' });
            return;
        }
        // Real bcrypt compare
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            res.status(401).json({ success: false, message: 'Invalid email or password' });
            return;
        }
        // Update last login & daily streak
        const streakResult = await StreakService.touchStreak(user._id);
        user.streak = streakResult.streak;
        user.maxStreak = streakResult.maxStreak;
        const token = generateToken(user._id.toString(), user.role);
        // Audit log
        await AuditLog.create({
            action: 'USER_LOGIN',
            actorId: user._id,
            actorName: user.name,
            actorRole: user.role,
            description: `${user.name} (${user.role}) logged in`,
            severity: 'info',
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });
        eventBus.emit(Events.USER_LOGIN, { userId: user._id, role: user.role });
        logger.info({ userId: user._id, role: user.role }, '[Auth] Login successful');
        // Fetch live gamification profile for current accurate XP
        const gamification = await Gamification.findOne({ userId: user._id });
        const effectiveXp = Math.max(user.xp || 0, gamification?.xp || 0);
        const effectiveLevel = Math.max(user.level || 1, gamification?.level || 1);
        const effectiveCgpa = user.cgpa || gamification?.cgpa || 9.15;
        if (user.xp !== effectiveXp || user.level !== effectiveLevel || user.cgpa !== effectiveCgpa) {
            await User.findByIdAndUpdate(user._id, { xp: effectiveXp, level: effectiveLevel, cgpa: effectiveCgpa });
        }
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                avatarUrl: user.avatarUrl,
                bio: user.bio,
                phone: user.phone,
                xp: effectiveXp,
                level: effectiveLevel,
                skills: user.skills,
                rollNumber: user.rollNumber,
                employeeId: user.employeeId,
                semester: user.semester,
                batch: user.batch,
                cgpa: effectiveCgpa,
                placementReadiness: user.placementReadiness,
                careerGoal: user.careerGoal,
                atsData: user.atsData,
                atsScore: user.atsData?.score || user.atsScore || 0,
                edenStage: user.edenStage,
                edenPersonality: user.edenPersonality,
                streak: user.streak,
                maxStreak: user.maxStreak,
                isVerified: user.isVerified,
                createdAt: user.createdAt,
            },
        });
    }
    catch (error) {
        logger.error({ err: error.message }, '[Auth] Login error');
        const isDbTimeout = error.message?.includes('buffering timed out') || error.message?.includes('ECONNREFUSED') || error.message?.includes('querySrv');
        const message = isDbTimeout
            ? 'Database is currently unreachable. Please try again in a moment.'
            : 'Login failed. Please try again.';
        res.status(500).json({ success: false, message });
    }
};
export const register = async (req, res) => {
    try {
        const { name, email, password, role, department } = req.body;
        if (!name || !email || !password) {
            res.status(400).json({ success: false, message: 'Name, email, and password are required' });
            return;
        }
        const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            res.status(409).json({ success: false, message: 'Email already registered' });
            return;
        }
        const passwordHash = await bcrypt.hash(password, 12);
        const user = await User.create({
            name,
            email: email.toLowerCase().trim(),
            passwordHash,
            role: role || 'student',
            department,
            isVerified: false,
        });
        const token = generateToken(user._id.toString(), user.role);
        logger.info({ userId: user._id, role: user.role }, '[Auth] Registration successful');
        res.status(201).json({
            success: true,
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        });
    }
    catch (error) {
        logger.error({ err: error.message }, '[Auth] Registration error');
        res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
    }
};
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-passwordHash');
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        res.json({ success: true, data: user });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
