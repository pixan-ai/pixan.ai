/**
 * Vercel Logs API
 * Returns technical execution logs from Redis
 */

import { db } from '../../../lib/wa/redis.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get recent technical logs
    const logs = await db.lrange('logs:technical', 0, 49);
    
    const parsedLogs = logs.map(log => {
      try {
        return typeof log === 'string' ? JSON.parse(log) : log;
      } catch {
        return null;
      }
    }).filter(Boolean);

    res.status(200).json({ logs: parsedLogs });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
