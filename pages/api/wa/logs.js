/**
 * Logs API - Conversation logs for dashboard
 */

import { getLogs, clearLogs } from '../../../lib/wa/logger.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const limit = parseInt(req.query.limit) || 50;
    const logs = await getLogs(limit);
    return res.status(200).json({ logs });
  }
  
  if (req.method === 'DELETE') {
    await clearLogs();
    return res.status(200).json({ ok: true });
  }
  
  res.status(405).json({ error: 'Method not allowed' });
}
