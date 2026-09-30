import express from 'express';
import dotenv from 'dotenv';
import { aiRouter } from './routes/aiRoutes';
import { civicApiRouter } from './routes/civicApiRoutes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

export function createApp() {
  const app = express();

  // Body parser with size limit protection
  app.use(express.json({ limit: '64kb' }));

  // Mount API routers (both /api and root to guarantee matching on Vercel rewrites)
  app.use('/api', aiRouter);
  app.use('/api', civicApiRouter);
  app.use(aiRouter);
  app.use(civicApiRouter);

  // Global error handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
