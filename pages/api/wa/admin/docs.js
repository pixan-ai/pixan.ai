/**
 * API for managing File Search documents
 * GET - List all documents
 * POST - Upload new document
 * DELETE - Remove document
 */

import { GoogleAIFileManager } from '@google/generative-ai';
import formidable from 'formidable';
import { readFileSync, unlinkSync } from 'fs';
import { getOrCreateStore } from '../../../../lib/wa/file-search.js';

const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

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
    const storeName = await getOrCreateStore();
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${storeName}/documents`,
      {
        headers: { 'X-Goog-Api-Key': process.env.GEMINI_API_KEY }
      }
    );

    const data = await response.json();
    const documents = data.documents || [];
    
    return res.status(200).json({
      success: true,
      count: documents.length,
      documents: documents.map(doc => ({
        name: doc.name,
        displayName: doc.displayName,
        createTime: doc.createTime,
        updateTime: doc.updateTime,
      }))
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
      maxFileSize: 100 * 1024 * 1024, // 100 MB
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

    // Upload file to Gemini
    const uploadResult = await fileManager.uploadFile(file.filepath, {
      mimeType: file.mimetype,
      displayName: displayName,
    });

    console.log(`✅ Archivo subido: ${uploadResult.file.uri}`);

    // Import to File Search Store
    const storeName = await getOrCreateStore();
    
    const importResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${storeName}/documents:import`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          inlineSource: {
            name: uploadResult.file.name
          }
        })
      }
    );

    if (!importResponse.ok) {
      const errorText = await importResponse.text();
      throw new Error(`Error importando archivo: ${importResponse.statusText} - ${errorText}`);
    }

    // Clean up temp file
    unlinkSync(file.filepath);

    console.log(`✅ Documento importado al store: ${displayName}`);

    return res.status(200).json({
      success: true,
      message: `Documento "${displayName}" subido exitosamente`,
      document: {
        fileUri: uploadResult.file.uri,
        fileName: uploadResult.file.name,
        displayName: displayName,
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
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'No se proporcionó nombre de documento'
      });
    }

    const storeName = await getOrCreateStore();
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${storeName}/documents/${name}`,
      {
        method: 'DELETE',
        headers: { 'X-Goog-Api-Key': process.env.GEMINI_API_KEY }
      }
    );

    if (!response.ok) {
      throw new Error(`Error eliminando documento: ${response.statusText}`);
    }

    console.log(`🗑️ Documento eliminado: ${name}`);

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
