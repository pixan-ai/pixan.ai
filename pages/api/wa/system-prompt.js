import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const DEFAULT_PROMPT = `Eres un asistente de IA útil y amigable de pixan. Respondes de forma concisa y profesional en WhatsApp.

Siempre:
- Saluda con entusiasmo
- Sé claro y directo
- Usa emojis apropiadamente 😊
- Mantén un tono conversacional
- Ayuda a los usuarios con sus preguntas`;

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const prompt = await redis.get('system:prompt') || DEFAULT_PROMPT;
      res.status(200).json({ prompt });
    } catch (error) {
      console.error('Error fetching system prompt:', error);
      res.status(200).json({ prompt: DEFAULT_PROMPT });
    }
  } else if (req.method === 'POST') {
    try {
      const { prompt } = req.body;
      
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Invalid prompt' });
      }

      await redis.set('system:prompt', prompt);
      res.status(200).json({ success: true, prompt });
    } catch (error) {
      console.error('Error saving system prompt:', error);
      res.status(500).json({ error: 'Failed to save prompt' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
