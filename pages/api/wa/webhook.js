/**
 * WhatsApp Webhook - Pixan Bot
 * Clean, simplified handler using service architecture
 */

import { MODELS, DEFAULT_MODEL, getHelpText, getModelInfo } from '../../../lib/wa/config.js';
import { sendMessage, downloadMedia } from '../../../lib/wa/twilio.js';
import { chat, supportsVision } from '../../../lib/wa/ai.js';
import { getUserModel, setUserModel, clearMemory, addToMemory, buildMessages } from '../../../lib/wa/memory.js';
import { saveLog } from '../../../lib/wa/logger.js';

// Parse incoming WhatsApp message
const parseMessage = (body) => ({
  userId: body.From,
  text: body.Body?.trim() || '',
  textLower: body.Body?.trim().toLowerCase() || '',
  hasMedia: parseInt(body.NumMedia || 0) > 0,
  mediaUrl: body.MediaUrl0,
  mediaType: body.MediaContentType0
});

// Command handlers
const commands = {
  async modelo(userId, args) {
    const modelId = args.toLowerCase();
    
    if (!MODELS[modelId]) {
      const available = Object.keys(MODELS).join(', ');
      return `❌ Modelo "${modelId}" no existe.\n\nDisponibles: ${available}`;
    }
    
    await setUserModel(userId, modelId);
    const model = MODELS[modelId];
    const cost = model.free ? '💰 GRATIS' : '💳 Premium';
    const vision = model.vision ? '📷 Con visión' : '📝 Solo texto';
    
    return `✅ Modelo cambiado a *${modelId}*\n${cost}\n${vision}`;
  },
  
  async ayuda(userId) {
    const currentModel = await getUserModel(userId);
    return getHelpText(currentModel);
  },
  
  async help(userId) {
    return commands.ayuda(userId);
  },
  
  async reset(userId) {
    await clearMemory(userId);
    return '🧹 Memoria borrada. Empezamos de nuevo.';
  }
};

// Process image if present
const processImage = async (msg, modelId) => {
  if (!msg.hasMedia || !msg.mediaUrl) return null;
  
  if (!supportsVision(modelId)) {
    return {
      error: `⚠️ El modelo *${modelId}* no soporta imágenes.\n\nUsa: /modelo gemini`
    };
  }
  
  const media = await downloadMedia(msg.mediaUrl);
  return {
    content: [
      { type: 'text', text: msg.text || '¿Qué ves en esta imagen?' },
      { type: 'image_url', image_url: { url: `data:${media.mimeType};base64,${media.base64}` } }
    ],
    logText: msg.text ? `${msg.text} [imagen]` : '[imagen]'
  };
};

// Main handler
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const msg = parseMessage(req.body);
  
  // Skip empty messages
  if (!msg.text && !msg.hasMedia) {
    return res.status(200).json({ ok: true });
  }

  try {
    // Check for commands
    if (msg.textLower.startsWith('/')) {
      const [cmd, ...argParts] = msg.textLower.slice(1).split(' ');
      const args = argParts.join(' ');
      
      // Handle /modelo and /model
      const cmdName = cmd === 'model' ? 'modelo' : cmd;
      
      if (commands[cmdName]) {
        const response = await commands[cmdName](msg.userId, args);
        await sendMessage(msg.userId, response);
        return res.status(200).json({ ok: true, command: cmdName });
      }
    }

    // Get user's model
    const modelId = await getUserModel(msg.userId);
    
    // Process image if present
    let userContent = msg.text;
    let logMessage = msg.text;
    
    if (msg.hasMedia) {
      const imageResult = await processImage(msg, modelId);
      
      if (imageResult?.error) {
        await sendMessage(msg.userId, imageResult.error);
        return res.status(200).json({ ok: true, error: 'vision_unsupported' });
      }
      
      if (imageResult) {
        userContent = imageResult.content;
        logMessage = imageResult.logText;
      }
    }

    // Build conversation messages
    const messages = await buildMessages(msg.userId, userContent, modelId);
    
    // Call AI
    let response;
    let status = 'success';
    
    try {
      response = await chat(messages, modelId);
    } catch (error) {
      console.error('AI Error:', error.message);
      status = error.message.includes('429') ? 'rate_limit' : 'error';
      
      response = status === 'rate_limit'
        ? '⏳ *Demasiadas peticiones*\n\nIntenta en 1 minuto o usa `/modelo opus` para premium.'
        : `❌ Error: ${error.message}\n\nIntenta /ayuda`;
    }

    // Send response
    await sendMessage(msg.userId, response);
    
    // Save to memory (only on success)
    if (status === 'success') {
      await addToMemory(msg.userId, logMessage, response);
    }
    
    // Log conversation
    await saveLog({
      userId: msg.userId,
      message: logMessage,
      response: response.substring(0, 500),
      model: modelId,
      status
    });

    return res.status(200).json({ ok: true, model: modelId, status });

  } catch (error) {
    console.error('Webhook Error:', error);
    
    try {
      await sendMessage(msg.userId, '❌ Error interno. Intenta de nuevo.');
    } catch {}
    
    return res.status(500).json({ error: error.message });
  }
}
