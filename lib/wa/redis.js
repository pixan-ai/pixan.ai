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

export const db = {
  async get(key) {
    return getRedis().get(key);
  },
  
  async set(key, value, options = {}) {
    const redis = getRedis();
    if (options.ex) {
      return redis.setex(key, options.ex, value);
    }
    return redis.set(key, value);
  },
  
  async del(key) {
    return getRedis().del(key);
  },
  
  async incr(key) {
    return getRedis().incr(key);
  },
  
  async lpush(key, value) {
    return getRedis().lpush(key, value);
  },
  
  async ltrim(key, start, stop) {
    return getRedis().ltrim(key, start, stop);
  },
  
  async lrange(key, start, stop) {
    return getRedis().lrange(key, start, stop);
  },

  // Direct access for special cases
  raw: () => getRedis()
};
