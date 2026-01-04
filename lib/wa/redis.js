/**
 * Redis Service - Singleton pattern
 * Centralized Redis client with helper methods
 */

import { Redis } from '@upstash/redis';

let redisInstance = null;

export const getRedis = () => {
  if (!redisInstance) {
    redisInstance = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redisInstance;
};

// Track daily commands for monitoring
const trackCommand = async () => {
  try {
    const redis = getRedis();
    const today = new Date().toISOString().split('T')[0];
    await redis.incr(`upstash:commands:${today}`);
  } catch (err) {
    // Silent fail - don't break main flow
  }
};

export const db = {
  async get(key) {
    await trackCommand();
    return getRedis().get(key);
  },
  
  async set(key, value, options = {}) {
    await trackCommand();
    const redis = getRedis();
    if (options.ex) {
      return redis.setex(key, options.ex, value);
    }
    return redis.set(key, value);
  },
  
  async del(key) {
    await trackCommand();
    return getRedis().del(key);
  },
  
  async incr(key) {
    await trackCommand();
    return getRedis().incr(key);
  },
  
  async lpush(key, value) {
    await trackCommand();
    return getRedis().lpush(key, value);
  },
  
  async ltrim(key, start, stop) {
    await trackCommand();
    return getRedis().ltrim(key, start, stop);
  },
  
  async lrange(key, start, stop) {
    await trackCommand();
    return getRedis().lrange(key, start, stop);
  },

  // Direct access for special cases
  raw: () => getRedis()
};
