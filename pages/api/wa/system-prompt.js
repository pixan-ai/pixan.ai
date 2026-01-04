/**
 * System Prompt API - Get/Set bot instructions
 */

import { db } from '../../../lib/wa/redis.js';
import { DEFAULT_SYSTEM_PROMPT } from '../../../lib/wa/config.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const prompt = await db.get('system:prompt') || DEFAULT_SYSTEM_PROMPT;
    return res.status(200).json({ prompt });
  }
  
  if (req.method === 'POST') {
    const { prompt } = req.body;
    
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Invalid prompt' });
    }
    
    await db.set('system:prompt', prompt);
    return res.status(200).json({ ok: true, prompt });
  }
  
  res.status(405).json({ error: 'Method not allowed' });
}
