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
    // Call our new Upstash stats endpoint
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/wa/upstash-stats`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch Upstash stats');
    }
    
    const stats = await response.json();
    
    // Determine status based on usage percentage
    const percentUsed = stats.percent_daily_used || 0;
    const status = percentUsed < 70 ? 'ok' : percentUsed < 90 ? 'warning' : 'error';
    
    return {
      status,
      commandsUsed: stats.daily_commands || 0,
      dailyLimit: stats.daily_limit || 10000,
      percentUsed,
      storageMB: parseFloat(stats.current_storage_mb || 0),
      storageLimitMB: stats.storage_limit_mb || 256
    };
  } catch (error) {
    console.error('Upstash stats error:', error);
    
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
