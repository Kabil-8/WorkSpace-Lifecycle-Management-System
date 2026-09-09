import User from '../models/User.js';
import Course from '../models/Course.js';
import Assignment from '../models/Assignment.js';
import Job from '../models/Job.js';
import ForumPost from '../models/ForumPost.js';
import { RedisCache, CacheKeys, CacheTTL } from '../cache/RedisCache.js';
export class SearchController {
    static async globalSearch(req, res) {
        try {
            const { q, types = 'all', limit = '5' } = req.query;
            if (!q || q.trim().length < 2) {
                return res.json({ success: true, data: {} });
            }
            const cacheKey = CacheKeys.search(q, types);
            const cached = await RedisCache.get(cacheKey);
            if (cached)
                return res.json({ success: true, data: cached, cached: true });
            const lim = parseInt(limit);
            const searchAll = types === 'all';
            const typeList = types.split(',');
            const results = {};
            const searches = [];
            if (searchAll || typeList.includes('users')) {
                searches.push(User.find({ $text: { $search: q }, isActive: true })
                    .select('name email role department avatarUrl').limit(lim)
                    .then(r => { results.users = r; }));
            }
            if (searchAll || typeList.includes('courses')) {
                searches.push(Course.find({ $text: { $search: q }, status: 'published' })
                    .select('title description instructorName level').limit(lim)
                    .then(r => { results.courses = r; }));
            }
            if (searchAll || typeList.includes('assignments')) {
                searches.push(Assignment.find({ $text: { $search: q } })
                    .select('title courseName dueDate priority').limit(lim)
                    .then(r => { results.assignments = r; }));
            }
            if (searchAll || typeList.includes('jobs')) {
                searches.push(Job.find({ $text: { $search: q }, isActive: true })
                    .select('title company location type').limit(lim)
                    .then(r => { results.jobs = r; }));
            }
            if (searchAll || typeList.includes('forum')) {
                searches.push(ForumPost.find({ $text: { $search: q } })
                    .select('title category authorName createdAt').limit(lim)
                    .then(r => { results.forum = r; }));
            }
            await Promise.all(searches);
            await RedisCache.set(cacheKey, results, CacheTTL.search);
            return res.json({ success: true, data: results, query: q });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
}
