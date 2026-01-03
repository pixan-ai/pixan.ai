import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const logs = await redis.lrange('logs:messages', 0, limit - 1);
      
      const parsedLogs = logs.map(log => {
        try {
          return typeof log === 'string' ? JSON.parse(log) : log;
        } catch {
          return log;
        }
      });

      res.status(200).json({ logs: parsedLogs });
    } catch (error) {
      console.error('Error fetching logs:', error);
      res.status(200).json({ logs: [] });
    }
  } else if (req.method === 'DELETE') {
    try {
      await redis.del('logs:messages');
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting logs:', error);
      res.status(500).json({ error: 'Failed to delete logs' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
