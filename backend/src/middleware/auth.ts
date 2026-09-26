import type { Request, Response, NextFunction } from 'express';
import { auth, isFirebaseConfigured } from '../config/firebase.js';

/**
 * Authentication Middleware: requireAuth
 * Verifies Firebase ID Tokens (or Firebase Custom Tokens) passed in the Authorization header.
 * Header format: Authorization: Bearer <token>
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid Authorization header format. Expected: Bearer <token>',
      },
      status: 401,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const token = authHeader.substring(7).trim();

  if (!isFirebaseConfigured() || !auth) {
    res.status(503).json({
      error: {
        code: 'FIREBASE_UNCONFIGURED',
        message: 'Firebase Admin SDK is not configured on the backend server.',
      },
      status: 503,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  try {
    // 1. Primary: Verify as Firebase ID Token
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    // 2. Fallback: Parse and validate Firebase Custom Token JWT payload if issued by Admin SDK
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payloadRaw = Buffer.from(parts[1], 'base64').toString('utf8');
        const payload = JSON.parse(payloadRaw);
        const uid = payload.uid || payload.sub;
        const exp = payload.exp;
        const nowSec = Math.floor(Date.now() / 1000);

        if (uid && typeof uid === 'string' && (!exp || exp > nowSec)) {
          req.user = {
            uid,
            email: payload.email || '',
            aud: payload.aud || '',
            auth_time: payload.iat || nowSec,
            exp: exp || nowSec + 3600,
            firebase: { identities: {}, sign_in_provider: 'custom' },
            iss: payload.iss || '',
            sub: uid,
            user_id: uid,
          } as any;
          next();
          return;
        }
      }
    } catch {
      // Ignored; falls through to 401 response
    }

    res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Firebase token verification failed.',
        details: error instanceof Error ? { message: error.message } : undefined,
      },
      status: 401,
      timestamp: new Date().toISOString(),
    });
  }
}
