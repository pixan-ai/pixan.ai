/**
 * Gemini File Search Service
 * Manages permanent knowledge base documents for Pixan WhatsApp Bot
 */

import { GoogleGenerativeAI, GoogleAIFileManager } from '@google/generative-ai';
import { logTechnical } from './logger.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

const STORE_NAME = 'Pixan Knowledge Base';
let cachedStoreName = null;

/**
 * Get or create File Search Store
 */
export async function getOrCreateStore() {
  if (cachedStoreName) return cachedStoreName;

  try {
    // List existing stores
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/fileSearchStores',
      {
        headers: { 'X-Goog-Api-Key': process.env.GEMINI_API_KEY }
      }
    );

    const data = await response.json();
    const stores = data.fileSearchStores || [];
    
    const existing = stores.find(s => s.displayName === STORE_NAME);
    
    if (existing) {
      cachedStoreName = existing.name;
      await logTechnical(`✅ File Search store encontrado: ${cachedStoreName}`);
      return cachedStoreName;
    }

    // Create new store
    const createResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/fileSearchStores',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({ displayName: STORE_NAME })
      }
    );

    const store = await createResponse.json();
    cachedStoreName = store.name;
    await logTechnical(`✅ Nuevo File Search store creado: ${cachedStoreName}`);
    
    return cachedStoreName;
  } catch (error) {
    console.error('❌ Error en getOrCreateStore:', error);
    throw error;
  }
}

/**
 * Detect if message needs knowledge base
 */
export function needsKnowledgeBase(message) {
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
 * Query File Search with conversation history
 */
export async function queryKnowledgeBase(message, history = []) {
  try {
    const storeName = await getOrCreateStore();
    
    await logTechnical(`🔍 Consultando base de conocimiento: "${message.substring(0, 50)}..."`);

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: getSystemPrompt(),
    });

    const chat = model.startChat({
      history: history,
      tools: [{
        fileSearch: {
          fileSearchStoreNames: [storeName]
        }
      }],
    });

    const result = await chat.sendMessage(message);
    const response = result.response.text();

    // Check if File Search was used
    const usedKnowledge = response.includes('📚') || needsKnowledgeBase(message);

    if (usedKnowledge) {
      await logTechnical('✅ Respuesta obtenida de base de conocimiento');
    }

    return {
      text: response,
      usedKnowledge: usedKnowledge
    };

  } catch (error) {
    console.error('❌ Error en queryKnowledgeBase:', error);
    throw error;
  }
}

/**
 * System prompt for knowledge base queries
 */
function getSystemPrompt() {
  return `Eres un supervisor de ventas de Pixan, una empresa de productos de belleza.

TU TRABAJO:
1. Ayudar a los vendedores con información sobre productos, comisiones y manejo de objeciones
2. Recolectar su reporte diario de ventas de forma conversacional y amigable
3. Motivar y apoyar al equipo de ventas

CUÁNDO BUSCAR EN DOCUMENTOS:
Siempre que el vendedor pregunte sobre:
- Comisiones y compensación ("¿cuánto gano por...?")
- Información de productos y precios
- Cómo manejar objeciones de clientes
- Políticas de descuentos
- Territorios y zonas de venta
- Cualquier información de políticas de la empresa

TONO:
- Amigable y cercano (como un supervisor que aprecia a su equipo)
- Motivador y positivo
- Profesional pero no rígido
- Usa el nombre del vendedor cuando lo sepas

IMPORTANTE:
- Cuando uses información de documentos, agrega 📚 al final
- Si no encuentras información específica, dilo claramente
- No inventes datos de comisiones, precios o políticas`;
}

/**
 * List all documents in knowledge base
 */
export async function listDocuments() {
  try {
    const storeName = await getOrCreateStore();
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${storeName}/documents`,
      {
        headers: { 'X-Goog-Api-Key': process.env.GEMINI_API_KEY }
      }
    );

    const data = await response.json();
    return data.documents || [];
  } catch (error) {
    console.error('❌ Error listando documentos:', error);
    return [];
  }
}
