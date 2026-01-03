/**
 * WhatsApp Bot con estrategia híbrida + Dashboard Logging
 * - Default: Gemini API directa (GRATIS hasta 1,500 msg/día)
 * - Opcional: AI Gateway para otros modelos
 * - Logs para dashboard pixan.ai/WA
 * Built for pixan.ai ecosystem
 */

import twilio from 'twilio';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Upstash Redis REST API
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// AI Gateway config (solo para modelos no-Gemini)
const AI_GATEWAY_API_KEY = process.env.AI_GATEWAY_API_KEY;
const AI_GATEWAY_URL = 'https://ai-gateway.vercel.sh/v1/chat/completions';

// Gemini API directa (default - GRATIS)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Configuración de memoria
const RECENT_MESSAGES_LIMIT = 20;
const SUMMARIZE_THRESHOLD = 30;
const MEMORY_EXPIRATION = 31536000; // 12 meses

// Modelos disponibles
const MODELS = {
  'gemini': { provider: 'google-direct', model: 'gemini-3-flash-preview', apiVersion: 'v1beta', vision: true },
  'gemini-pro': { provider: 'google-direct', model: 'gemini-3-pro-preview', apiVersion: 'v1beta', vision: true },
  'gemini2': { provider: 'google-direct', model: 'gemini-2.0-flash', apiVersion: 'v1beta', vision: true },
  'opus': { provider: 'ai-gateway', model: 'anthropic/claude-opus-4-20250514', vision: true },
  'sonnet': { provider: 'ai-gateway', model: 'anthropic/claude-sonnet-4-20250514', vision: true },
  'claude': { provider: 'ai-gateway', model: 'anthropic/claude-sonnet-4-20250514', vision: true },
  'gpt': { provider: 'ai-gateway', model: 'openai/gpt-5.2', vision: true },
  'gpt5': { provider: 'ai-gateway', model: 'openai/gpt-5.2', vision: true },
  'gemini25': { provider: 'ai-gateway', model: 'google/gemini-2.5-flash', vision: true },
  'gemini-thinking': { provider: 'ai-gateway', model: 'google/gemini-2.0-flash-thinking-exp', vision: false },
  'sonar': { provider: 'ai-gateway', model: 'perplexity/sonar-pro', vision: false },
  'deepseek': { provider: 'ai-gateway', model: 'deepseek/deepseek-v3.2', vision: false },
  'grok': { provider: 'ai-gateway', model: 'x-ai/grok-4.1', vision: false },
  'kimi': { provider: 'ai-gateway', model: 'moonshot/kimi-k2', vision: false },
};

const DEFAULT_MODEL = 'gemini';

