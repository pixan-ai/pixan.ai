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
  const today = new Date().toISOString().split('T')[0];
  const usage = await db.get(`gemini:usage:${today}`) || 0;
  const used = parseInt(usage);
  
  return {
    status: used < LIMITS.geminiDaily * 0.8 ? 'ok' : 'warning',
    quotaUsed: used,
    quotaLimit: LIMITS.geminiDaily
  };
};

const getUpstashUsage = async () => {
  const today = new Date().toISOString().split('T')[0];
  const commands = await db.get(`upstash:commands:${today}`) || 0;
  const used = parseInt(commands);
  const percent = Math.round((used / LIMITS.upstashDaily) * 100);
  
  return {
    status: percent < 70 ? 'ok' : percent < 90 ? 'warning' : 'error',
    commandsUsed: used,
    dailyLimit: LIMITS.upstashDaily,
    percentUsed: percent
  };
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
      getUpstashUsage()
    ]);

    res.status(200).json({ aiGateway, twilio, gemini, upstash });
  } catch (error) {
    console.error('Balances error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
