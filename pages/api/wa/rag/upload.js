/**
 * Upload Document to RAG
 * POST /api/wa/rag/upload
 */

import { processDocument, splitIntoChunks } from '@/lib/wa/rag/processor';
import { upsertDocument } from '@/lib/wa/rag/vector';
import { getRedis } from '@/lib/wa/redis';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { filename, content, category = 'general' } = req.body;

    if (!filename || !content) {
      return res.status(400).json({ error: 'Filename and content required' });
    }

    // Decode base64 file content
    const buffer = Buffer.from(content, 'base64');

    // Process document to extract text
    console.log(`[RAG Upload] Processing ${filename}...`);
    const processed = await processDocument(buffer, filename);

    // Split into chunks if text is large
    const chunks = splitIntoChunks(processed.text, 1000, 100);
    console.log(`[RAG Upload] Split into ${chunks.length} chunks`);

    // Generate unique document ID
    const timestamp = Date.now();
    const baseId = filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '-');

    // Upload all chunks
    const uploadedChunks = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunkId = `${baseId}-${timestamp}-chunk-${i}`;
      
      await upsertDocument(chunkId, chunks[i], {
        filename,
        category,
        fileType: processed.fileType,
        chunkIndex: i,
        totalChunks: chunks.length,
        baseId: `${baseId}-${timestamp}`,
        uploadedAt: new Date().toISOString()
      });

      uploadedChunks.push(chunkId);
    }

    // Save document metadata in Redis
    const redis = getRedis();
    const docMetadata = {
      filename,
      category,
      fileType: processed.fileType,
      wordCount: processed.wordCount,
      charCount: processed.charCount,
      chunksCount: chunks.length,
      chunkIds: uploadedChunks,
      baseId: `${baseId}-${timestamp}`,
      uploadedAt: new Date().toISOString()
    };

    await redis.hset(
      'wa:rag:documents',
      `${baseId}-${timestamp}`,
      JSON.stringify(docMetadata)
    );

    console.log(`[RAG Upload] ✅ Uploaded ${filename} (${chunks.length} chunks)`);

    res.status(200).json({
      success: true,
      message: `Document uploaded successfully with ${chunks.length} chunks`,
      document: docMetadata
    });

  } catch (error) {
    console.error('[RAG Upload] Error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to upload document' 
    });
  }
}
