import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const totalMessages = await redis.get('stats:total_messages') || 0;
    const activeUsers = await redis.get('stats:active_users') || 0;
    const modelsUsed = 11; // Número fijo de modelos disponibles

    res.status(200).json({
      totalMessages: parseInt(totalMessages),
      activeUsers: parseInt(activeUsers),
      modelsUsed
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(200).json({
      totalMessages: 0,
      activeUsers: 0,
      modelsUsed: 11
    });
  }
}
