import { compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { withRateLimit, authLimiter } from '../../../lib/rate-limiter';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be defined in environment variables');
}

async function authHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { password } = req.body;

    if (!password || !process.env.AUTH_PASSWORD_ENCODED) {
      return res.status(400).json({ error: 'Password required' });
    }

    // Usar contraseña desde variable de entorno
    const AUTH_PASSWORD = Buffer.from(process.env.AUTH_PASSWORD_ENCODED, 'base64').toString('utf-8');
    const isValid = password === AUTH_PASSWORD;
    
    if (isValid) {
      // Crear token JWT
      const token = jwt.sign(
        { authorized: true, timestamp: Date.now() },
        JWT_SECRET,
        { expiresIn: '4h' }
      );
      
      res.setHeader('Set-Cookie', `admin-token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=14400`);
      return res.status(200).json({ success: true });
    } else {
      return res.status(401).json({ error: 'Invalid password' });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Apply strict rate limiting for auth endpoints
export default withRateLimit(authHandler, authLimiter);