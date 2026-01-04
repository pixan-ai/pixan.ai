import twilio from 'twilio';
import { Redis } from '@upstash/redis';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const AI_GATEWAY_URL = process.env.AI_GATEWAY_URL;
const AI_GATEWAY_API_KEY = process.env.AI_GATEWAY_API_KEY;
const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const DEFAULT_MODEL = 'gemini';
const DEFAULT_SYSTEM_PROMPT = 'Eres un asistente útil, conciso y amigable de Pixan en español. Puedes ver y analizar imágenes cuando te las envíen. Responde de manera clara y directa. Si no sabes algo, admítelo.';
const MAX_MEMORY_AGE_MONTHS = 12;
const MEMORY_SUMMARY_THRESHOLD = 30;

const MODELS = {
  'opus': { provider: 'ai-gateway', model: 'anthropic/claude-opus-4.5', vision: true },
  'sonnet': { provider: 'ai-gateway', model: 'anthropic/claude-sonnet-4.5', vision: true },
  'haiku': { provider: 'ai-gateway', model: 'anthropic/claude-haiku-4-1', vision: true },
  'gpt': { provider: 'ai-gateway', model: 'openai/gpt-4.5-mini', vision: true },
  'gemini': { provider: 'google-direct', model: 'gemini-3-flash-preview', vision: true, apiVersion: 'v1beta' },
  'gemini-flash': { provider: 'google-direct', model: 'gemini-2.5-flash', vision: true, apiVersion: 'v1beta' },
  'gemini-thinking': { provider: 'google-direct', model: 'gemini-2.0-flash-thinking-exp-1219', vision: false, apiVersion: 'v1beta' },
  'grok': { provider: 'ai-gateway', model: 'xai/grok-4-1-fast-reasoning', vision: false },
  'deepseek': { provider: 'ai-gateway', model: 'deepseek/deepseek-v3.2-exp-thinking', vision: false },
  'mistral': { provider: 'ai-gateway', model: 'mistral/mistral-large-2', vision: false },
  'llama': { provider: 'ai-gateway', model: 'meta-llama/llama-4-scout-preview', vision: false }
};

const HELP_TEXT = `📱 *Comandos WhatsApp Bot*\n\n*Modelos disponibles:*\n${Object.keys(MODELS).map(m => `• /${m}`).join('\n')}\n\n*Otros comandos:*\n• /ayuda - Ver esta ayuda\n• /reset - Borrar memoria\n\nModelo actual: *${DEFAULT_MODEL}*`;

let commandCounter = 0;
const upstashCommand = async (...args) => {
  commandCounter++;
  const today = new Date().toISOString().split('T')[0];
  try {
    await redis.incr(`upstash:commands:${today}`);
  } catch (err) {
    console.error('Error tracking Upstash command:', err);
  }
  return await redis[args[0]](...args.slice(1));
};

// ✅ CARGAR SYSTEM PROMPT DESDE REDIS
const getSystemPrompt = async () => {
  try {
    const customPrompt = await redis.get('system:prompt');
    return customPrompt || DEFAULT_SYSTEM_PROMPT;
  } catch (error) {
    console.error('Error getting system prompt:', error);
    return DEFAULT_SYSTEM_PROMPT;
  }
};

const getUserModel = async (userId) => {
  try {
    return await upstashCommand('get', `model:${userId}`) || DEFAULT_MODEL;
  } catch (error) {
    console.error('Error getting user model:', error);
    return DEFAULT_MODEL;
  }
};

const setUserModel = async (userId, model) => {
  try {
    await upstashCommand('set', `model:${userId}`, model);
  } catch (error) {
    console.error('Error setting user model:', error);
  }
};

const getMemory = async (userId) => {
  try {
    const memory = await upstashCommand('get', `memory:${userId}`);
    if (!memory) return [];
    const parsed = JSON.parse(memory);
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - MAX_MEMORY_AGE_MONTHS);
    return parsed.filter(m => new Date(m.timestamp) >= cutoffDate);
  } catch (error) {
    console.error('Error getting memory:', error);
    return [];
  }
};

const addToMemory = async (userId, userMsg, assistantMsg) => {
  try {
    const memory = await getMemory(userId);
    memory.push({ timestamp: new Date().toISOString(), user: userMsg, assistant: assistantMsg });
    if (memory.length > 100) memory.splice(0, memory.length - 100);
    await upstashCommand('set', `memory:${userId}`, JSON.stringify(memory));
  } catch (error) {
    console.error('Error adding to memory:', error);
  }
};

const clearMemory = async (userId) => {
  try {
    await upstashCommand('del', `memory:${userId}`);
    await upstashCommand('del', `summary:${userId}`);
  } catch (error) {
    console.error('Error clearing memory:', error);
  }
};

