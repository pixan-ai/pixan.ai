/**
 * API for managing knowledge base documents
 * Stores documents in Redis for RAG queries
 * GET - List all documents
 * POST - Upload new document
 * DELETE - Remove document
 */

import formidable from 'formidable';
import { readFileSync, unlinkSync } from 'fs';
import { getRedis } from '../../../../lib/wa/redis.js';

// Redis keys
const DOCS_KEY = 'wa:knowledge:docs';
const DOCS_CONTENT_PREFIX = 'wa:knowledge:content:';

// Disable bodyParser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * GET - List all documents
 */
async function handleGet(req, res) {
  try {
    const redis = getRedis();
    const docs = await redis.hgetall(DOCS_KEY);
    
    const documents = Object.entries(docs || {}).map(([id, data]) => {
      // Handle both string and object data
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      return {
        id,
        name: parsed.name,
        displayName: parsed.displayName,
        size: parsed.size,
        mimeType: parsed.mimeType,
        uploadedAt: parsed.uploadedAt,
      };
    });

    // Sort by upload date (newest first)
    documents.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    return res.status(200).json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (error) {
    console.error('❌ Error listando documentos:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * POST - Upload new document
 */
async function handlePost(req, res) {
  try {
    // Parse form data
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10 MB max for text docs
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const file = files.file?.[0];
    const displayName = fields.displayName?.[0] || file?.originalFilename || 'Documento sin nombre';

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No se proporcionó archivo'
      });
    }

    console.log(`📤 Subiendo archivo: ${displayName}`);

    // Read file content
    const content = readFileSync(file.filepath, 'utf-8');
    
    // Generate unique ID
    const docId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store document metadata
    const metadata = {
      name: file.originalFilename,
      displayName: displayName,
      size: file.size,
      mimeType: file.mimetype,
      uploadedAt: new Date().toISOString(),
    };

    // Save to Redis
    const redis = getRedis();
    await redis.hset(DOCS_KEY, { [docId]: JSON.stringify(metadata) });
    await redis.set(`${DOCS_CONTENT_PREFIX}${docId}`, content);

    // Clean up temp file
    try {
      unlinkSync(file.filepath);
    } catch (e) {
      // Ignore cleanup errors
    }

    console.log(`✅ Documento guardado: ${displayName} (${docId})`);

    return res.status(200).json({
      success: true,
      message: `Documento "${displayName}" subido exitosamente`,
      document: {
        id: docId,
        ...metadata
      }
    });

  } catch (error) {
    console.error('❌ Error subiendo documento:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * DELETE - Remove document
 */
async function handleDelete(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'No se proporcionó ID de documento'
      });
    }

    // Remove from Redis
    const redis = getRedis();
    await redis.hdel(DOCS_KEY, id);
    await redis.del(`${DOCS_CONTENT_PREFIX}${id}`);

    console.log(`🗑️ Documento eliminado: ${id}`);

    return res.status(200).json({
      success: true,
      message: 'Documento eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error eliminando documento:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Main handler
 */
export default async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res);
    case 'DELETE':
      return handleDelete(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
