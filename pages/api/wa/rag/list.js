/**
 * List all RAG documents
 * GET /api/wa/rag/list
 */

import { getRedis } from '@/lib/wa/redis';
import { getStats } from '@/lib/wa/rag/vector';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const redis = getRedis();
    
    // Get all documents from Redis
    const docs = await redis.hgetall('wa:rag:documents');
    
    // Parse and format documents
    const documents = Object.entries(docs || {}).map(([id, data]) => {
      const parsed = JSON.parse(data);
      return {
        id,
        ...parsed
      };
    });

    // Sort by upload date (newest first)
    documents.sort((a, b) => 
      new Date(b.uploadedAt) - new Date(a.uploadedAt)
    );

    // Get vector database stats
    let stats = null;
    try {
      stats = await getStats();
    } catch (error) {
      console.error('[RAG List] Error getting stats:', error);
    }

    res.status(200).json({
      success: true,
      documents,
      stats,
      count: documents.length
    });

  } catch (error) {
    console.error('[RAG List] Error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to list documents' 
    });
  }
}
