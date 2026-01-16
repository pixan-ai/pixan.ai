// Configuración segura de APIs con ofuscación
const crypto = require('crypto');

// Función para desofuscar las APIs
const deobfuscate = (encoded) => {
  if (!encoded) return '';
  try {
    return Buffer.from(encoded, 'base64').toString('utf-8');
  } catch {
    return '';
  }
};

// APIs desde variables de entorno (pueden estar ofuscadas o directas)
const API_KEYS = {
  claude: process.env.CLAUDE_API_KEY_ENCODED ? deobfuscate(process.env.CLAUDE_API_KEY_ENCODED) : process.env.CLAUDE_API_KEY || '',
  openai: process.env.OPENAI_API_KEY_ENCODED ? deobfuscate(process.env.OPENAI_API_KEY_ENCODED) : process.env.OPENAI_API_KEY || '',
  gemini: process.env.GEMINI_API_KEY_ENCODED ? deobfuscate(process.env.GEMINI_API_KEY_ENCODED) : process.env.GEMINI_API_KEY || '',
  perplexity: process.env.PERPLEXITY_API_KEY_ENCODED ? deobfuscate(process.env.PERPLEXITY_API_KEY_ENCODED) : process.env.PERPLEXITY_API_KEY || '',
  deepseek: process.env.DEEPSEEK_API_KEY_ENCODED ? deobfuscate(process.env.DEEPSEEK_API_KEY_ENCODED) : process.env.DEEPSEEK_API_KEY || '',
  mistral: process.env.MISTRAL_API_KEY_ENCODED ? deobfuscate(process.env.MISTRAL_API_KEY_ENCODED) : process.env.MISTRAL_API_KEY || ''
};

// Configuración de precios por token (en USD) - Actualizado Diciembre 22, 2025
const PRICING = {
  claude: {
    input: 0.005 / 1000,  // $5 por millón de tokens de entrada
    output: 0.025 / 1000, // $25 por millón de tokens de salida
    model: 'claude-opus-4-5-20251101'  // Actualizado a Claude Opus 4.5 (Nov 2025)
  },
  'claude-sonnet': {
    input: 0.003 / 1000,  // $3 por millón de tokens de entrada
    output: 0.015 / 1000, // $15 por millón de tokens de salida
    model: 'claude-sonnet-4-5-20250929'  // Claude Sonnet 4.5 - más económico que Opus
  },
  openai: {
    input: 0.00175 / 1000,   // $1.75 por millón de tokens de entrada
    output: 0.014 / 1000,  // $14 por millón de tokens de salida
    model: 'gpt-5.2'  // Actualizado a GPT-5.2 (Dic 2025) - flagship para coding y agentes
  },
  gemini: {
    input: 0.0005 / 1000,  // $0.50 por millón de tokens de entrada
    output: 0.003 / 1000, // $3 por millón de tokens de salida
    model: 'gemini-3-flash-preview'  // Actualizado a Gemini 3 Flash (Dic 17, 2025)
  },
  'gemini-thinking': {
    input: 0.0005 / 1000,  // $0.50 por millón de tokens de entrada
    output: 0.003 / 1000, // $3 por millón de tokens de salida
    model: 'gemini-2.0-flash-thinking-exp-1219'  // Gemini 2.0 Flash Thinking Experimental
  },
  'gemini-flash-stable': {
    input: 0.0005 / 1000,  // $0.50 por millón de tokens de entrada
    output: 0.003 / 1000, // $3 por millón de tokens de salida
    model: 'gemini-2.5-flash'  // Gemini 2.5 Flash - versión estable
  },
  perplexity: {
    input: 0.002 / 1000,  // $2 por millón de tokens de entrada
    output: 0.002 / 1000, // $2 por millón de tokens de salida
    model: 'sonar-pro'  // Actualizado con Llama 3.3 70B (Feb 2025)
  },
  deepseek: {
    input: 0.00028 / 1000,  // $0.28 por millón de tokens de entrada (cache miss)
    output: 0.00042 / 1000, // $0.42 por millón de tokens de salida
    model: 'deepseek-chat'  // DeepSeek-V3.2 (Dic 1, 2025) - reasoning-first para agentes
  },
  mistral: {
    input: 0.0005 / 1000,   // $0.50 por millón de tokens de entrada
    output: 0.0015 / 1000,  // $1.50 por millón de tokens de salida
    model: 'mistral-large-3'  // Mistral Large 3 (Dic 2, 2025) - 41B active, 675B total params
  }
};

// Saldos iniciales (en USD) - estos deben venir de una base de datos
const INITIAL_BALANCES = {
  claude: parseFloat(process.env.CLAUDE_BALANCE || '100'),
  openai: parseFloat(process.env.OPENAI_BALANCE || '100'),
  gemini: parseFloat(process.env.GEMINI_BALANCE || '100'),
  perplexity: parseFloat(process.env.PERPLEXITY_BALANCE || '100'),
  deepseek: parseFloat(process.env.DEEPSEEK_BALANCE || '100'),
  mistral: parseFloat(process.env.MISTRAL_BALANCE || '100')
};

// Password desde variable de entorno (debe estar ofuscado)
const AUTH_PASSWORD = process.env.AUTH_PASSWORD_ENCODED ? deobfuscate(process.env.AUTH_PASSWORD_ENCODED) : process.env.AUTH_PASSWORD;

module.exports = {
  API_KEYS,
  PRICING,
  INITIAL_BALANCES,
  AUTH_PASSWORD,
  deobfuscate
};