import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sstechgroup_development_secret_key_2026_production_must_override';

export interface AdminPayload {
  id: number;
  email: string;
  fullName: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      admin?: AdminPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // Support both HTTP-only cookie or Bearer token header
  const authHeader = req.headers.authorization;
  const tokenFromHeader = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const tokenFromCookie = req.cookies?.sstg_token;

  const token = tokenFromHeader || tokenFromCookie;

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Authentication required to access this resource.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminPayload;
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired authentication session.' });
    return;
  }
}

export function generateToken(payload: AdminPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}