const saveConversationLog = async (from, message, response, model, status = 'success') => {
  try {
    const log = {
      id: `${Date.now()}-${from}`,
      timestamp: new Date().toISOString(),
      from,
      message,
      response,
      model,
      status
    };
    await upstashCommand('lpush', 'logs:messages', JSON.stringify(log));
    await upstashCommand('ltrim', 'logs:messages', 0, 99);
  } catch (error) {
    console.error('Error saving log:', error);
  }
};

// ✅ FUNCIÓN PARA DESCARGAR IMAGEN CON AUTENTICACIÓN TWILIO
async function downloadImageFromTwilio(imageUrl) {
  console.log('🖼️ Downloading image with Twilio auth from:', imageUrl);
  
  try {
    const response = await fetch(imageUrl, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')
      }
    });
    
    if (!response.ok) {
      console.error('❌ Image download failed:', response.status, response.statusText);
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    console.log(`✅ Image downloaded: ${contentType}, size: ${Math.round(base64.length/1024)}KB`);
    
    return {
      base64,
      mimeType: contentType
    };
  } catch (error) {
    console.error('❌ Error downloading image:', error);
    throw error;
  }
}

const convertToGeminiFormat = (messages) => {
  return messages.map(msg => {
    if (msg.role === 'system') {
      return { role: 'user', parts: [{ text: `[SYSTEM] ${msg.content}` }] };
    }
    if (Array.isArray(msg.content)) {
      const parts = msg.content.map(item => {
        if (item.type === 'text') return { text: item.text };
        if (item.type === 'image_url') {
          const base64Match = item.image_url.url.match(/^data:image\/([\w+]+);base64,(.+)$/);
          if (base64Match) {
            return { inline_data: { mime_type: `image/${base64Match[1]}`, data: base64Match[2] } };
          }
        }
        return null;
      }).filter(Boolean);
      return { role: msg.role === 'assistant' ? 'model' : 'user', parts };
    }
    return { role: msg.role === 'assistant' ? 'model' : 'user', parts: [{ text: msg.content }] };
  });
};

