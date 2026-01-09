/**
 * Document Processing Service
 * Extracts text from PDF, DOCX, TXT, and other formats
 */

const pdf = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extract text from PDF file
 * @param {Buffer} buffer - PDF file buffer
 */
async function extractFromPDF(buffer) {
  try {
    const data = await pdf(buffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Extract text from DOCX file
 * @param {Buffer} buffer - DOCX file buffer
 */
async function extractFromDOCX(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('Error extracting from DOCX:', error);
    throw new Error('Failed to extract text from DOCX');
  }
}

/**
 * Extract text from plain text file
 * @param {Buffer} buffer - Text file buffer
 */
function extractFromTXT(buffer) {
  return buffer.toString('utf-8');
}

/**
 * Extract text from CSV
 * @param {Buffer} buffer - CSV file buffer
 */
function extractFromCSV(buffer) {
  const text = buffer.toString('utf-8');
  // Convert CSV to readable text
  const lines = text.split('\n');
  return lines.map(line => line.replace(/,/g, ' | ')).join('\n');
}

/**
 * Main processor - detects file type and extracts text
 * @param {Buffer} buffer - File buffer
 * @param {string} filename - Original filename
 */
async function processDocument(buffer, filename) {
  const ext = filename.split('.').pop().toLowerCase();

  try {
    let text = '';
    
    switch (ext) {
      case 'pdf':
        text = await extractFromPDF(buffer);
        break;
      case 'docx':
      case 'doc':
        text = await extractFromDOCX(buffer);
        break;
      case 'txt':
      case 'md':
        text = extractFromTXT(buffer);
        break;
      case 'csv':
        text = extractFromCSV(buffer);
        break;
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }

    // Clean up text
    text = text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
      .trim();

    if (!text || text.length < 10) {
      throw new Error('Document appears to be empty or too short');
    }

    return {
      text,
      wordCount: text.split(/\s+/).length,
      charCount: text.length,
      fileType: ext
    };
  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
}

/**
 * Split text into chunks for better embedding
 * @param {string} text - Full text
 * @param {number} maxChunkSize - Maximum characters per chunk
 * @param {number} overlap - Character overlap between chunks
 */
function splitIntoChunks(text, maxChunkSize = 1000, overlap = 100) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + maxChunkSize, text.length);
    const chunk = text.slice(start, end);
    
    if (chunk.trim().length > 0) {
      chunks.push(chunk.trim());
    }

    start = end - overlap;
    if (start >= text.length) break;
  }

  return chunks;
}

module.exports = {
  processDocument,
  splitIntoChunks,
  extractFromPDF,
  extractFromDOCX,
  extractFromTXT,
  extractFromCSV
};
