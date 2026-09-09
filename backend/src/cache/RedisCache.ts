import { getRedisClient, isRedisAvailable } from '../config/redis.js'

export const CacheKeys = {
  dashboard: (userId: string) => `dashboard:${userId}`,
  userProfile: (userId: string) => `user:profile:${userId}`,
  leaderboard: () => `gamification:leaderboard`,
  courses: (filters: string) => `courses:${filters}`,
  jobs: (filters: string) => `jobs:${filters}`,
  events: () => `events:all`,
  forumPosts: (page: number) => `forum:posts:page:${page}`,
  adminStats: () => `admin:stats`,
  notifications: (userId: string) => `notifications:${userId}:unread`,
  attendanceAnalytics: (userId: string) => `attendance:analytics:${userId}`,
  edenContext: (userId: string) => `eden:context:${userId}`,
  search: (query: string, types: string) => `search:${query}:${types}`,
}

export const CacheTTL = {
  dashboard: 300,           // 5 min
  userProfile: 300,         // 5 min
  leaderboard: 600,         // 10 min
  courses: 900,             // 15 min
  jobs: 300,                // 5 min
  events: 300,              // 5 min
  forumPosts: 120,          // 2 min
  adminStats: 300,          // 5 min
  notifications: 30,        // 30 sec
  attendanceAnalytics: 300, // 5 min
  edenContext: 180,         // 3 min
  search: 60,               // 1 min
}

export class RedisCache {
  static async get<T>(key: string): Promise<T | null> {
    if (!isRedisAvailable()) return null
    try {
      const client = getRedisClient()!
      const data = await client.get(key)
      return data ? (JSON.parse(data) as T) : null
    } catch {
      return null
    }
  }

  static async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    if (!isRedisAvailable()) return
    try {
      const client = getRedisClient()!
      await client.setex(key, ttlSeconds, JSON.stringify(value))
    } catch {
      // Silently fail — app continues without cache
    }
  }

  static async del(key: string | string[]): Promise<void> {
    if (!isRedisAvailable()) return
    try {
      const client = getRedisClient()!
      const keys = Array.isArray(key) ? key : [key]
      if (keys.length > 0) await client.del(...keys)
    } catch {
      // Silently fail
    }
  }

  static async flush(pattern: string): Promise<void> {
    if (!isRedisAvailable()) return
    try {
      const client = getRedisClient()!
      const keys = await client.keys(pattern)
      if (keys.length > 0) await client.del(...keys)
    } catch {
      // Silently fail
    }
  }

  static async increment(key: string, ttlSeconds?: number): Promise<number> {
    if (!isRedisAvailable()) return 0
    try {
      const client = getRedisClient()!
      const val = await client.incr(key)
      if (ttlSeconds && val === 1) await client.expire(key, ttlSeconds)
      return val
    } catch {
      return 0
    }
  }
}
