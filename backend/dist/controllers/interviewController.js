import InterviewAttempt from '../models/InterviewAttempt.js';
export class InterviewController {
    static async getHistory(req, res) {
        try {
            const user = req.user;
            const attempts = await InterviewAttempt.find({ userId: user._id }).sort({ createdAt: -1 }).lean();
            const totalSessions = attempts.length;
            const avgScore = totalSessions > 0 ? Math.round(attempts.reduce((sum, a) => sum + a.overallScore, 0) / totalSessions) : 0;
            return res.json({
                success: true,
                data: {
                    sessionsCount: totalSessions,
                    avgScore,
                    attempts,
                },
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }
    static async recordAttempt(req, res) {
        try {
            const user = req.user;
            const attempt = await InterviewAttempt.create({
                userId: user._id,
                userName: user.name,
                ...req.body,
            });
            return res.json({ success: true, data: attempt });
        }
        catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }
}
