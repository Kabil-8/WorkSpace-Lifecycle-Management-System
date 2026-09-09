import { Redis } from 'ioredis';
import { logger } from './logger.js';
let redisClient = null;
let isConnected = false;
export async function connectRedis() {
    try {
        const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
            connectTimeout: 3000,
            maxRetriesPerRequest: 1,
            enableOfflineQueue: false,
            lazyConnect: true,
            retryStrategy: (times) => {
                if (times > 3)
                    return null; // Stop retrying
                return Math.min(times * 200, 1000);
            },
        });
        client.on('connect', () => {
            isConnected = true;
            logger.info('[Redis] Connected successfully');
        });
        client.on('error', (err) => {
            if (isConnected)
                logger.warn({ err: err.message }, '[Redis] Connection error');
            isConnected = false;
        });
        client.on('close', () => { isConnected = false; });
        await client.connect();
        redisClient = client;
    }
    catch (err) {
        logger.warn(`[Redis] Could not connect (${err.message}). Running without cache.`);
        redisClient = null;
        isConnected = false;
    }
}
export function getRedisClient() {
    return isConnected ? redisClient : null;
}
export function isRedisAvailable() {
    return isConnected && redisClient !== null;
}
