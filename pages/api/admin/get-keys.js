import { promises as fs } from 'fs';
import path from 'path';
import { decrypt, maskAPIKey } from '../../../lib/crypto-utils';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be defined in environment variables');
}
const KEYS_FILE = path.join(process.cwd(), '.api-keys.json');

// Middleware para verificar autenticación
function verifyAuth(req) {
  const token = req.cookies?.['admin-token'];
  if (!token) return false;
  
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (!verifyAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Intentar leer el archivo de keys
    let keys = {};
    try {
      const data = await fs.readFile(KEYS_FILE, 'utf8');
      const encrypted = JSON.parse(data);
      
      // Desencriptar cada key
      for (const [provider, encryptedKey] of Object.entries(encrypted)) {
        if (encryptedKey) {
          keys[provider] = maskAPIKey(decrypt(encryptedKey));
        }
      }
    } catch (error) {
      // Si no existe el archivo, devolver objeto vacío
      console.log('No keys file found, returning empty object');
    }

    return res.status(200).json({ keys });
  } catch (error) {
    console.error('Error loading keys:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}