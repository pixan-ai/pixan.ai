/**
 * Stats API - Dashboard statistics
 */

import { db } from '../../../lib/wa/redis.js';
import { getLogs } from '../../../lib/wa/logger.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const logs = await getLogs(100);
    
    // Count unique users
    const uniqueUsers = new Set(logs.map(l => l.from).filter(Boolean));
    
    res.status(200).json({
      totalMessages: logs.length,
      activeUsers: uniqueUsers.size
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
