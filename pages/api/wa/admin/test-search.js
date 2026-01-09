/**
 * API for testing File Search queries
 * POST - Test a search query
 */

import { queryKnowledgeBase } from '../../../../lib/wa/file-search.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Debes proporcionar una consulta'
      });
    }

    console.log(`🧪 Probando búsqueda: "${query}"`);

    const startTime = Date.now();
    const result = await queryKnowledgeBase(query, []);
    const duration = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      query: query,
      response: result.text,
      usedKnowledge: result.usedKnowledge,
      duration: `${duration}ms`
    });

  } catch (error) {
    console.error('❌ Error en búsqueda de prueba:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
