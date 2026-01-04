/**
 * Logger Service
 * Conversation logging for dashboard
 */

import { db } from './redis.js';

const MAX_LOGS = 100;

export const saveLog = async (log) => {
  try {
    const entry = {
      id: `${Date.now()}-${log.userId?.slice(-4) || 'anon'}`,
      timestamp: new Date().toISOString(),
      from: log.userId,
      message: log.message || '',
      response: log.response || '',
      model: log.model || 'unknown',
      status: log.status || 'success'
    };
    
    console.log('💾 Saving log:', entry.id);
    
    await db.lpush('logs:messages', JSON.stringify(entry));
    await db.ltrim('logs:messages', 0, MAX_LOGS - 1);
    
    console.log('✅ Log saved successfully');
  } catch (error) {
    console.error('❌ Error saving log:', error);
  }
};

export const getLogs = async (limit = 50) => {
  try {
    const logs = await db.lrange('logs:messages', 0, limit - 1);
    return logs.map(log => {
      try {
        return typeof log === 'string' ? JSON.parse(log) : log;
      } catch {
        return null;
      }
    }).filter(Boolean);
  } catch (error) {
    console.error('Error getting logs:', error);
    return [];
  }
};

export const clearLogs = async () => {
  try {
    await db.del('logs:messages');
  } catch (error) {
    console.error('Error clearing logs:', error);
  }
};
