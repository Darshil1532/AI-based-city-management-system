import { Request, Response, NextFunction } from 'express';
import firebaseConfig from '../../firebase-applet-config.json';
import { verifyFirebaseIdToken } from '../lib/firebaseAdmin';

/**
 * Server-Side Authentication & Authorization Middleware
 * 
 * ARCHITECTURAL DIRECTIVE:
 * The server is the authoritative security boundary.
 * Headers like `x-user-role` are NOT trusted as production identity.
 * A client cannot escalate privileges simply by spoofing headers.
 */

export interface AuthenticatedUser {
  id: string;
  role: 'citizen' | 'admin';
  name: string;
  email?: string;
  isDemo: boolean;
  authProvider: 'firebase' | 'demo';
}

// Extend Express Request declaration
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// Pre-defined demo credentials - strictly isolated
const KNOWN_DEMO_TOKENS: Record<string, AuthenticatedUser> = {
  'demo-admin-token': {
    id: 'ADM-DEMO-01',
    role: 'admin',
    name: 'Demo Municipal Officer',
    email: 'admin.demo@smartcity.gov.in',
    isDemo: true,
    authProvider: 'demo',
  },
  'demo-citizen-token': {
    id: 'CIT-DEMO-01',
    role: 'citizen',
    name: 'Demo Citizen',
    email: 'citizen.demo@smartcity.local',
    isDemo: true,
    authProvider: 'demo',
  },
};

// Known administrative emails
const ADMIN_EMAILS = new Set([
  'darshiljha1532@gmail.com',
  'admin.demo@smartcity.gov.in',
  'officer.demo@smartcity.gov.in',
]);

/**
 * Checks if demo persona authentication is permitted in the current environment.
 * Strictly disabled in production unless ALLOW_DEMO_AUTH is explicitly set to 'true'.
 */
export function isDemoAuthAllowed(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return process.env.ALLOW_DEMO_AUTH === 'true';
  }
  if (process.env.ALLOW_DEMO_AUTH === 'false') return false;
  return true;
}

/**
 * Parses and verifies tokens.
 * Supports:
 * 1. Cryptographically verified Firebase Auth ID Token (RS256 via Firebase Admin)
 * 2. Explicit demo tokens ONLY when demo auth is enabled (non-production or ALLOW_DEMO_AUTH=true)
 * 
 * Unverified JWT payloads and header spoofing are strictly rejected.
 */
export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;

    // 1. Check isolated Demo Tokens (ONLY if demo auth is permitted)
    if (token && KNOWN_DEMO_TOKENS[token]) {
      if (!isDemoAuthAllowed()) {
        return res.status(401).json({
          error: 'Unauthorized',
          code: 'DEMO_AUTH_DISABLED',
          message: 'Demo credentials are disabled in production environments.',
        });
      }
      req.user = { ...KNOWN_DEMO_TOKENS[token] };
      return next();
    }

    // 2. Firebase ID Token Verification - Cryptographic signature verification
    if (token && token.includes('.')) {
      try {
        const decoded = await verifyFirebaseIdToken(token);
        const email = decoded.email || '';
        const isAdminUser = ADMIN_EMAILS.has(email) || (decoded as any).admin === true;

        req.user = {
          id: decoded.uid || decoded.sub,
          role: isAdminUser ? 'admin' : 'citizen',
          name: decoded.name || (isAdminUser ? 'Municipal Officer' : 'Citizen Resident'),
          email,
          isDemo: false,
          authProvider: 'firebase',
        };
        return next();
      } catch (jwtErr: any) {
        console.warn('[AuthMiddleware] Cryptographic JWT verification failed:', jwtErr?.message || jwtErr);
        return res.status(401).json({
          error: 'Unauthorized',
          code: 'INVALID_TOKEN',
          message: 'Cryptographic token verification failed. Invalid or forged token signature.',
        });
      }
    }

    // 3. Isolated Demo Fallback Headers (Strictly forbidden in production)
    const demoApiKey = req.headers['x-demo-access-key'];
    const headerUserId = req.headers['x-user-id'] as string | undefined;

    if (
      process.env.NODE_ENV !== 'production' &&
      demoApiKey === 'smartcity-demo-key-v1' &&
      headerUserId &&
      isDemoAuthAllowed()
    ) {
      if (headerUserId.startsWith('ADM-')) {
        req.user = {
          id: headerUserId,
          role: 'admin',
          name: 'Demo Municipal Officer',
          email: 'admin.demo@smartcity.gov.in',
          isDemo: true,
          authProvider: 'demo',
        };
        return next();
      } else {
        req.user = {
          id: headerUserId,
          role: 'citizen',
          name: 'Demo Citizen',
          email: 'citizen.demo@smartcity.local',
          isDemo: true,
          authProvider: 'demo',
        };
        return next();
      }
    }

    // Unauthenticated request
    return next();
  } catch (err) {
    return next(err);
  }
}

/**
 * Enforces that a valid authenticated session exists.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      code: 'UNAUTHORIZED',
      message: 'Authentication required. Please provide a valid Bearer token.',
    });
  }
  return next();
}

/**
 * Role-Based Access Control (RBAC) Guard
 */
export function requireRole(allowedRoles: Array<'citizen' | 'admin'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
        message: 'Authentication credentials missing.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden: Insufficient Clearance',
        code: 'FORBIDDEN',
        message: `This operation requires clearance level: [${allowedRoles.join(', ')}]. Your current role is '${req.user.role}'.`,
        requiredRoles: allowedRoles,
        userRole: req.user.role,
      });
    }

    return next();
  };
}
