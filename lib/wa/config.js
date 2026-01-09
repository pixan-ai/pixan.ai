/**
 * WhatsApp Bot Configuration
 * Centralized config for models, constants, and settings
 * 
 * AI Gateway model IDs MUST match exactly what genAI.js uses
 */

export const MODELS = {
  // === FREE MODEL (Direct Google API) ===
  // Solo Gemini 3 Flash con soporte de visión Y base de conocimiento
  gemini: {
    id: 'gemini',
    name: 'Gemini 3 Flash',
    provider: 'google-direct',
    model: 'gemini-3-flash-preview',
    apiVersion: 'v1beta',
    vision: true,
    knowledgeBase: true,  // ✅ Acceso a File Search
    free: true
  },
  
  // === PREMIUM MODELS (AI Gateway) ===
  // NINGUNO soporta visión NI base de conocimiento
  opus: {
    id: 'opus',
    name: 'Claude Opus 4.5',
    provider: 'ai-gateway',
    model: 'anthropic/claude-opus-4-5',
    vision: false,  // ❌ No soporta imágenes
    knowledgeBase: false,  // ❌ No accede a base de conocimiento
    free: false
  },
  sonnet: {
    id: 'sonnet',
    name: 'Claude Sonnet 4.5',
    provider: 'ai-gateway',
    model: 'anthropic/claude-sonnet-4.5',
    vision: false,  // ❌ No soporta imágenes
    knowledgeBase: false,  // ❌ No accede a base de conocimiento
    free: false
  },
  haiku: {
    id: 'haiku',
    name: 'Claude Haiku 3.5',
    provider: 'ai-gateway',
    model: 'anthropic/claude-3.5-haiku',
    vision: false,  // ❌ No soporta imágenes
    knowledgeBase: false,  // ❌ No accede a base de conocimiento
    free: false
  },
  gpt: {
    id: 'gpt',
    name: 'GPT-5.2',
    provider: 'ai-gateway',
    model: 'openai/gpt-5.2',
    vision: false,  // ❌ No soporta imágenes
    knowledgeBase: false,  // ❌ No accede a base de conocimiento
    free: false
  },
  grok: {
    id: 'grok',
    name: 'Grok 4.1',
    provider: 'ai-gateway',
    model: 'xai/grok-4.1-fast-reasoning',
    vision: false,  // ❌ No soporta imágenes
    knowledgeBase: false,  // ❌ No accede a base de conocimiento
    free: false
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek V3.2',
    provider: 'ai-gateway',
    model: 'deepseek/deepseek-v3.2-exp-thinking',
    vision: false,  // ❌ No soporta imágenes
    knowledgeBase: false,  // ❌ No accede a base de conocimiento
    free: false
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral Large',
    provider: 'ai-gateway',
    model: 'mistral/mistral-large-2411',
    vision: false,  // ❌ No soporta imágenes
    knowledgeBase: false,  // ❌ No accede a base de conocimiento
    free: false
  },
  llama: {
    id: 'llama',
    name: 'Llama 3.3 70B',
    provider: 'ai-gateway',
    model: 'meta-llama/llama-3.3-70b-instruct',
    vision: false,  // ❌ No soporta imágenes
    knowledgeBase: false,  // ❌ No accede a base de conocimiento
    free: false
  }
};

export const DEFAULT_MODEL = 'gemini';

export const MEMORY = {
  maxMessages: 100,
  summaryThreshold: 30,
  recentLimit: 10,
  expirationMonths: 12
};

export const LIMITS = {
  geminiDaily: 1500,
  upstashDaily: 10000,
  maxTokens: 1024
};

export const DEFAULT_SYSTEM_PROMPT = `Eres un asistente útil, conciso y amigable de Pixan en español. 
Puedes ver y analizar imágenes cuando te las envíen. 
Responde de manera clara y directa. Si no sabes algo, admítelo.`;

export const getHelpText = (currentModel) => {
  const modelInfo = MODELS[currentModel] || MODELS.gemini;
  const vision = modelInfo.vision ? '✅ Analiza imágenes' : '❌ Sin imágenes';
  const knowledge = modelInfo.knowledgeBase ? '✅ Base de conocimiento' : '❌ Sin base conocimiento';
  const cost = modelInfo.free ? '💰 GRATIS' : '💳 Premium';
  
  return `📱 *Bot Multi-IA de Pixan*

🎯 *Modelo actual:* ${modelInfo.name}
${cost}
${vision}
${knowledge}

*Modelos Disponibles:*

💰 *GRATIS (visión + conocimiento):*
• /gemini - Gemini 3 Flash 📷 📚

💳 *PREMIUM (sin visión ni conocimiento):*
• /opus - Claude Opus 4.5
• /sonnet - Claude Sonnet 4.5
• /haiku - Claude Haiku 3.5
• /gpt - GPT-5.2
• /grok - Grok 4.1
• /deepseek - DeepSeek V3.2
• /mistral - Mistral Large
• /llama - Llama 3.3 70B

*Comandos:*
• /ayuda - Esta ayuda
• /reset - Borrar memoria
• /modelo [nombre] - Cambiar modelo
• /docs - Ver documentos en base conocimiento

⚠️ *IMPORTANTE:* 
• Solo Gemini puede analizar imágenes
• Solo Gemini puede consultar base de conocimiento Pixan`;
};

export const getModelInfo = (modelId) => MODELS[modelId] || MODELS[DEFAULT_MODEL];

/**
 * Get alert message when switching to non-Gemini model
 */
export const getModelAlert = (modelId) => {
  const model = MODELS[modelId];
  
  if (!model || model.id === 'gemini') {
    return null; // No alert for Gemini
  }
  
  return `⚠️ *Limitaciones con ${model.name}*

Este modelo NO puede:
• ❌ Analizar imágenes
• ❌ Consultar la base de conocimiento de Pixan

Si necesitas:
• Analizar fotos/imágenes
• Consultar comisiones, productos u objeciones
• Información de políticas de la empresa

Usa: /gemini`;
};
