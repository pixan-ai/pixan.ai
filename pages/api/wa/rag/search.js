/**
 * Search RAG documents
 * POST /api/wa/rag/search
 */

import { queryDocuments } from '@/lib/wa/rag/vector';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, topK = 5, category = null } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query required' });
    }

    console.log(`[RAG Search] Query: "${query}" (topK: ${topK})`);

    // Build filter if category specified
    let filter = null;
    if (category && category !== 'all') {
      filter = `category = '${category}'`;
    }

    // Query vector database
    const results = await queryDocuments(query, topK, filter);

    // Format results
    const formatted = results.map((result, index) => ({
      rank: index + 1,
      score: result.score,
      text: result.metadata?.text || '',
      filename: result.metadata?.filename || 'Unknown',
      category: result.metadata?.category || 'general',
      chunkIndex: result.metadata?.chunkIndex || 0,
      totalChunks: result.metadata?.totalChunks || 1
    }));

    console.log(`[RAG Search] Found ${formatted.length} results`);

    res.status(200).json({
      success: true,
      query,
      results: formatted,
      count: formatted.length
    });

  } catch (error) {
    console.error('[RAG Search] Error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to search documents' 
    });
  }
}
