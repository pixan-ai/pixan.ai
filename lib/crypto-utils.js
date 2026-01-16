const crypto = require('crypto');

// Clave de encriptación (DEBE venir de variables de entorno)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be defined in environment variables and be exactly 32 characters');
}
const IV_LENGTH = 16;

// Función para encriptar API keys
function encrypt(text) {
  if (!text) return '';
  
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(ENCRYPTION_KEY, 'utf-8'),
      iv
    );
    
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (error) {
    console.error('Error encrypting:', error);
    return '';
  }
}

// Función para desencriptar API keys
function decrypt(text) {
  if (!text) return '';
  
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(ENCRYPTION_KEY, 'utf-8'),
      iv
    );
    
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString();
  } catch (error) {
    console.error('Error decrypting:', error);
    return '';
  }
}

// Función para ofuscar (base64) - menos seguro pero útil para ciertos casos
function obfuscate(text) {
  if (!text) return '';
  return Buffer.from(text).toString('base64');
}

// Función para desofuscar (base64)
function deobfuscate(text) {
  if (!text) return '';
  try {
    return Buffer.from(text, 'base64').toString('utf-8');
  } catch {
    return '';
  }
}

// Función para verificar si una API key parece válida
function isValidAPIKey(provider, key) {
  if (!key) return false;
  
  const patterns = {
    openai: /^sk-.+$/,
    claude: /^sk-ant-.+$/,
    gemini: /^[a-zA-Z0-9_-]+$/,
    deepseek: /^sk-.+$/,
    mistral: /^[a-zA-Z0-9]+$/,
    perplexity: /^pplx-.+$/
  };
  
  // Si no hay patrón específico, solo verificar longitud mínima
  if (!patterns[provider]) {
    return key.length >= 20;
  }
  
  return patterns[provider].test(key);
}

// Función para enmascarar API key para mostrar
function maskAPIKey(key) {
  if (!key || key.length < 8) return '****';
  
  const start = key.substring(0, 4);
  const end = key.substring(key.length - 4);
  const middle = '*'.repeat(Math.min(key.length - 8, 20));
  
  return `${start}${middle}${end}`;
}

module.exports = {
  encrypt,
  decrypt,
  obfuscate,
  deobfuscate,
  isValidAPIKey,
  maskAPIKey,
  ENCRYPTION_KEY
};