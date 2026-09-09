import { EdenRequestLog } from '../models/EdenRequestLog.js';
import { logger } from '../config/logger.js';
export class ObservabilityController {
    /**
     * EDEN AI usage analytics — admin only
     */
    static async getEdenAnalytics(req, res) {
        try {
            const { period = '7d' } = req.query;
            const days = period === '30d' ? 30 : period === '1d' ? 1 : 7;
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - days);
            const [totalRequests, successCount, toolUsageData, intentDist, providerDist, latencyStats, dailyTrend,] = await Promise.all([
                EdenRequestLog.countDocuments({ timestamp: { $gte: cutoff } }),
                EdenRequestLog.countDocuments({ timestamp: { $gte: cutoff }, success: true }),
                // Tool usage frequency
                EdenRequestLog.aggregate([
                    { $match: { timestamp: { $gte: cutoff }, toolsUsed: { $not: { $size: 0 } } } },
                    { $unwind: '$toolsUsed' },
                    { $group: { _id: '$toolsUsed', count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                    { $limit: 10 },
                ]),
                // Intent distribution
                EdenRequestLog.aggregate([
                    { $match: { timestamp: { $gte: cutoff } } },
                    { $group: { _id: '$intent', count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                    { $limit: 10 },
                ]),
                // Provider breakdown
                EdenRequestLog.aggregate([
                    { $match: { timestamp: { $gte: cutoff } } },
                    { $group: { _id: '$provider', count: { $sum: 1 } } },
                ]),
                // Latency percentiles
                EdenRequestLog.aggregate([
                    { $match: { timestamp: { $gte: cutoff }, success: true } },
                    {
                        $group: {
                            _id: null,
                            avgLatency: { $avg: '$latencyMs' },
                            maxLatency: { $max: '$latencyMs' },
                            minLatency: { $min: '$latencyMs' },
                        },
                    },
                ]),
                // Daily request trend
                EdenRequestLog.aggregate([
                    { $match: { timestamp: { $gte: cutoff } } },
                    {
                        $group: {
                            _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
                            count: { $sum: 1 },
                            successCount: { $sum: { $cond: ['$success', 1, 0] } },
                        },
                    },
                    { $sort: { _id: 1 } },
                ]),
            ]);
            const webSearchedCount = await EdenRequestLog.countDocuments({ timestamp: { $gte: cutoff }, webSearched: true });
            const ragRetrievedCount = await EdenRequestLog.countDocuments({ timestamp: { $gte: cutoff }, ragRetrieved: true });
            return res.json({
                success: true,
                data: {
                    period,
                    cutoffDate: cutoff.toISOString(),
                    overview: {
                        totalRequests,
                        successCount,
                        errorCount: totalRequests - successCount,
                        successRate: totalRequests > 0 ? Math.round((successCount / totalRequests) * 100) : 0,
                        webSearchCount: webSearchedCount,
                        ragRetrievalCount: ragRetrievedCount,
                    },
                    latency: latencyStats[0] || { avgLatency: 0, maxLatency: 0, minLatency: 0 },
                    toolUsage: toolUsageData.map(t => ({ tool: t._id, count: t.count })),
                    intentDistribution: intentDist.map(i => ({ intent: i._id, count: i.count })),
                    providerBreakdown: providerDist.map(p => ({ provider: p._id, count: p.count })),
                    dailyTrend,
                },
            });
        }
        catch (err) {
            logger.error({ err: err.message }, '[ObservabilityController] getEdenAnalytics error');
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * User-level EDEN usage (admin or self)
     */
    static async getUserAIUsage(req, res) {
        try {
            const userId = req.params.userId || req.user._id.toString();
            // Only admin or self can access
            if (userId !== req.user._id.toString() && !['admin', 'super_admin'].includes(req.user.role)) {
                return res.status(403).json({ success: false, message: 'Unauthorized.' });
            }
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 30);
            const [totalRequests, toolsData, intentsData, recentLogs] = await Promise.all([
                EdenRequestLog.countDocuments({ userId, timestamp: { $gte: cutoff } }),
                EdenRequestLog.aggregate([
                    { $match: { userId, timestamp: { $gte: cutoff } } },
                    { $unwind: { path: '$toolsUsed', preserveNullAndEmptyArrays: true } },
                    { $group: { _id: '$toolsUsed', count: { $sum: 1 } } },
                    { $sort: { count: -1 } }, { $limit: 5 },
                ]),
                EdenRequestLog.aggregate([
                    { $match: { userId, timestamp: { $gte: cutoff } } },
                    { $group: { _id: '$intent', count: { $sum: 1 } } },
                    { $sort: { count: -1 } }, { $limit: 5 },
                ]),
                EdenRequestLog.find({ userId, timestamp: { $gte: cutoff } })
                    .sort({ timestamp: -1 })
                    .limit(10)
                    .select('query intent latencyMs toolsUsed webSearched ragRetrieved success timestamp')
                    .lean(),
            ]);
            return res.json({
                success: true,
                data: { userId, totalRequests, topTools: toolsData, topIntents: intentsData, recentLogs },
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * System health snapshot
     */
    static async getSystemHealth(req, res) {
        try {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const [totalLastHour, errorsLastHour, avgLatencyResult] = await Promise.all([
                EdenRequestLog.countDocuments({ timestamp: { $gte: oneHourAgo } }),
                EdenRequestLog.countDocuments({ timestamp: { $gte: oneHourAgo }, success: false }),
                EdenRequestLog.aggregate([
                    { $match: { timestamp: { $gte: oneHourAgo }, success: true } },
                    { $group: { _id: null, avgLatency: { $avg: '$latencyMs' } } },
                ]),
            ]);
            const errorRate = totalLastHour > 0 ? Math.round((errorsLastHour / totalLastHour) * 100) : 0;
            const avgLatency = Math.round(avgLatencyResult[0]?.avgLatency || 0);
            const healthStatus = errorRate > 20 ? 'degraded' : errorRate > 5 ? 'warning' : 'healthy';
            return res.json({
                success: true,
                data: {
                    status: healthStatus,
                    lastHour: { totalRequests: totalLastHour, errors: errorsLastHour, errorRate, avgLatencyMs: avgLatency },
                    timestamp: new Date().toISOString(),
                },
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
}
