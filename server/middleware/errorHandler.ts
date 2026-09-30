import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  // Log technical diagnostic details server-side
  console.error(`[Server Error] [${req.method} ${req.url}]:`, err?.stack || err?.message || err);

  const status = typeof err?.status === 'number' ? err.status : 500;
  const code = err?.code || (status === 400 ? 'INVALID_REQUEST' : status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR');

  return res.status(status).json({
    error: err?.message || 'An internal server error occurred.',
    code,
  });
}
