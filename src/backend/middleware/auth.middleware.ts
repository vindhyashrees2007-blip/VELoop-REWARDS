import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.ts';
import { IUser } from '../models/schemas.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'veloop_super_secret_jwt_signing_key_dev_2026';

export interface AuthenticatedRequest extends Request {
  authUser?: IUser;
  authUserId?: string;
}

export function signUserToken(user: IUser): string {
  return jwt.sign(
    {
      sub: user.userId,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      code: 'AUTH_REQUIRED',
      message: 'Please log in to continue.',
    });
    return;
  }

  const token = authHeader.slice(7).trim();
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; email: string; name: string };
    const collections = db.getCollections();
    const user = collections.users.find((u) => u.userId === decoded.sub);

    if (!user) {
      res.status(401).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'Please log in to continue.',
      });
      return;
    }

    // Section 44, 45, 100: Anti-Cross-User Attack & Ownership Manipulation Check
    const clientProvidedUserId =
      (req.body && typeof req.body.userId === 'string' ? req.body.userId : undefined) ||
      (req.query && typeof req.query.userId === 'string' ? req.query.userId : undefined);

    if (clientProvidedUserId && clientProvidedUserId !== user.userId) {
      const nowIso = new Date(Date.now() + (user.serverTimeOffsetMs || 0)).toISOString();
      collections.auditLogs.push({
        logId: `AUD_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        userId: user.userId,
        eventType: 'INVALID_CLAIM',
        reason: `Cross-user ownership manipulation blocked: JWT user ${user.userId} attempted to act as ${clientProvidedUserId}.`,
        payloadSnapshot: { bodyUserId: clientProvidedUserId, jwtUserId: user.userId },
        serverTimestamp: nowIso,
      });
      void db.commit();

      res.status(403).json({
        success: false,
        code: 'CROSS_USER_FORBIDDEN',
        message: 'Unauthorized ownership manipulation rejected. Identity is derived strictly from your JWT session.',
      });
      return;
    }

    req.authUser = user;
    req.authUserId = user.userId;
    next();
  } catch {
    res.status(401).json({
      success: false,
      code: 'INVALID_TOKEN',
      message: 'Please log in to continue.',
    });
  }
}
