/**
 * Memory Service
 * User conversation memory with 12-month retention
 */

import { db } from './redis.js';
import { chat } from './ai.js';
import { MEMORY, DEFAULT_SYSTEM_PROMPT } from './config.js';

const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;

// Keys
const keys = {
  memory: (userId) => `memory:${userId}`,
  summary: (userId) => `summary:${userId}`,
  model: (userId) => `model:${userId}`,
  systemPrompt: 'system:prompt'
};

// Get user's selected model
export const getUserModel = async (userId) => {
  const model = await db.get(keys.model(userId));
  return model || 'gemini';
};

// Set user's model
export const setUserModel = async (userId, model) => {
  await db.set(keys.model(userId), model, { ex: SECONDS_PER_YEAR });
};

// Get system prompt (from Redis or default)
export const getSystemPrompt = async () => {
  const prompt = await db.get(keys.systemPrompt);
  return prompt || DEFAULT_SYSTEM_PROMPT;
};

// Get conversation memory
export const getMemory = async (userId) => {
  try {
    const data = await db.get(keys.memory(userId));
    if (!data) return [];
    
    const memory = JSON.parse(data);
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - MEMORY.expirationMonths);
    
    return memory.filter(m => new Date(m.timestamp) >= cutoff);
  } catch {
    return [];
  }
};

// Add to memory
export const addToMemory = async (userId, userMsg, assistantMsg) => {
  const memory = await getMemory(userId);
  
  memory.push({
    timestamp: new Date().toISOString(),
    user: userMsg,
    assistant: assistantMsg
  });
  
  // Keep only last N messages
  if (memory.length > MEMORY.maxMessages) {
    memory.splice(0, memory.length - MEMORY.maxMessages);
  }
  
  await db.set(keys.memory(userId), JSON.stringify(memory), { ex: SECONDS_PER_YEAR });
};

// Clear all user memory
export const clearMemory = async (userId) => {
  await Promise.all([
    db.del(keys.memory(userId)),
    db.del(keys.summary(userId))
  ]);
};

// Get conversation summary (generates if needed)
export const getSummary = async (userId, modelId) => {
  const memory = await getMemory(userId);
  
  if (memory.length < MEMORY.summaryThreshold) {
    return null;
  }
  
  // Check if summary exists
  let summary = await db.get(keys.summary(userId));
  
  if (!summary) {
    // Generate summary
    const messages = memory.map(m => 
      `Usuario: ${m.user}\nAsistente: ${m.assistant}`
    ).join('\n\n');
    
    try {
      summary = await chat(
        [{ role: 'user', content: `Resume esta conversación en máximo 200 palabras, destacando temas importantes y preferencias del usuario:\n\n${messages}` }],
        modelId
      );
      await db.set(keys.summary(userId), summary, { ex: SECONDS_PER_YEAR });
    } catch {
      return null;
    }
  }
  
  return summary;
};

// Build messages array for AI call
export const buildMessages = async (userId, userContent, modelId) => {
  const [systemPrompt, memory, summary] = await Promise.all([
    getSystemPrompt(),
    getMemory(userId),
    getSummary(userId, modelId)
  ]);
  
  const messages = [{ role: 'system', content: systemPrompt }];
  
  // Add summary if exists
  if (summary) {
    messages.push({
      role: 'system',
      content: `Contexto de conversaciones anteriores: ${summary}`
    });
  }
  
  // Add recent memory (last N messages)
  const recentMemory = memory.slice(-MEMORY.recentLimit);
  recentMemory.forEach(m => {
    messages.push({ role: 'user', content: m.user });
    messages.push({ role: 'assistant', content: m.assistant });
  });
  
  // Add current message
  messages.push({ role: 'user', content: userContent });
  
  return messages;
};
