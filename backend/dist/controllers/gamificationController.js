import Gamification from '../models/Gamification.js';
import User from '../models/User.js';
import { RedisCache, CacheKeys, CacheTTL } from '../cache/RedisCache.js';
import { eventBus, Events } from '../events/eventBus.js';
import { StreakService } from '../services/StreakService.js';
export class GamificationController {
    static async getMe(req, res) {
        try {
            const streakInfo = await StreakService.touchStreak(req.user._id);
            let profile = await Gamification.findOne({ userId: req.user._id });
            if (!profile) {
                // Auto-create profile from user data
                profile = await Gamification.create({
                    userId: req.user._id,
                    xp: req.user.xp || 0,
                    level: req.user.level || 1,
                    streak: streakInfo.streak,
                    maxStreak: streakInfo.maxStreak,
                    cgpa: req.user.cgpa || 7.0,
                    placementReadinessPct: req.user.placementReadiness || 40,
                    dailyMissions: [
                        { id: 'm1', title: 'Complete one lecture', xpReward: 50, isCompleted: false },
                        { id: 'm2', title: 'Submit an assignment', xpReward: 100, isCompleted: false },
                        { id: 'm3', title: 'Post in Discussion Forum', xpReward: 30, isCompleted: false },
                        { id: 'm4', title: 'Practice coding for 30 min', xpReward: 75, isCompleted: false },
                        { id: 'm5', title: 'Review study notes', xpReward: 40, isCompleted: false },
                    ],
                });
            }
            return res.json({ success: true, data: profile });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    static async getLeaderboard(req, res) {
        try {
            const cached = await RedisCache.get(CacheKeys.leaderboard());
            if (cached)
                return res.json({ success: true, data: cached, cached: true });
            const studentUsers = await User.find({ role: 'student' }).select('_id').lean();
            const studentIds = studentUsers.map(s => s._id);
            const top = await Gamification.find({ userId: { $in: studentIds } })
                .sort({ xp: -1 }).limit(20)
                .populate('userId', 'name department avatarUrl role');
            const leaderboard = top.map((entry, i) => ({
                rank: i + 1,
                xp: entry.xp,
                level: entry.level,
                streak: entry.streak,
                user: entry.userId,
            }));
            await RedisCache.set(CacheKeys.leaderboard(), leaderboard, CacheTTL.leaderboard);
            return res.json({ success: true, data: leaderboard });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    static async completeMission(req, res) {
        try {
            const { missionId } = req.body;
            const profile = await Gamification.findOne({ userId: req.user._id });
            if (!profile)
                return res.status(404).json({ success: false, message: 'Gamification profile not found' });
            const mission = profile.dailyMissions.find((m) => m.id === missionId);
            if (!mission)
                return res.status(404).json({ success: false, message: 'Mission not found' });
            if (mission.isCompleted)
                return res.status(400).json({ success: false, message: 'Mission already completed' });
            mission.isCompleted = true;
            mission.completedAt = new Date();
            profile.xp += mission.xpReward;
            profile.weeklyXp += mission.xpReward;
            profile.monthlyXp += mission.xpReward;
            // Level up logic
            const xpForNextLevel = profile.level * 500;
            if (profile.xp >= xpForNextLevel)
                profile.level += 1;
            await profile.save();
            // Also update User.xp
            await User.findByIdAndUpdate(req.user._id, { $inc: { xp: mission.xpReward } });
            eventBus.emit(Events.XP_AWARDED, { userId: req.user._id, xp: mission.xpReward });
            await RedisCache.del(CacheKeys.leaderboard());
            return res.json({
                success: true,
                message: `Mission completed! +${mission.xpReward} XP`,
                xp: profile.xp,
                level: profile.level,
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    static async awardXp(req, res) {
        try {
            const { userId, amount, reason } = req.body;
            await Gamification.findOneAndUpdate({ userId }, { $inc: { xp: amount, weeklyXp: amount, monthlyXp: amount } }, { upsert: true });
            await User.findByIdAndUpdate(userId, { $inc: { xp: amount } });
            await RedisCache.del(CacheKeys.leaderboard());
            return res.json({ success: true, message: `Awarded ${amount} XP for: ${reason}` });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
}
