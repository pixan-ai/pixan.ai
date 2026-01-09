/**
 * Upstash Vector Service for RAG
 * Handles all vector database operations with Gemini embeddings
 */

import { Index } from '@upstash/vector';

// Singleton instance
let vectorIndex = null;

/**
 * Get or create Vector DB instance
 */
function getVectorIndex() {
  if (!vectorIndex) {
    const url = process.env.UPSTASH_VECTOR_REST_URL;
    const token = process.env.UPSTASH_VECTOR_REST_TOKEN;

    if (!url || !token) {
      throw new Error('Upstash Vector credentials not configured');
    }

    vectorIndex = new Index({
      url,
      token,
    });
  }
  return vectorIndex;
}

/**
 * Generate embedding using Gemini API
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} - Embedding vector
 */
async function generateEmbedding(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: {
            parts: [{ text: text }]
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gemini API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Upsert a document into the vector database
 * @param {string} id - Unique document ID
 * @param {string} text - Document text content
 * @param {object} metadata - Additional metadata
 */
async function upsertDocument(id, text, metadata = {}) {
  try {
    const index = getVectorIndex();
    const embedding = await generateEmbedding(text);

    await index.upsert({
      id,
      vector: embedding,
      metadata: {
        text,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    });

    return { success: true, id };
  } catch (error) {
    console.error('Error upserting document:', error);
    throw error;
  }
}

/**
 * Query similar documents
 * @param {string} query - Search query
 * @param {number} topK - Number of results to return
 * @param {object} filter - Metadata filter (optional)
 */
async function queryDocuments(query, topK = 5, filter = null) {
  try {
    const index = getVectorIndex();
    const embedding = await generateEmbedding(query);

    const queryOptions = {
      vector: embedding,
      topK,
      includeMetadata: true,
      includeVectors: false
    };

    if (filter) {
      queryOptions.filter = filter;
    }

    const results = await index.query(queryOptions);
    return results;
  } catch (error) {
    console.error('Error querying documents:', error);
    throw error;
  }
}

/**
 * Delete a document by ID
 * @param {string} id - Document ID to delete
 */
async function deleteDocument(id) {
  try {
    const index = getVectorIndex();
    await index.delete(id);
    return { success: true, id };
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
}

/**
 * Fetch document by ID
 * @param {string} id - Document ID
 */
async function fetchDocument(id) {
  try {
    const index = getVectorIndex();
    const result = await index.fetch([id]);
    return result[0] || null;
  } catch (error) {
    console.error('Error fetching document:', error);
    throw error;
  }
}

/**
 * Get vector database stats
 */
async function getStats() {
  try {
    const index = getVectorIndex();
    const info = await index.info();
    return info;
  } catch (error) {
    console.error('Error getting stats:', error);
    throw error;
  }
}

module.exports = {
  generateEmbedding,
  upsertDocument,
  queryDocuments,
  deleteDocument,
  fetchDocument,
  getStats
};
