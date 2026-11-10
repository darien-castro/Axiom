import { Request, Response, NextFunction } from 'express';
import db from '../services/databaseService';

declare global {
  namespace Express {
    interface Request {
      apiKey?: string;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  apiKey?: string;
}

/**
 * Middleware to validate session cookie, lookup apiKey in DB,
 * and attach apiKey to the request.
 * Falls back to req.body.apiKey if provided directly.
 */
export async function authenticateSession(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const sessionKey = req.session?.sessionKey;

  // 1. If session key exists in session cookie, validate it against DB
  if (sessionKey) {
    try {
      const apiKey = await db.getSessionApiKey(sessionKey);
      if (apiKey) {
        // Session cookie is valid, attach apiKey to request
        req.apiKey = apiKey;
        if (req.body && typeof req.body === 'object') {
          req.body.apiKey = apiKey;
        }
        return next();
      } else {
        // Session cookie is invalid or expired in DB
        res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
        return;
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to validate session' });
      return;
    }
  }

  // 2. Fallback: If no session cookie, check if apiKey was passed in body or headers
  const fallbackApiKey = req.body?.apiKey || (req.headers?.['x-api-key'] as string | undefined);
  if (fallbackApiKey) {
    req.apiKey = fallbackApiKey;
    return next();
  }

  // 3. Neither valid session nor apiKey provided
  res.status(401).json({ error: 'Unauthorized: Valid session cookie or API key required' });
}

export default authenticateSession;
