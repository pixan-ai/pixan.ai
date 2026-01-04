/**
 * AI Service
 * Unified interface for Gemini and AI Gateway
 */

import { getModelInfo, LIMITS } from './config.js';
import { db } from './redis.js';

// Get env vars at runtime (not module load time)
const getEnv = () => ({
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  AI_GATEWAY_URL: process.env.AI_GATEWAY_URL,
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
    console.error('❌ Gemini error:', error);
    throw new Error(`Gemini error ${response.status}: ${error}`);
  }

  const data = await response.json();
  
  // Track usage
  const today = new Date().toISOString().split('T')[0];
  await db.incr(`gemini:usage:${today}`).catch(() => {});
  
  if (!data.candidates?.[0]?.content) {
    throw new Error('Invalid Gemini response');
  }
  
  if (data.candidates[0].finishReason === 'SAFETY') {
    throw new Error('Content blocked by safety filters');
  }
  
  console.log('✅ Gemini response received');
  return data.candidates[0].content.parts[0].text;
};

// Call AI Gateway (PAID)
const callGateway = async (messages, modelConfig) => {
  const { AI_GATEWAY_URL, AI_GATEWAY_API_KEY } = getEnv();
  
  if (!AI_GATEWAY_URL) {
    throw new Error('AI_GATEWAY_URL not configured');
  }
  
  console.log('🔍 Calling AI Gateway:', modelConfig.model);
  
  const response = await fetch(AI_GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AI_GATEWAY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelConfig.model,
      messages,
      max_tokens: LIMITS.maxTokens,
      temperature: 0.7
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('❌ AI Gateway error:', error);
    throw new Error(`AI Gateway error: ${response.status}`);
  }
  
  const data = await response.json();
  console.log('✅ AI Gateway response received');
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
