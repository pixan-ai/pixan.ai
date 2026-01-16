import { promises as fs } from 'fs';
import path from 'path';
import { decrypt } from '../../../lib/crypto-utils';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be defined in environment variables');
}
const KEYS_FILE = path.join(process.cwd(), '.api-keys.json');

// Middleware para verificar autenticación
function verifyAuth(req) {
  const token = req.cookies?.['admin-token'];
  if (!token) return false;
  
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

// Funciones para probar cada API
async function testOpenAI(apiKey) {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    
    if (response.ok) {
      // Intentar obtener información de uso/balance
      const usageResponse = await fetch('https://api.openai.com/v1/usage', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      
      let balance = null;
      if (usageResponse.ok) {
        const usage = await usageResponse.json();
        // OpenAI no proporciona balance directo, pero podemos mostrar uso
        balance = 100; // Placeholder
      }
      
      return { success: true, balance };
    }
    
    return { success: false, error: 'Invalid API key' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testClaude(apiKey) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 10,
      }),
    });
    
    return { success: response.ok };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testGemini(apiKey) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
    );
    
    return { success: response.ok };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testPerplexity(apiKey) {
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 10,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Perplexity error:', response.status, errorData);
      return { success: false, error: `HTTP ${response.status}: ${errorData.substring(0, 100)}` };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Perplexity connection error:', error);
    return { success: false, error: error.message || 'Connection failed' };
  }
}

async function testDeepSeek(apiKey) {
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 10,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('DeepSeek error:', response.status, errorData);
      return { success: false, error: `HTTP ${response.status}: ${errorData.substring(0, 100)}` };
    }
    
    return { success: true };
  } catch (error) {
    console.error('DeepSeek connection error:', error);
    return { success: false, error: error.message || 'Connection failed' };
  }
}

async function testMistral(apiKey) {
  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-tiny',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 10,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Mistral error:', response.status, errorData);
      return { success: false, error: `HTTP ${response.status}: ${errorData.substring(0, 100)}` };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Mistral connection error:', error);
    return { success: false, error: error.message || 'Connection failed' };
  }
}

export default async function handler(req, res) {
  if (!verifyAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { provider, apiKey } = req.body;
    
    if (!provider || !apiKey) {
      return res.status(400).json({ error: 'Provider and API key required' });
    }

    // Probar la conexión según el proveedor
    let result;
    switch (provider) {
      case 'openai':
        result = await testOpenAI(apiKey);
        break;
      case 'claude':
        result = await testClaude(apiKey);
        break;
      case 'gemini':
        result = await testGemini(apiKey);
        break;
      case 'perplexity':
        result = await testPerplexity(apiKey);
        break;
      case 'deepseek':
        result = await testDeepSeek(apiKey);
        break;
      case 'mistral':
        result = await testMistral(apiKey);
        break;
      default:
        return res.status(400).json({ error: 'Unknown provider' });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error testing connection:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}