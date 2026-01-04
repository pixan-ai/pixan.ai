/**
 * Balances API - Get all service balances
 */

import { getBalance as getTwilioBalance } from '../../../lib/wa/twilio.js';
import { db } from '../../../lib/wa/redis.js';
import { LIMITS } from '../../../lib/wa/config.js';

const getAIGatewayBalance = async () => {
  try {
    const response = await fetch('https://ai-gateway.vercel.sh/v1/credits', {
      headers: {
        'Authorization': `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) return { status: 'error', balance: 0 };
    
    const data = await response.json();
    const balance = parseFloat(data.balance) || 0;
    
    return {
      status: balance > 5 ? 'ok' : balance > 1 ? 'warning' : 'error',
      balance,
      currency: 'USD'
    };
  } catch {
    return { status: 'error', balance: 0, currency: 'USD' };
  }
};

const getGeminiUsage = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const usage = await db.get(`gemini:usage:${today}`) || 0;
    const used = parseInt(usage);
    
    return {
      status: used < LIMITS.geminiDaily * 0.8 ? 'ok' : 'warning',
      quotaUsed: used,
      quotaLimit: LIMITS.geminiDaily
    };
  } catch {
    return {
      status: 'error',
      quotaUsed: 0,
      quotaLimit: LIMITS.geminiDaily
    };
  }
};

const getUpstashStats = async () => {
  try {
    // Call Upstash Developer API directly
    const email = process.env.UPSTASH_EMAIL;
    const apiKey = process.env.UPSTASH_API_KEY;
    const databaseId = process.env.UPSTASH_DATABASE_ID;
    
    if (!email || !apiKey || !databaseId) {
      console.log('⚠️ Upstash credentials not configured, using fallback');
      throw new Error('Missing Upstash credentials');
    }
    
    const credentials = Buffer.from(`${email}:${apiKey}`).toString('base64');
    
    const response = await fetch(
      `https://api.upstash.com/v2/redis/stats/${databaseId}`,
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error('❌ Upstash API error:', response.status);
      throw new Error(`Upstash API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Calculate stats
    const dailyCommands = data.daily_net_commands || 0;
    const dailyLimit = 10000;
    const percentUsed = Math.round((dailyCommands / dailyLimit) * 100);
    const storageMB = ((data.current_storage || 0) / (1024 * 1024)).toFixed(2);
    
    const status = percentUsed < 70 ? 'ok' : percentUsed < 90 ? 'warning' : 'error';
    
    console.log('✅ Upstash stats fetched:', { dailyCommands, percentUsed });
    
    return {
      status,
      commandsUsed: dailyCommands,
      dailyLimit,
      percentUsed,
      storageMB: parseFloat(storageMB),
      storageLimitMB: 256
    };
  } catch (error) {
    console.error('Upstash stats error:', error.message);
    
    // Fallback to simple connection check
    try {
      await db.get('health:check');
      return {
        status: 'ok',
        message: 'Connected',
        dailyLimit: LIMITS.upstashDaily
      };
    } catch {
      return {
        status: 'error',
        message: 'Connection failed',
        dailyLimit: LIMITS.upstashDaily
      };
    }
  }
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const [aiGateway, twilio, gemini, upstash] = await Promise.all([
      getAIGatewayBalance(),
      getTwilioBalance().then(b => ({
        status: b.balance > 5 ? 'ok' : 'warning',
        ...b
      })),
      getGeminiUsage(),
      getUpstashStats()
    ]);

    res.status(200).json({ aiGateway, twilio, gemini, upstash });
  } catch (error) {
    console.error('Balances error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
