/**
 * Knowledge Base Service
 * Loads documents from Redis for AI context
 * 
 * NO keyword detection - AI decides when to use the information
 */

import { getRedis } from './redis.js';
import { logTechnical } from './logger.js';

// Redis keys
const DOCS_KEY = 'wa:knowledge:docs';
const DOCS_CONTENT_PREFIX = 'wa:knowledge:content:';

/**
 * Get all documents from Redis
 */
export async function getAllDocuments() {
  try {
    const redis = getRedis();
    const docs = await redis.hgetall(DOCS_KEY);
    
    if (!docs || Object.keys(docs).length === 0) {
      return [];
    }

    const documents = [];
    
    for (const [id, metadata] of Object.entries(docs)) {
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
    console.error('❌ Error loading documents:', error);
    return [];
  }
}

/**
 * Build knowledge context string from documents
 */
export function buildKnowledgeContext(documents) {
  if (!documents || documents.length === 0) {
    return '';
  }

  let context = '\n\n=== BASE DE CONOCIMIENTO DE PIXAN ===\n';
  context += 'Información disponible para consulta:\n\n';

  for (const doc of documents) {
    context += `--- ${doc.name} ---\n`;
    context += doc.content;
    context += '\n\n';
  }

  context += '=== FIN DE BASE DE CONOCIMIENTO ===\n';
  context += 'Usa esta información cuando sea relevante para responder al usuario.\n';
  
  return context;
}

/**
 * Get knowledge context ready to append to system prompt
 */
export async function getKnowledgeContext() {
  const documents = await getAllDocuments();
  
  if (documents.length > 0) {
    await logTechnical(`📚 Base de conocimiento: ${documents.length} docs cargados`);
  }
  
  return {
    context: buildKnowledgeContext(documents),
    documentCount: documents.length,
    documentNames: documents.map(d => d.name)
  };
}

/**
 * List all documents (for admin panel)
 */
export async function listDocuments() {
  return getAllDocuments();
}
