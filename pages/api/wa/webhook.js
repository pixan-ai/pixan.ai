/**
 * WhatsApp Webhook - Pixan Bot
 * With Gemini File Search integration and model alerts
 */

import { MODELS, DEFAULT_MODEL, getHelpText, getModelInfo, getModelAlert } from '../../../lib/wa/config.js';
import { sendMessage, downloadMedia } from '../../../lib/wa/twilio.js';
import { chat, supportsVision } from '../../../lib/wa/ai.js';
import { getUserModel, setUserModel, clearMemory, addToMemory, buildMessages } from '../../../lib/wa/memory.js';
import { saveLog, logTechnical } from '../../../lib/wa/logger.js';
import { needsKnowledgeBase, queryKnowledgeBase, listDocuments } from '../../../lib/wa/file-search.js';

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
    const vision = model.vision ? '✅ Analiza imágenes' : '❌ Sin imágenes';
    const knowledge = model.knowledgeBase ? '✅ Base de conocimiento' : '❌ Sin base conocimiento';
    
    let response = `✅ Modelo cambiado a *${model.name}*\n${cost}\n${vision}\n${knowledge}`;
    
    // Add alert if model has limitations
    const alert = getModelAlert(modelId);
    if (alert) {
      response += `\n\n${alert}`;
    }
    
    return response;
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
  },
  
  async docs(userId) {
    try {
      const documents = await listDocuments();
      
      if (documents.length === 0) {
        return '📚 *Base de Conocimiento Pixan*\n\nNo hay documentos cargados aún.\n\nLos administradores pueden subir documentos en:\npixan.ai/wa/admin/docs';
      }
      
      let response = '📚 *Base de Conocimiento Pixan*\n\nDocumentos disponibles:\n\n';
      documents.forEach((doc, index) => {
        response += `${index + 1}. ${doc.displayName || doc.name}\n`;
      });
      
      response += `\n_Total: ${documents.length} documentos_\n\n💡 Solo disponible con /gemini`;
      
      return response;
    } catch (error) {
      return '❌ Error consultando documentos. Intenta de nuevo.';
    }
  }
};

