import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Get current balance
    try {
      const balance = await redis.get('aigateway:balance') || 13.68;
      res.status(200).json({ balance: parseFloat(balance) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    // Update balance
    try {
      const { balance } = req.body;
      if (typeof balance !== 'number' || balance < 0) {
        return res.status(400).json({ error: 'Invalid balance value' });
      }
      
      await redis.set('aigateway:balance', balance);
      res.status(200).json({ success: true, balance });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}