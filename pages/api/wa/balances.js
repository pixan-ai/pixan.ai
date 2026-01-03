import twilio from 'twilio';
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
    // AI Gateway (mock por ahora)
    const aiGateway = {
      status: 'ok',
      balance: 15.50,
      currency: 'USD'
    };

    // Twilio
    let twilioBalance = { status: 'error', balance: 0, currency: 'USD' };
    try {
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      const balance = await client.balance.fetch();
      twilioBalance = {
        status: parseFloat(balance.balance) > 5 ? 'ok' : 'warning',
        balance: Math.abs(parseFloat(balance.balance)),
        currency: balance.currency
      };
    } catch (err) {
      console.error('Error fetching Twilio balance:', err);
    }

    // Gemini (mock por ahora)
    const gemini = {
      status: 'ok',
      quotaUsed: 342,
      quotaLimit: 1500
    };

    // Upstash
    let upstash = { status: 'ok', commandsUsed: 0, dailyLimit: 10000, percentUsed: 0 };
    try {
      const commands = await redis.get('upstash:commands:count') || 0;
      const dailyLimit = 10000;
      const percentUsed = Math.round((commands / dailyLimit) * 100);
      
      upstash = {
        status: percentUsed > 80 ? 'warning' : 'ok',
        commandsUsed: parseInt(commands),
        dailyLimit,
        percentUsed
      };
    } catch (err) {
      console.error('Error fetching Upstash stats:', err);
    }

    res.status(200).json({
      aiGateway,
      twilio: twilioBalance,
      gemini,
      upstash
    });
  } catch (error) {
    console.error('Error in balances API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
