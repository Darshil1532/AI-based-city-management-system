import { app } from './app';

/**
 * Authoritative Serverless Handler for Vercel
 * 
 * Guarantees:
 * 1. Standard (req, res) function signature required by Vercel Node runtime.
 * 2. URL path normalization: handles rewrites where Vercel forwards /api/(.*) to /api/index.js.
 * 3. Top-level error containment preventing FUNCTION_INVOCATION_FAILED.
 */
export default function handler(req: any, res: any) {
  try {
    // If Vercel edge rewrite forwarded the request to /api/index.js,
    // restore the intended endpoint from x-matched-path or originalUrl
    const matchedPath = req.headers?.['x-matched-path'];
    if (matchedPath && typeof matchedPath === 'string' && !matchedPath.includes('index.js')) {
      req.url = matchedPath;
    } else if (req.url && (req.url === '/api/index.js' || req.url.startsWith('/api/index.js'))) {
      req.url = req.url.replace('/api/index.js', '') || '/';
    }

    return app(req, res);
  } catch (err: any) {
    console.error('[Vercel API Handler Fatal Error]:', err);
    if (!res.headersSent) {
      res.status(500).json({
        error: err?.message || 'Internal Server Error',
        code: 'INTERNAL_SERVERLESS_ERROR',
      });
    }
  }
}
