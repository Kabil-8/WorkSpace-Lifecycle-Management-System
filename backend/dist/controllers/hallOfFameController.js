import HallOfFameItem from '../models/HallOfFame.js';
export class HallOfFameController {
    static async getAll(req, res) {
        try {
            // No fallback data - return only verified achievements from MongoDB
            const items = await HallOfFameItem.find().sort({ achievementDate: -1 }).lean();
            return res.json({ success: true, data: items });
        }
        catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }
    static async create(req, res) {
        try {
            const item = await HallOfFameItem.create(req.body);
            return res.json({ success: true, data: item });
        }
        catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }
}
