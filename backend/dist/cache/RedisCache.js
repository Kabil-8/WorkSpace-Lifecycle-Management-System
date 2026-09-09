import { getRedisClient, isRedisAvailable } from '../config/redis.js';
export const CacheKeys = {
    dashboard: (userId) => `dashboard:${userId}`,
    userProfile: (userId) => `user:profile:${userId}`,
    leaderboard: () => `gamification:leaderboard`,
    courses: (filters) => `courses:${filters}`,
    jobs: (filters) => `jobs:${filters}`,
    events: () => `events:all`,
    forumPosts: (page) => `forum:posts:page:${page}`,
    adminStats: () => `admin:stats`,
    notifications: (userId) => `notifications:${userId}:unread`,
    attendanceAnalytics: (userId) => `attendance:analytics:${userId}`,
    edenContext: (userId) => `eden:context:${userId}`,
    search: (query, types) => `search:${query}:${types}`,
};
export const CacheTTL = {
    dashboard: 300, // 5 min
    userProfile: 300, // 5 min
    leaderboard: 600, // 10 min
    courses: 900, // 15 min
    jobs: 300, // 5 min
    events: 300, // 5 min
    forumPosts: 120, // 2 min
    adminStats: 300, // 5 min
    notifications: 30, // 30 sec
    attendanceAnalytics: 300, // 5 min
    edenContext: 180, // 3 min
    search: 60, // 1 min
};
export class RedisCache {
    static async get(key) {
        if (!isRedisAvailable())
            return null;
        try {
            const client = getRedisClient();
            const data = await client.get(key);
            return data ? JSON.parse(data) : null;
        }
        catch {
            return null;
        }
    }
    static async set(key, value, ttlSeconds) {
        if (!isRedisAvailable())
            return;
        try {
            const client = getRedisClient();
            await client.setex(key, ttlSeconds, JSON.stringify(value));
        }
        catch {
            // Silently fail — app continues without cache
        }
    }
    static async del(key) {
        if (!isRedisAvailable())
            return;
        try {
            const client = getRedisClient();
            const keys = Array.isArray(key) ? key : [key];
            if (keys.length > 0)
                await client.del(...keys);
        }
        catch {
            // Silently fail
        }
    }
    static async flush(pattern) {
        if (!isRedisAvailable())
            return;
        try {
            const client = getRedisClient();
            const keys = await client.keys(pattern);
            if (keys.length > 0)
                await client.del(...keys);
        }
        catch {
            // Silently fail
        }
    }
    static async increment(key, ttlSeconds) {
        if (!isRedisAvailable())
            return 0;
        try {
            const client = getRedisClient();
            const val = await client.incr(key);
            if (ttlSeconds && val === 1)
                await client.expire(key, ttlSeconds);
            return val;
        }
        catch {
            return 0;
        }
    }
}
