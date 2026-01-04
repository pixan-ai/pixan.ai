/**
 * Get real-time Upstash statistics from Developer API
 */

const UPSTASH_EMAIL = process.env.UPSTASH_EMAIL || 'aaaprosperi@gmail.com';
const UPSTASH_API_KEY = process.env.UPSTASH_API_KEY || '46faa520-e70c-4354-a523-156dac443925';
const UPSTASH_DATABASE_ID = process.env.UPSTASH_DATABASE_ID || '63f780d9-3d08-4215-84ef-2efbd44c4b53';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create Basic Auth header
    const credentials = Buffer.from(`${UPSTASH_EMAIL}:${UPSTASH_API_KEY}`).toString('base64');
    
    // Call Upstash Developer API
    const response = await fetch(
      `https://api.upstash.com/v2/redis/stats/${UPSTASH_DATABASE_ID}`,
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Upstash API error: ${response.status}`);
    }

    const data = await response.json();

    // Extract relevant stats
    const stats = {
      // Daily commands (the one we care about most)
      daily_commands: data.daily_net_commands || 0,
      daily_reads: data.daily_read_requests || 0,
      daily_writes: data.daily_write_requests || 0,
      
      // Storage
      current_storage_bytes: data.current_storage || 0,
      current_storage_mb: ((data.current_storage || 0) / (1024 * 1024)).toFixed(2),
      
      // Monthly totals
      monthly_requests: data.total_monthly_requests || 0,
      monthly_storage_bytes: data.total_monthly_storage || 0,
      monthly_billing: data.total_monthly_billing || 0,
      
      // Limits (hardcoded for free tier)
      daily_limit: 10000,
      storage_limit_mb: 256,
      
      // Calculated
      percent_daily_used: Math.round(((data.daily_net_commands || 0) / 10000) * 100),
      percent_storage_used: Math.round((((data.current_storage || 0) / (1024 * 1024)) / 256) * 100)
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Upstash stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Upstash stats',
      message: error.message 
    });
  }
}