// Process image if present
const processImage = async (msg, modelId) => {
  if (!msg.hasMedia || !msg.mediaUrl) return null;
  
  if (!supportsVision(modelId)) {
    const model = MODELS[modelId];
    return {
      error: `❌ *No puedo analizar imágenes con ${model.name}*\n\nPara análisis de imágenes, cambia a Gemini con: /gemini`
    };
  }
  
  await logTechnical('🖼️ Descargando imagen de Twilio...');
  const media = await downloadMedia(msg.mediaUrl);
  await logTechnical(`✅ Imagen descargada: ${media.mimeType}`);
  
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
  const startTime = Date.now();
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const msg = parseMessage(req.body);
  const userShort = msg.userId?.slice(-4) || 'N/A';
  
  await logTechnical(`📥 Webhook: ${userShort} - "${msg.text?.substring(0, 30) || '[media]'}"`);
  
  // Skip empty messages
  if (!msg.text && !msg.hasMedia) {
    await logTechnical('⚠️ Mensaje vacío, ignorando');
    return res.status(200).json({ ok: true });
  }

  try {
    // Check for commands
    if (msg.textLower.startsWith('/')) {
      const [cmd, ...argParts] = msg.textLower.slice(1).split(' ');
      const args = argParts.join(' ');
      const cmdName = cmd === 'model' ? 'modelo' : cmd;
      
      if (commands[cmdName]) {
        await logTechnical(`📝 Comando: /${cmdName} ${args}`);
        const response = await commands[cmdName](msg.userId, args);
        await sendMessage(msg.userId, response);
        await logTechnical(`✅ Comando ejecutado en ${Date.now() - startTime}ms`);
        return res.status(200).json({ ok: true, command: cmdName });
      }
    }

    // Get user's model
    const modelId = await getUserModel(msg.userId);
    const modelInfo = MODELS[modelId];
    await logTechnical(`🤖 Modelo: ${modelId}`);
    
    // Check if needs knowledge base but model doesn't support it
    if (needsKnowledgeBase(msg.text) && !modelInfo.knowledgeBase) {
      const alert = `⚠️ *Esta pregunta requiere la base de conocimiento de Pixan*\n\nPero ${modelInfo.name} no puede consultarla.\n\nCambia a Gemini para obtener información sobre:\n• Comisiones\n• Productos\n• Manejo de objeciones\n• Políticas\n\nUsa: /gemini`;
      
      await sendMessage(msg.userId, alert);
      await logTechnical('⚠️ Pregunta requiere conocimiento pero modelo no lo soporta');
      return res.status(200).json({ ok: true, alert: 'knowledge_not_available' });
    }
    
    // Process image if present
    let userContent = msg.text;
    let logMessage = msg.text;
    
    if (msg.hasMedia) {
      const imageResult = await processImage(msg, modelId);
      
      if (imageResult?.error) {
        await sendMessage(msg.userId, imageResult.error);
        await logTechnical('⚠️ Modelo no soporta visión');
        return res.status(200).json({ ok: true, error: 'vision_unsupported' });
      }
      
      if (imageResult) {
        userContent = imageResult.content;
        logMessage = imageResult.logText;
      }
    }

    // Call AI with File Search if using Gemini and needs knowledge
    let response;
    let status = 'success';
    let usedKnowledge = false;
    
    try {
      // Use File Search for Gemini if message needs knowledge base
      if (modelId === 'gemini' && needsKnowledgeBase(msg.text)) {
        await logTechnical('🔍 Usando File Search para consulta de conocimiento');
        
        // Build history for File Search
        const history = await buildMessages(msg.userId, null, modelId);
        
        const knowledgeResult = await queryKnowledgeBase(msg.text, history);
        response = knowledgeResult.text;
        usedKnowledge = knowledgeResult.usedKnowledge;
        
        await logTechnical(`✅ Respuesta obtenida${usedKnowledge ? ' de base de conocimiento' : ''}`);
      } else {
        // Standard AI call
        await logTechnical('📦 Construyendo contexto de conversación...');
        const messages = await buildMessages(msg.userId, userContent, modelId);
        await logTechnical(`💬 ${messages.length} mensajes en contexto`);
        
        await logTechnical(`🧠 Llamando a ${modelId}...`);
        const aiStart = Date.now();
        response = await chat(messages, modelId);
        await logTechnical(`✅ Respuesta en ${Date.now() - aiStart}ms`);
      }
    } catch (error) {
      console.error('❌ AI Error:', error.message);
      await logTechnical(`❌ Error AI: ${error.message}`);
      
      // Determinar el tipo de error por el mensaje
      if (error.message.includes('RATE_LIMIT')) {
        status = 'rate_limit';
        response = '⏳ *Demasiadas peticiones*\n\nIntenta en 1 minuto o usa `/modelo opus` para premium.';
      } else if (error.message.includes('MODELO_NO_ENCONTRADO')) {
        status = 'model_not_found';
        response = '❌ *Error de modelo*\n\nEl modelo Gemini ha sido actualizado. Por favor envía `/reset` y vuelve a intentar.';
      } else if (error.message.includes('SAFETY_FILTER')) {
        status = 'safety_filter';
        response = '⚠️ *Contenido bloqueado*\n\nTu mensaje fue bloqueado por filtros de seguridad. Intenta reformularlo.';
      } else if (error.message.includes('REQUEST_INVALIDO')) {
        status = 'invalid_request';
        response = '❌ *Petición inválida*\n\nHubo un problema con el formato del mensaje. Intenta de nuevo.';
      } else {
        status = 'error';
        response = `❌ *Error inesperado*\n\nIntenta /reset o /ayuda`;
      }
    }

    // Send response
    await logTechnical('📤 Enviando respuesta a WhatsApp...');
    await sendMessage(msg.userId, response);
    
    // Save to memory (only on success)
    if (status === 'success') {
      await addToMemory(msg.userId, logMessage, response);
      await logTechnical('💾 Guardado en memoria');
    }
    
    // Log conversation
    await saveLog({
      userId: msg.userId,
      message: logMessage,
      response: response.substring(0, 500),
      model: modelId,
      status,
      usedKnowledge
    });

    const totalTime = Date.now() - startTime;
    await logTechnical(`✅ Completado en ${totalTime}ms`);
    
    return res.status(200).json({ ok: true, model: modelId, status, time: totalTime, usedKnowledge });

  } catch (error) {
    console.error('❌ Webhook Error:', error);
    await logTechnical(`❌ Error fatal: ${error.message}`);
    
    try {
      await sendMessage(msg.userId, '❌ Error interno. Intenta de nuevo.');
    } catch {}
    
    // Still try to log the error
    await saveLog({
      userId: msg.userId,
      message: msg.text,
      response: `Error: ${error.message}`,
      model: 'error',
      status: 'error'
    }).catch(() => {});
    
    return res.status(500).json({ error: error.message });
  }
}
