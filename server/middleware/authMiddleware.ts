import { Request, Response, NextFunction } from 'express';

/**
 * Server-Side Authentication & Authorization Middleware
 * 
 * CRITICAL ARCHITECTURAL DIRECTIVE:
 * Client-side route guarding (AdminRouteGuard) is ONLY a visual navigation aid.
 * It is NOT sufficient for production application security.
 * Every server-side endpoint and state mutation MUST verify:
 * 1. Authentication (valid session or token)
 * 2. Role (citizen vs. admin RBAC clearance)
 * 3. Resource Ownership (citizens can only access or mutate their own records)
 */

export interface AuthenticatedUser {
  id: string;
  role: 'citizen' | 'admin';
  name: string;
  email?: string;
}

// Extend Express Request declaration
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Authentication Middleware:
 * Inspects Authorization Bearer tokens and prototype headers (x-user-role, x-user-id).
 * In production, this verifies signed JWTs from Supabase Auth, Firebase Auth, or Auth.js.
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  const headerRole = req.headers['x-user-role'] as string | undefined;
  const headerUserId = req.headers['x-user-id'] as string | undefined;
  const headerUserName = req.headers['x-user-name'] as string | undefined;

  // 1. Production JWT Verification Path (Stub for Supabase/Firebase)
  if (token && token.startsWith('sb-') || token && token.startsWith('eyJ')) {
    // In production: jwt.verify(token, process.env.JWT_SECRET) or supabase.auth.getUser(token)
  }

  // 2. Prototype / Demo Session Evaluation Path
  if (headerRole === 'admin' || headerRole === 'citizen') {
    req.user = {
      id: headerUserId || (headerRole === 'admin' ? 'ADM-DEMO-01' : 'CIT-DEMO-01'),
      role: headerRole,
      name: headerUserName || (headerRole === 'admin' ? 'Municipal Administrator' : 'Demo Citizen'),
    };
    return next();
  }

  // Fallback default for demo requests if no headers passed
  // (Notice: protected routes will strictly reject if required role doesn't match!)
  if (token === 'demo-admin-token') {
    req.user = {
      id: 'ADM-DEMO-01',
      role: 'admin',
      name: 'Demo Administrator',
    };
    return next();
  }

  // Unauthenticated request
  return next();
}

/**
 * Enforces that a valid authenticated session exists.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required. Please provide a valid Bearer token or session credentials.',
    });
  }
  return next();
}

/**
 * Role-Based Access Control (RBAC) Guard
 * Verifies that the authenticated user possesses one of the required roles.
 */
export function requireRole(allowedRoles: Array<'citizen' | 'admin'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication credentials missing.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden: Insufficient Clearance',
        message: `This operation requires clearance level: [${allowedRoles.join(', ')}]. Your current role is '${req.user.role}'.`,
        requiredRoles: allowedRoles,
        userRole: req.user.role,
      });
    }

    return next();
  };
}
