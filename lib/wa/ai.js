/**
 * AI Service
 * Unified interface for Gemini and AI Gateway
 */

import { getModelInfo, LIMITS } from './config.js';
import { db } from './redis.js';

// AI Gateway URL - same as genAI.js uses
const AI_GATEWAY_URL = 'https://ai-gateway.vercel.sh/v1/chat/completions';

// Get env vars at runtime
const getEnv = () => ({
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY
});

// Convert messages to Gemini format
const toGeminiFormat = (messages) => {
  return messages.map(msg => {
    if (msg.role === 'system') {
      return { role: 'user', parts: [{ text: `[INSTRUCCIONES] ${msg.content}` }] };
    }
    
    if (Array.isArray(msg.content)) {
      const parts = msg.content.map(item => {
        if (item.type === 'text') return { text: item.text };
        if (item.type === 'image_url') {
          const match = item.image_url.url.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            return { inline_data: { mime_type: match[1], data: match[2] } };
          }
        }
        return null;
      }).filter(Boolean);
      return { role: msg.role === 'assistant' ? 'model' : 'user', parts };
    }
    
    return {
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    };
  });
};

// Call Gemini API directly (FREE)
const callGemini = async (messages, modelConfig) => {
  const { GEMINI_API_KEY } = getEnv();
  const { model, apiVersion } = modelConfig;
  const geminiMessages = toGeminiFormat(messages);
  
  console.log('🔍 Calling Gemini:', model);
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: geminiMessages,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: LIMITS.maxTokens,
          topP: 0.95,
          topK: 40
        },
        // Filtros de seguridad más permisivos para contexto empresarial
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }  // Permitir temas sensibles como denuncias
        ]
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Gemini HTTP Error:', response.status, errorText);
    
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      throw new Error(`Gemini HTTP ${response.status}: ${errorText}`);
    }
    
    // Errores específicos de Gemini
    const errorMsg = errorData?.error?.message || errorText;
    
    // 404 = Modelo no existe
    if (response.status === 404) {
      throw new Error(`MODELO_NO_ENCONTRADO: ${errorMsg}`);
    }
    
    // 429 = Rate limit
    if (response.status === 429) {
      throw new Error(`RATE_LIMIT: ${errorMsg}`);
    }
    
    // 400 = Bad request (puede ser safety, formato, etc)
    if (response.status === 400) {
      // Detectar si es un bloqueo de seguridad en el error 400
      if (errorMsg.toLowerCase().includes('safety') || errorMsg.toLowerCase().includes('blocked')) {
        throw new Error(`SAFETY_FILTER: ${errorMsg}`);
      }
      throw new Error(`REQUEST_INVALIDO: ${errorMsg}`);
    }
    
    // Error genérico
    throw new Error(`Gemini error ${response.status}: ${errorMsg}`);
  }

  const data = await response.json();
  
  // Log completo para debugging
  console.log('📊 Gemini response structure:', JSON.stringify({
    hasCandidates: !!data.candidates,
    candidatesLength: data.candidates?.length,
    finishReason: data.candidates?.[0]?.finishReason,
    hasContent: !!data.candidates?.[0]?.content,
    promptFeedback: data.promptFeedback,
    blockReason: data.promptFeedback?.blockReason
  }));
  
  // Track usage
  const today = new Date().toISOString().split('T')[0];
  await db.incr(`gemini:usage:${today}`).catch(() => {});
  
  // Verificar si el PROMPT fue bloqueado (antes de generar)
  if (data.promptFeedback?.blockReason) {
    const reason = data.promptFeedback.blockReason;
    console.error('❌ Prompt bloqueado:', reason);
    throw new Error(`SAFETY_FILTER: Tu mensaje fue bloqueado (${reason}). Intenta reformularlo.`);
  }
  
  // Verificar si hay candidatos
  if (!data.candidates || data.candidates.length === 0) {
    console.error('❌ Sin candidatos en respuesta:', JSON.stringify(data));
    throw new Error('RESPUESTA_VACIA: Gemini no generó ninguna respuesta. Intenta reformular tu mensaje.');
  }
  
  // Verificar el finishReason ANTES de verificar el contenido
  const finishReason = data.candidates[0].finishReason;
  
  if (finishReason === 'SAFETY') {
    const safetyRatings = data.candidates[0].safetyRatings || [];
    const blockedCategories = safetyRatings
      .filter(r => r.probability === 'HIGH' || r.blocked)
      .map(r => r.category)
      .join(', ');
    console.error('❌ Respuesta bloqueada por seguridad:', blockedCategories);
    throw new Error(`SAFETY_FILTER: Contenido bloqueado por filtros de seguridad (${blockedCategories || 'razón no especificada'})`);
  }
  
  if (finishReason === 'RECITATION') {
    throw new Error('RECITATION: El contenido fue bloqueado por posible violación de copyright.');
  }
  
  if (finishReason === 'OTHER') {
    throw new Error('RESPUESTA_INCOMPLETA: La respuesta fue interrumpida. Intenta de nuevo.');
  }
  
  // Ahora sí verificar el contenido
  if (!data.candidates[0]?.content?.parts?.[0]?.text) {
    console.error('❌ Respuesta sin contenido:', JSON.stringify(data.candidates[0]));
    throw new Error('RESPUESTA_INVALIDA: No hay contenido en la respuesta');
  }
  
  console.log('✅ Gemini response received');
  return data.candidates[0].content.parts[0].text;
};

// Call AI Gateway (PAID) - same endpoint as genAI.js
const callGateway = async (messages, modelConfig) => {
  const { AI_GATEWAY_API_KEY } = getEnv();
  
  if (!AI_GATEWAY_API_KEY) {
    throw new Error('AI_GATEWAY_API_KEY not configured');
  }
  
  console.log('🔍 Calling AI Gateway:', modelConfig.model);
  console.log('🌐 URL:', AI_GATEWAY_URL);
  
  const response = await fetch(AI_GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AI_GATEWAY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelConfig.model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      max_tokens: LIMITS.maxTokens,
      temperature: 0.7
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('❌ AI Gateway error:', response.status, error);
    
    if (response.status === 429) {
      throw new Error('RATE_LIMIT: Demasiadas peticiones a AI Gateway');
    }
    
    throw new Error(`AI Gateway error ${response.status}: ${error}`);
  }
  
  const data = await response.json();
  console.log('✅ AI Gateway response received');
  
  if (!data.choices?.[0]?.message?.content) {
    console.error('❌ Invalid AI Gateway response:', JSON.stringify(data));
    throw new Error('RESPUESTA_INVALIDA: Estructura de respuesta incorrecta');
  }
  
  return data.choices[0].message.content;
};

// Main AI call function
export const chat = async (messages, modelId) => {
  const modelConfig = getModelInfo(modelId);
  
  console.log(`🤖 Using model: ${modelId} (${modelConfig.provider})`);
  
  if (modelConfig.provider === 'google-direct') {
    return callGemini(messages, modelConfig);
  }
  
  return callGateway(messages, modelConfig);
};

// Check if model supports vision
export const supportsVision = (modelId) => {
  return getModelInfo(modelId).vision;
};
