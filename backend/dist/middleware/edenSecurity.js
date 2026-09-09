import { logger } from '../config/logger.js';
import { getRedisClient, isRedisAvailable } from '../config/redis.js';
const localRequestCounts = new Map();
/**
 * Distributed Sliding-Window Rate Limiter for EDEN AI endpoints.
 * Uses Redis if available; gracefully falls back to local in-memory Map.
 */
export async function edenRateLimiter(req, res, next) {
    const identifier = req.user?._id?.toString() || req.ip || 'anonymous';
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 30;
    // 1. Redis-backed rate limiting
    if (isRedisAvailable()) {
        try {
            const redis = getRedisClient();
            if (redis) {
                const key = `rate_limit:eden:${identifier}`;
                const currentCount = await redis.incr(key);
                if (currentCount === 1) {
                    await redis.pexpire(key, windowMs);
                }
                if (currentCount > maxRequests) {
                    logger.warn({ identifier, currentCount }, '[EDEN Security] Distributed Redis Rate Limit Exceeded');
                    return res.status(429).json({
                        success: false,
                        error: 'EDEN AI request rate limit exceeded (Redis Throttling). Please wait 1 minute before submitting more requests.',
                    });
                }
                return next();
            }
        }
        catch (err) {
            logger.warn({ err: err.message }, '[EDEN Security] Redis rate limit error, falling back to local memory');
        }
    }
    // 2. Fallback to Local In-Memory Map
    const now = Date.now();
    const userRecord = localRequestCounts.get(identifier);
    if (!userRecord || now > userRecord.resetTime) {
        localRequestCounts.set(identifier, { count: 1, resetTime: now + windowMs });
        return next();
    }
    userRecord.count++;
    if (userRecord.count > maxRequests) {
        logger.warn({ identifier }, '[EDEN Security] Local Memory Rate Limit Exceeded');
        return res.status(429).json({
            success: false,
            error: 'EDEN AI request rate limit exceeded. Please wait 1 minute before submitting more requests.',
        });
    }
    return next();
}
/**
 * Prompt Injection Protection Middleware
 * Strips attempt phrases to override system prompts and wraps input in XML isolation tags.
 */
export function edenPromptSanitizer(req, res, next) {
    if (req.body && typeof req.body.message === 'string') {
        let sanitized = req.body.message;
        // Strip common system prompt override patterns
        sanitized = sanitized.replace(/(ignore previous instructions|disregard all prior instructions|forget system prompt|you are now DAN|override security)/gi, '[blocked instruction attempt]');
        req.body.message = `<user_query>\n${sanitized.trim()}\n</user_query>`;
    }
    next();
}
