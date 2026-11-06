import { app, initFirebaseAdmin } from '../src/server/apiApp';

try {
  initFirebaseAdmin();
} catch (e) {
  console.warn('[Vercel Serverless] Firebase Admin initialization note:', e);
}

export default function handler(req: any, res: any) {
  try {
    // Normalize req.url so Express routes matching /api/* work consistently
    if (req.url) {
      if (req.query && req.query.path) {
        const pathParam = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
        const urlParts = req.url.split('?');
        const search = urlParts[1] ? `?${urlParts[1]}` : '';
        req.url = `/api/${pathParam}${search}`;
      } else if (!req.url.startsWith('/api')) {
        req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
      }
    }

    return app(req, res);
  } catch (err: any) {
    console.error('[Vercel Serverless] Uncaught handler error:', err);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: err?.message || 'Internal Server Error in API handler',
      });
    }
  }
}
