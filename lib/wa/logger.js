/**
 * Logger Service
 * Conversation logging for dashboard
 */

import { db } from './redis.js';

const MAX_LOGS = 100;

export const saveLog = async (log) => {
  const entry = {
    id: `${Date.now()}-${log.userId?.slice(-4) || 'anon'}`,
    timestamp: new Date().toISOString(),
    from: log.userId,
    message: log.message,
    response: log.response,
    model: log.model,
    status: log.status || 'success'
  };
  
  await db.lpush('logs:messages', JSON.stringify(entry));
  await db.ltrim('logs:messages', 0, MAX_LOGS - 1);
};

export const getLogs = async (limit = 50) => {
  const logs = await db.lrange('logs:messages', 0, limit - 1);
  return logs.map(log => {
    try {
      return JSON.parse(log);
    } catch {
      return null;
    }
  }).filter(Boolean);
};

export const clearLogs = async () => {
  await db.del('logs:messages');
};
