/**
 * Logger Service
 * Conversation logging and technical logs for dashboard
 */

import { db } from './redis.js';

const MAX_LOGS = 100;
const MAX_TECHNICAL_LOGS = 50;

// Save conversation log (for conversations panel)
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
    
    await db.lpush('logs:messages', JSON.stringify(entry));
    await db.ltrim('logs:messages', 0, MAX_LOGS - 1);
    
    // Also log technical entry
    await logTechnical(`✅ Conversation logged: ${entry.id}`);
  } catch (error) {
    console.error('❌ Error saving log:', error);
  }
};

// Save technical log (for technical panel)
export const logTechnical = async (message, details = null) => {
  try {
    const entry = {
      timestamp: new Date().toISOString(),
      message,
      details
    };
    
    await db.lpush('logs:technical', JSON.stringify(entry));
    await db.ltrim('logs:technical', 0, MAX_TECHNICAL_LOGS - 1);
  } catch (error) {
    // Silent fail for technical logs
    console.error('Technical log error:', error);
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