async function upstashCommand(commands) {
  try {
    const response = await fetch(`${UPSTASH_URL}/pipeline`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${UPSTASH_TOKEN}` },
      body: JSON.stringify(commands),
    });
    return await response.json();
  } catch (error) {
    console.error('Upstash error:', error);
    return null;
  }
}

async function saveLog(userId, userMessage, responseText, currentModel, status = 'success') {
  try {
    const logEntry = {
      id: `${Date.now()}-${userId.slice(-4)}`,
      timestamp: new Date().toISOString(),
      from: userId,
      message: typeof userMessage === 'string' ? userMessage : '[imagen]',
      model: currentModel,
      response: responseText.substring(0, 500),
      status
    };
    
    await upstashCommand([
      ['LPUSH', 'logs:messages', JSON.stringify(logEntry)],
      ['LTRIM', 'logs:messages', 0, 99],
      ['INCR', 'stats:total_messages'],
      ['SADD', 'stats:active_users_set', userId],
      ['EXPIRE', 'stats:active_users_set', 86400]
    ]);
    
    const activeUsersResult = await upstashCommand([['SCARD', 'stats:active_users_set']]);
    if (activeUsersResult?.[0]?.result) {
      await upstashCommand([['SET', 'stats:active_users', activeUsersResult[0].result]]);
    }
    console.log('📊 Log saved');
  } catch (error) {
    console.error('Error saving log:', error);
  }
}

async function saveRecentMessages(userId, messages) {
  try {
    const limited = messages.slice(-RECENT_MESSAGES_LIMIT);
    await upstashCommand([
      ['SET', `recent:${userId}`, JSON.stringify(limited)],
      ['EXPIRE', `recent:${userId}`, MEMORY_EXPIRATION]
    ]);
  } catch (error) {
    console.error('Error saving recent messages:', error);
  }
}

async function getRecentMessages(userId) {
  try {
    const result = await upstashCommand([['GET', `recent:${userId}`]]);
    if (!result?.[0]?.result) return [];
    const parsed = JSON.parse(result[0].result);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error getting recent messages:', error);
    return [];
  }
}

async function saveLongTermMemory(userId, summary) {
  try {
    await upstashCommand([
      ['SET', `summary:${userId}`, summary],
      ['EXPIRE', `summary:${userId}`, MEMORY_EXPIRATION]
    ]);
  } catch (error) {
    console.error('Error saving long term memory:', error);
  }
}

async function getLongTermMemory(userId) {
  try {
    const result = await upstashCommand([['GET', `summary:${userId}`]]);
    return result?.[0]?.result || null;
  } catch (error) {
    console.error('Error getting long term memory:', error);
    return null;
  }
}

async function getAndIncrementCount(userId) {
  try {
    const result = await upstashCommand([
      ['GET', `count:${userId}`],
      ['INCR', `count:${userId}`],
      ['EXPIRE', `count:${userId}`, MEMORY_EXPIRATION]
    ]);
    return result?.[0]?.result ? parseInt(result[0].result) : 0;
  } catch (error) {
    console.error('Error with counter:', error);
    return 0;
  }
}

async function getUserModel(userId) {
  try {
    const result = await upstashCommand([['GET', `model:${userId}`]]);
    return result?.[0]?.result || DEFAULT_MODEL;
  } catch (error) {
    console.error('Error getting user model:', error);
    return DEFAULT_MODEL;
  }
}

async function setUserModel(userId, model) {
  try {
    await upstashCommand([
      ['SET', `model:${userId}`, model],
      ['EXPIRE', `model:${userId}`, MEMORY_EXPIRATION]
    ]);
  } catch (error) {
    console.error('Error setting user model:', error);
  }
}

async function resetAllMemory(userId) {
  try {
    await upstashCommand([
      ['DEL', `summary:${userId}`],
      ['DEL', `recent:${userId}`],
      ['DEL', `count:${userId}`],
      ['DEL', `model:${userId}`]
    ]);
  } catch (error) {
    console.error('Error resetting memory:', error);
  }
}

async function downloadImageAsBase64(imageUrl, twilioAccountSid, twilioAuthToken) {
  const response = await fetch(imageUrl, {
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64')
    }
  });
  if (!response.ok) throw new Error(`Failed to download image: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const mimeType = response.headers.get('content-type') || 'image/jpeg';
  return { base64, mimeType };
}

function convertToGeminiFormat(messages) {
  const contents = [];
  for (const msg of messages) {
    if (msg.role === 'user') {
      if (Array.isArray(msg.content)) {
        const parts = [];
        for (const item of msg.content) {
          if (item.type === 'text') {
            parts.push({ text: item.text });
          } else if (item.type === 'image_url') {
            const base64Data = item.image_url.url.split(',')[1];
            const mimeType = item.image_url.url.match(/data:([^;]+);/)[1];
            parts.push({ inlineData: { mimeType, data: base64Data } });
          }
        }
        contents.push({ role: 'user', parts });
      } else {
        contents.push({ role: 'user', parts: [{ text: msg.content }] });
      }
    } else if (msg.role === 'assistant') {
      contents.push({ role: 'model', parts: [{ text: msg.content }] });
    }
  }
  return contents;
}

async function callGeminiDirect(messages, modelName, apiVersion = 'v1beta') {
  const geminiMessages = convertToGeminiFormat(messages);
  const response = await fetch(
    `https://generativelanguage.googleapis.com/${apiVersion}/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: geminiMessages,
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024, topP: 0.95, topK: 40 },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
        ]
      })
    }
  );
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }
  const data = await response.json();
  const candidate = data.candidates?.[0];
  if (!candidate?.content) throw new Error('Invalid Gemini response');
  if (candidate.finishReason === 'SAFETY') throw new Error('Content blocked by safety filters');
  return candidate.content.parts[0].text;
}

async function callAIGateway(messages, modelString) {
  const response = await fetch(AI_GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AI_GATEWAY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelString,
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });
  if (!response.ok) throw new Error(`AI Gateway error: ${response.status}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

async function callAI(messages, modelKey) {
  const modelConfig = MODELS[modelKey] || MODELS[DEFAULT_MODEL];
  console.log(`🤖 Using model: ${modelKey} (${modelConfig.provider})`);
  if (modelConfig.provider === 'google-direct') {
    return await callGeminiDirect(messages, modelConfig.model, modelConfig.apiVersion);
  }
  return await callAIGateway(messages, modelConfig.model);
}

async function generateSummary(recentMessages, oldSummary, modelKey) {
  try {
    const summaryPrompt = oldSummary 
      ? `Actualiza: ${oldSummary}\n\nNuevos: ${recentMessages.slice(-10).map(m => `${m.role}: ${typeof m.content === 'string' ? m.content : '[imagen]'}`).join('\n')}`
      : `Resumen: ${recentMessages.map(m => `${m.role}: ${typeof m.content === 'string' ? m.content : '[imagen]'}`).join('\n')}`;
    return await callAI([{ role: 'user', content: summaryPrompt }], modelKey);
  } catch (error) {
    console.error('Error generating summary:', error);
    return null;
  }
}

export default async function handler(req, res) {
  console.log('📥 Webhook received:', req.method);
  
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { Body, From, To, NumMedia, MediaUrl0 } = req.body;
    const userId = From;
    const userMessage = Body ? Body.trim().toLowerCase() : '';
    const hasImage = NumMedia && parseInt(NumMedia) > 0;

    console.log('📱 From:', userId);
    console.log('💬 Message:', userMessage || '[empty]');

    if (userMessage.startsWith('/modelo ')) {
      const modelName = userMessage.replace('/modelo ', '').trim();
      if (MODELS[modelName]) {
        await setUserModel(userId, modelName);
        const cfg = MODELS[modelName];
        await twilioClient.messages.create({
          body: `✅ ${modelName}\n${cfg.provider === 'google-direct' ? '💰 GRATIS' : '💳 Pagado'}\n${cfg.vision ? '👁️' : '❌'} Vision`,
          from: To, to: From
        });
      } else {
        await twilioClient.messages.create({
          body: `❌ Modelo inválido\nDisponibles: ${Object.keys(MODELS).join(', ')}`,
          from: To, to: From
        });
      }
      return res.status(200).json({ success: true });
    }

    if (userMessage === '/reset') {
      await resetAllMemory(userId);
      await twilioClient.messages.create({ body: '🔄 Memoria reiniciada', from: To, to: From });
      return res.status(200).json({ success: true });
    }

    if (userMessage === '/help' || userMessage === '/modelos') {
      const helpText = userMessage === '/help'
        ? `🤖 Bot Multi-Modelo\n\n/modelo [nombre]\n/modelos\n/reset\n/help`
        : `🧠 Modelos:\n💰 gemini, gemini-pro, gemini2\n💳 opus, sonnet, gpt5, gemini25, sonar, deepseek, grok, kimi`;
      await twilioClient.messages.create({ body: helpText, from: To, to: From });
      return res.status(200).json({ success: true });
    }

    if (!userMessage && !hasImage) return res.status(200).send('OK');

    const currentModel = await getUserModel(userId);
    const modelConfig = MODELS[currentModel];
    const longTermSummary = await getLongTermMemory(userId);
    const recentMessages = await getRecentMessages(userId);
    const messageCount = await getAndIncrementCount(userId);

    console.log(`🎯 Model: ${currentModel}`);
    console.log(`📚 History: ${recentMessages.length} messages`);

    let userContent;
    if (hasImage) {
      if (!modelConfig.vision) {
        await twilioClient.messages.create({
          body: `❌ ${currentModel} no soporta imágenes`,
          from: To, to: From
        });
        return res.status(200).json({ success: true });
      }
      const imageData = await downloadImageAsBase64(
        MediaUrl0,
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      userContent = [
        { type: 'image_url', image_url: { url: `data:${imageData.mimeType};base64,${imageData.base64}` } },
        { type: 'text', text: userMessage || '¿Qué hay en esta imagen?' }
      ];
    } else {
      userContent = userMessage;
    }

    recentMessages.push({ role: 'user', content: userContent });
    let messagesToAI = [...recentMessages];
    if (longTermSummary) {
      messagesToAI = [
        { role: 'user', content: `[CONTEXTO]\n${longTermSummary}` },
        { role: 'assistant', content: 'Ok' },
        ...recentMessages
      ];
    }

    console.log('🤖 Calling AI...');
    const responseText = await callAI(messagesToAI, currentModel);
    console.log('✅ Response received:', responseText.substring(0, 50) + '...');

    recentMessages.push({ role: 'assistant', content: responseText });
    await saveRecentMessages(userId, recentMessages);

    const newCount = messageCount + 1;
    if (newCount >= SUMMARIZE_THRESHOLD && newCount % SUMMARIZE_THRESHOLD === 0) {
      console.log('📝 Generating summary...');
      const newSummary = await generateSummary(recentMessages, longTermSummary, currentModel);
      if (newSummary) {
        await saveLongTermMemory(userId, newSummary);
      }
    }

    await saveLog(userId, userContent, responseText, currentModel, 'success');
    await twilioClient.messages.create({ body: responseText, from: To, to: From });
    
    console.log('✅ Done!');
    return res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
    
    try {
      await saveLog(req.body?.From || 'unknown', req.body?.Body || '[error]', error.message, 'error', 'error');
      if (req.body?.From && req.body?.To) {
        await twilioClient.messages.create({
          body: `Error: ${error.message}\n\nIntenta /help`,
          from: req.body.To,
          to: req.body.From
        });
      }
    } catch (e) {
      console.error('Error sending error message:', e);
    }
    
    return res.status(500).json({ error: error.message, stack: error.stack });
  }
}