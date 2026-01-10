/**
 * Gemini File Search Service
 * Manages knowledge base queries for Pixan WhatsApp Bot
 * 
 * Uses documents stored in Redis to provide contextual answers
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getRedis } from './redis.js';
import { logTechnical } from './logger.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Redis keys (same as in docs API)
const DOCS_KEY = 'wa:knowledge:docs';
const DOCS_CONTENT_PREFIX = 'wa:knowledge:content:';

// Use Gemini 3 Flash - latest and best free tier model
const KNOWLEDGE_MODEL = 'gemini-3-flash-preview';

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
    'cómo respondo', 'como respondo', 'qué le digo', 'que le digo',
    'política', 'politica', 'regla',
    'territorio', 'zona',
    'producto', 'productos',
    'catálogo', 'catalogo',
    'muy caro', 'está caro', 'esta caro', 'era caro',
    'lo voy a pensar', 'voy a pensar',
    'no tengo dinero', 'no tengo plata',
    'ya tengo', 'no necesito'
  ];

  const messageLower = message.toLowerCase();
  return keywords.some(keyword => messageLower.includes(keyword));
}

/**
 * Get all documents from Redis
 */
async function getAllDocuments() {
  try {
    const redis = getRedis();
    const docs = await redis.hgetall(DOCS_KEY);
    
    if (!docs || Object.keys(docs).length === 0) {
      return [];
    }

    const documents = [];
    
    for (const [id, metadata] of Object.entries(docs)) {
      // Get content for each document
      const content = await redis.get(`${DOCS_CONTENT_PREFIX}${id}`);
      const meta = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
      
      if (content) {
        documents.push({
          id,
          name: meta.displayName || meta.name,
          content: content
        });
      }
    }

    return documents;
  } catch (error) {
    console.error('❌ Error cargando documentos:', error);
    return [];
  }
}

/**
 * Build context from documents for the prompt
 */
function buildKnowledgeContext(documents) {
  if (documents.length === 0) {
    return '';
  }

  let context = '\n\n=== BASE DE CONOCIMIENTO DE PIXAN ===\n';
  context += 'Usa la siguiente información para responder preguntas:\n\n';

  for (const doc of documents) {
    context += `--- ${doc.name} ---\n`;
    context += doc.content;
    context += '\n\n';
  }

  context += '=== FIN DE BASE DE CONOCIMIENTO ===\n';
  
  return context;
}

/**
 * Query with Gemini using knowledge from Redis documents
 */
export async function queryKnowledgeBase(message, history = []) {
  try {
    await logTechnical(`🔍 Procesando consulta de conocimiento: "${message.substring(0, 50)}..."`);

    // Load documents from Redis
    const documents = await getAllDocuments();
    const knowledgeContext = buildKnowledgeContext(documents);
    
    await logTechnical(`📚 Documentos cargados: ${documents.length}`);
    
    if (documents.length > 0) {
      await logTechnical(`📄 Docs: ${documents.map(d => d.name).join(', ')}`);
    }

    await logTechnical(`🤖 Usando modelo: ${KNOWLEDGE_MODEL}`);

    const model = genAI.getGenerativeModel({
      model: KNOWLEDGE_MODEL,
      systemInstruction: getSystemPrompt() + knowledgeContext,
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

    await logTechnical('✅ Respuesta generada con base de conocimiento');

    return {
      text: response,
      usedKnowledge: documents.length > 0,
      documentsUsed: documents.length
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

INSTRUCCIONES IMPORTANTES:
- SIEMPRE usa la información de la BASE DE CONOCIMIENTO cuando esté disponible
- Para preguntas sobre objeciones, busca la objeción específica en los documentos
- Para preguntas sobre comisiones, usa los datos exactos de los documentos
- Si encuentras la información, responde con los datos específicos del documento
- Si NO encuentras información específica, indica que no tienes esa información

TONO:
- Amigable y cercano (como un supervisor que aprecia a su equipo)
- Motivador y positivo
- Profesional pero no rígido
- Usa el nombre del vendedor cuando lo sepas

FORMATO DE RESPUESTA:
- Sé conciso y directo
- Usa listas o pasos cuando sea apropiado
- Si usas información de documentos, puedes indicarlo sutilmente`;
}

/**
 * List all documents in knowledge base
 */
export async function listDocuments() {
  return getAllDocuments();
}