async function callGeminiDirect(messages, modelName, apiVersion = 'v1beta') {
  const geminiMessages = convertToGeminiFormat(messages);
  
  console.log('🔍 Gemini messages:', JSON.stringify(geminiMessages, null, 2));
  
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
    const error = await response.text();
    console.error('❌ Gemini API error:', error);
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  console.log('📦 Gemini response:', JSON.stringify(data, null, 2));
  
  // Track Gemini usage
  const today = new Date().toISOString().split('T')[0];
  try {
    await redis.incr(`gemini:usage:${today}`);
  } catch (err) {
    console.error('Error tracking Gemini usage:', err);
  }
  
  if (!data.candidates?.[0]?.content) throw new Error('Invalid Gemini response');
  const candidate = data.candidates[0];
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
    body: JSON.stringify({ model: modelString, messages, max_tokens: 1024, temperature: 0.7 }),
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
    // Log completo del body para debug
    console.log('📦 Full webhook body:', JSON.stringify(req.body, null, 2));
    
    const { Body, From, To, NumMedia, MediaUrl0, MediaContentType0 } = req.body;
    const userId = From;
    const userMessage = Body ? Body.trim() : '';
    const userMessageLower = userMessage.toLowerCase();
    const hasImage = NumMedia && parseInt(NumMedia) > 0;

    console.log('📱 From:', userId);
    console.log('💬 Message:', userMessage || '[empty]');
    console.log('🔢 NumMedia:', NumMedia);
    console.log('🖼️ Has image:', hasImage);
    if (hasImage) {
      console.log('🌐 MediaUrl0:', MediaUrl0);
      console.log('📄 MediaContentType0:', MediaContentType0);
    }

    // Commands
    if (userMessageLower.startsWith('/modelo ') || userMessageLower.startsWith('/model ')) {
      const modelName = userMessageLower.replace(/^\/mode[lo]\s+/, '').trim();
      if (MODELS[modelName]) {
        await setUserModel(userId, modelName);
        const cfg = MODELS[modelName];
        await twilioClient.messages.create({
          body: `✅ Modelo cambiado a *${modelName}*\n${cfg.provider === 'google-direct' ? '💰 GRATIS' : '💳 Pagado'}\n${cfg.vision ? '📷 Con visión' : '📝 Solo texto'}`,
          from: TWILIO_WHATSAPP_NUMBER,
          to: userId
        });
      } else {
        await twilioClient.messages.create({
          body: `❌ Modelo "${modelName}" no existe.\n\nDisponibles: ${Object.keys(MODELS).join(', ')}`,
          from: TWILIO_WHATSAPP_NUMBER,
          to: userId
        });
      }
      return res.status(200).json({ success: true });
    }

    if (userMessageLower === '/ayuda' || userMessageLower === '/help') {
      await twilioClient.messages.create({
        body: HELP_TEXT,
        from: TWILIO_WHATSAPP_NUMBER,
        to: userId
      });
      return res.status(200).json({ success: true });
    }

    if (userMessageLower === '/reset') {
      await clearMemory(userId);
      await twilioClient.messages.create({
        body: '🧹 Memoria borrada. Empezamos de nuevo.',
        from: TWILIO_WHATSAPP_NUMBER,
        to: userId
      });
      return res.status(200).json({ success: true });
    }

    // ✅ CARGAR SYSTEM PROMPT DESDE REDIS
    const systemPrompt = await getSystemPrompt();
    console.log('📋 System Prompt loaded from Redis:', systemPrompt.substring(0, 50) + '...');

    // Main conversation flow
    const selectedModel = await getUserModel(userId);
    const memory = await getMemory(userId);
    const messages = [{ role: 'system', content: systemPrompt }];

    if (memory.length >= MEMORY_SUMMARY_THRESHOLD) {
      const summaryKey = `summary:${userId}`;
      let summary = await upstashCommand('get', summaryKey);
      if (!summary) {
        summary = await generateSummary(memory.map(m => [{ role: 'user', content: m.user }, { role: 'assistant', content: m.assistant }]).flat(), null, selectedModel);
        if (summary) await upstashCommand('set', summaryKey, summary);
      }
      if (summary) messages.push({ role: 'system', content: `Resumen de conversación previa: ${summary}` });
      memory.slice(-10).forEach(m => {
        messages.push({ role: 'user', content: m.user });
        messages.push({ role: 'assistant', content: m.assistant });
      });
    } else {
      memory.forEach(m => {
        messages.push({ role: 'user', content: m.user });
        messages.push({ role: 'assistant', content: m.assistant });
      });
    }

    let userContent = userMessage;
    let logMessage = userMessage;
    
    // ✅ PROCESAR IMAGEN CON AUTENTICACIÓN TWILIO
    if (hasImage && MediaUrl0) {
      const modelConfig = MODELS[selectedModel] || MODELS[DEFAULT_MODEL];
      if (modelConfig.vision) {
        try {
          // ✅ USAR FUNCIÓN CON AUTENTICACIÓN
          const imageData = await downloadImageFromTwilio(MediaUrl0);
          
          userContent = [
            { type: 'text', text: userMessage || '¿Qué ves en esta imagen?' },
            { type: 'image_url', image_url: { url: `data:${imageData.mimeType};base64,${imageData.base64}` } }
          ];
          
          logMessage = userMessage ? `${userMessage} [con imagen]` : '[imagen]';
          console.log('✅ Image content array created successfully');
        } catch (imageError) {
          console.error('❌ Error processing image:', imageError);
          await twilioClient.messages.create({
            body: `❌ Error al procesar la imagen: ${imageError.message}\n\nIntenta enviarla de nuevo.`,
            from: TWILIO_WHATSAPP_NUMBER,
            to: userId
          });
          return res.status(200).json({ success: false, error: 'Image processing failed' });
        }
      } else {
        await twilioClient.messages.create({
          body: `⚠️ El modelo *${selectedModel}* no soporta imágenes. Usa: /modelo gemini`,
          from: TWILIO_WHATSAPP_NUMBER,
          to: userId
        });
        return res.status(200).json({ success: true });
      }
    }

    messages.push({ role: 'user', content: userContent });

    let aiResponse;
    let finalStatus = 'success';
    let errorMessage = null;

    try {
      aiResponse = await callAI(messages, selectedModel);
    } catch (error) {
      console.error('❌ AI Error:', error.message);
      
      // Detectar error 429 de rate limit en Gemini
      if (error.message.includes('429')) {
        errorMessage = '⏳ *Estoy muy ocupado ahora mismo*\n\nDemasiadas peticiones. Por favor intenta de nuevo en 1 minuto.\n\n💡 Tip: Usa `/modelo opus` o `/modelo sonnet` para modelos premium sin límites.';
        finalStatus = 'rate_limit';
      } else {
        errorMessage = `❌ Error del modelo ${selectedModel}: ${error.message}\n\n💡 Intenta con otro modelo: /ayuda`;
        finalStatus = 'error';
      }
      
      aiResponse = errorMessage;
    }

    await twilioClient.messages.create({
      body: aiResponse,
      from: TWILIO_WHATSAPP_NUMBER,
      to: userId
    });

    // Solo guardar en memoria si NO hubo error
    if (finalStatus === 'success') {
      await addToMemory(userId, logMessage, aiResponse);
    }
    
    await saveConversationLog(userId, logMessage, aiResponse, selectedModel, finalStatus);

    console.log('✅ Response sent');
    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    try {
      await twilioClient.messages.create({
        body: '❌ Error interno del servidor. Por favor intenta de nuevo.',
        from: TWILIO_WHATSAPP_NUMBER,
        to: req.body.From
      });
    } catch (twilioError) {
      console.error('❌ Error sending error message:', twilioError);
    }
    return res.status(500).json({ error: error.message });
  }
}