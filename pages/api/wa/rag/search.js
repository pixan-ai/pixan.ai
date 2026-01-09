// DEPRECATED - This file has been removed
// Migrated to Gemini File Search
// See: /pages/api/wa/admin/test-search.js

export default function handler(req, res) {
  return res.status(410).json({
    error: 'This endpoint has been deprecated',
    message: 'Please use /api/wa/admin/test-search instead',
    migration: 'Migrated to Gemini File Search on Jan 9, 2026'
  });
}
