/**
 * Delete RAG document
 * DELETE /api/wa/rag/delete
 */

import { getRedis } from '@/lib/wa/redis';
import { deleteDocument } from '@/lib/wa/rag/vector';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { documentId } = req.body;

    if (!documentId) {
      return res.status(400).json({ error: 'Document ID required' });
    }

    const redis = getRedis();
    
    // Get document metadata
    const docData = await redis.hget('wa:rag:documents', documentId);
    
    if (!docData) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = JSON.parse(docData);

    // Delete all chunks from vector DB
    console.log(`[RAG Delete] Deleting ${doc.chunksCount} chunks...`);
    for (const chunkId of doc.chunkIds) {
      try {
        await deleteDocument(chunkId);
      } catch (error) {
        console.error(`[RAG Delete] Error deleting chunk ${chunkId}:`, error);
      }
    }

    // Delete metadata from Redis
    await redis.hdel('wa:rag:documents', documentId);

    console.log(`[RAG Delete] ✅ Deleted document: ${doc.filename}`);

    res.status(200).json({
      success: true,
      message: `Document '${doc.filename}' deleted successfully`
    });

  } catch (error) {
    console.error('[RAG Delete] Error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to delete document' 
    });
  }
}
