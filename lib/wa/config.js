/**
 * WhatsApp Bot Configuration
 * Centralized config for models, constants, and settings
 * 
 * AI Gateway model IDs MUST match exactly what genAI.js uses
 */

export const MODELS = {
  // === FREE MODELS (Direct Google API) ===
  gemini: {
    id: 'gemini',
    name: 'Gemini 3 Flash',
    provider: 'google-direct',
    model: 'gemini-2.5-flash-preview-05-20',
    apiVersion: 'v1beta',
    vision: true,
    free: true
  },
  'gemini-flash': {
    id: 'gemini-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google-direct',
    model: 'gemini-2.5-flash',
    apiVersion: 'v1beta',
    vision: true,
    free: true
  },
  'gemini-thinking': {
    id: 'gemini-thinking',
    name: 'Gemini Thinking',
    provider: 'google-direct',
    model: 'gemini-2.0-flash-thinking-exp-1219',
    apiVersion: 'v1beta',
    vision: false,
    free: true
  },
  
  // === PREMIUM MODELS (AI Gateway) ===
  // Model IDs from genAI.js LLM_CONFIG
  opus: {
    id: 'opus',
    name: 'Claude Opus 4.5',
    provider: 'ai-gateway',
    model: 'anthropic/claude-opus-4-5',  // Correct: 4-5 not 4.5
    vision: true,
    free: false
  },
  sonnet: {
    id: 'sonnet',
    name: 'Claude Sonnet 4.5',
    provider: 'ai-gateway',
    model: 'anthropic/claude-sonnet-4.5',
    vision: true,
    free: false
  },
  haiku: {
    id: 'haiku',
    name: 'Claude Haiku 3.5',
    provider: 'ai-gateway',
    model: 'anthropic/claude-3.5-haiku',
    vision: true,
    free: false
  },
  gpt: {
    id: 'gpt',
    name: 'GPT-5.2',
    provider: 'ai-gateway',
    model: 'openai/gpt-5.2',  // Correct from genAI
    vision: true,
    free: false
  },
  grok: {
    id: 'grok',
    name: 'Grok 4.1',
    provider: 'ai-gateway',
    model: 'xai/grok-4.1-fast-reasoning',  // Correct: 4.1 not 4-1
    vision: false,
    free: false
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek V3.2',
    provider: 'ai-gateway',
    model: 'deepseek/deepseek-v3.2-exp-thinking',
    vision: false,
    free: false
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral Large',
    provider: 'ai-gateway',
    model: 'mistral/mistral-large-2411',
    vision: false,
    free: false
  },
  llama: {
    id: 'llama',
    name: 'Llama 3.3 70B',
    provider: 'ai-gateway',
    model: 'meta-llama/llama-3.3-70b-instruct',
    vision: false,
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
  const freeModels = Object.values(MODELS).filter(m => m.free).map(m => `• /${m.id} 💰`).join('\n');
  const paidModels = Object.values(MODELS).filter(m => !m.free).map(m => `• /${m.id}`).join('\n');
  
  return `📱 *Bot Multi-IA de Pixan*

🎯 *Modelo actual:* ${currentModel}

*Modelos GRATIS:*
${freeModels}

*Modelos Premium:*
${paidModels}

*Comandos:*
• /ayuda - Esta ayuda
• /reset - Borrar memoria
• /modelo [nombre] - Cambiar modelo

📷 Envía imágenes para analizarlas`;
};

export const getModelInfo = (modelId) => MODELS[modelId] || MODELS[DEFAULT_MODEL];
