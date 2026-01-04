/**
 * WhatsApp Bot Configuration
 * Centralized config for models, constants, and settings
 * 
 * AI Gateway model IDs MUST match exactly what genAI.js uses
 */

export const MODELS = {
  // === FREE MODEL (Direct Google API) ===
  // Solo Gemini 3 Flash con soporte de visión
  gemini: {
    id: 'gemini',
    name: 'Gemini 3 Flash',
    provider: 'google-direct',
    model: 'gemini-3-flash-preview',
    apiVersion: 'v1beta',
    vision: true,
    free: true
  },
  
  // === PREMIUM MODELS (AI Gateway) ===
  // NINGUNO soporta visión - solo Gemini puede analizar imágenes
  opus: {
    id: 'opus',
    name: 'Claude Opus 4.5',
    provider: 'ai-gateway',
    model: 'anthropic/claude-opus-4-5',
    vision: false,  // ❌ No soporta imágenes
    free: false
  },
  sonnet: {
    id: 'sonnet',
    name: 'Claude Sonnet 4.5',
    provider: 'ai-gateway',
    model: 'anthropic/claude-sonnet-4.5',
    vision: false,  // ❌ No soporta imágenes
    free: false
  },
  haiku: {
    id: 'haiku',
    name: 'Claude Haiku 3.5',
    provider: 'ai-gateway',
    model: 'anthropic/claude-3.5-haiku',
    vision: false,  // ❌ No soporta imágenes
    free: false
  },
  gpt: {
    id: 'gpt',
    name: 'GPT-5.2',
    provider: 'ai-gateway',
    model: 'openai/gpt-5.2',
    vision: false,  // ❌ No soporta imágenes
    free: false
  },
  grok: {
    id: 'grok',
    name: 'Grok 4.1',
    provider: 'ai-gateway',
    model: 'xai/grok-4.1-fast-reasoning',
    vision: false,  // ❌ No soporta imágenes
    free: false
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek V3.2',
    provider: 'ai-gateway',
    model: 'deepseek/deepseek-v3.2-exp-thinking',
    vision: false,  // ❌ No soporta imágenes
    free: false
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral Large',
    provider: 'ai-gateway',
    model: 'mistral/mistral-large-2411',
    vision: false,  // ❌ No soporta imágenes
    free: false
  },
  llama: {
    id: 'llama',
    name: 'Llama 3.3 70B',
    provider: 'ai-gateway',
    model: 'meta-llama/llama-3.3-70b-instruct',
    vision: false,  // ❌ No soporta imágenes
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
  const vision = modelInfo.vision ? '📷 Analiza imágenes' : '📝 Solo texto';
  const cost = modelInfo.free ? '💰 GRATIS' : '💳 Premium';
  
  return `📱 *Bot Multi-IA de Pixan*

🎯 *Modelo actual:* ${modelInfo.name}
${cost} | ${vision}

*Modelos Disponibles:*

💰 *GRATIS (con visión):*
• /gemini - Gemini 3 Flash 📷

💳 *PREMIUM (sin visión):*
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

⚠️ *IMPORTANTE:* Solo Gemini 3 Flash puede analizar imágenes.
Si envías una imagen con otro modelo, debes cambiarlo primero.`;
};

export const getModelInfo = (modelId) => MODELS[modelId] || MODELS[DEFAULT_MODEL];
