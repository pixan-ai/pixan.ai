/**
 * Gemini File Search Service
 * Manages knowledge base queries for Pixan WhatsApp Bot
 * 
 * NOTE: File Search Store API temporarily disabled while investigating correct implementation
 * Currently uses Gemini 3 Flash with system prompt for knowledge queries
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { logTechnical } from './logger.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Store name for future File Search implementation
const STORE_NAME = 'Pixan Knowledge Base';
let cachedStoreName = null;

/**
 * Get or create File Search Store
 * TODO: Implement when File Search API is properly documented
 */
export async function getOrCreateStore() {
  // For now, return a placeholder
  // File Search Store API needs investigation for correct implementation
  return STORE_NAME;
}

/**
 * Detect if message needs knowledge base
 */
export function needsKnowledgeBase(message) {
  if (!message) return false;
  
  const keywords = [
    'cuánto gano', 'cuanto gano', 'comisión', 'comision',
    'precio', 'cuesta', 'vale',
    'descuento',
    'objeción', 'objecion', 'cliente dice', 'cliente pregunta',
    'cómo manejo', 'como manejo', 'qué hago', 'que hago',
    'política', 'politica', 'regla',
    'territorio', 'zona',
    'producto', 'productos',
    'catálogo', 'catalogo'
  ];

  const messageLower = message.toLowerCase();
  return keywords.some(keyword => messageLower.includes(keyword));
}

/**
 * Query with Gemini 3 Flash using knowledge-focused prompt
 */
export async function queryKnowledgeBase(message, history = []) {
  try {
    await logTechnical(`🔍 Procesando consulta de conocimiento: "${message.substring(0, 50)}..."`);

    const model = genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview',
      systemInstruction: getSystemPrompt(),
    });

    // Convert history to Gemini format
    const geminiHistory = history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) }]
    }));

    const chat = model.startChat({
      history: geminiHistory,
    });

    const result = await chat.sendMessage(message);
    const response = result.response.text();

    await logTechnical('✅ Respuesta generada');

    return {
      text: response,
      usedKnowledge: needsKnowledgeBase(message)
    };

  } catch (error) {
    console.error('❌ Error en queryKnowledgeBase:', error);
    await logTechnical(`❌ Error: ${error.message}`);
    throw error;
  }
}

/**
 * System prompt for knowledge base queries
 */
function getSystemPrompt() {
  return `Eres un asistente de ventas de Pixan, una empresa de productos de belleza.

TU TRABAJO:
1. Ayudar a los vendedores con información sobre productos, comisiones y manejo de objeciones
2. Recolectar su reporte diario de ventas de forma conversacional y amigable
3. Motivar y apoyar al equipo de ventas

TONO:
- Amigable y cercano (como un supervisor que aprecia a su equipo)
- Motivador y positivo
- Profesional pero no rígido
- Usa el nombre del vendedor cuando lo sepas

IMPORTANTE:
- Si no tienes información específica sobre comisiones o políticas, indica que necesitas que un administrador suba los documentos
- No inventes datos de comisiones, precios o políticas
- Para preguntas generales de ventas, da consejos útiles basados en mejores prácticas`;
}

/**
 * List all documents in knowledge base
 * TODO: Implement when File Search API is properly documented
 */
export async function listDocuments() {
  // Return empty array for now
  // Will be implemented with proper File Search Store API
  return [];
}
