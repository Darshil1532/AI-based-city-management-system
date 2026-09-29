import path from 'path';
import { app } from './server/app';
import { assertProductionReadyConfig } from './server/lib/firebaseAdmin';

const PORT = 3000;

async function startServer() {
  // Fail-fast in production if required Firebase Admin credentials are not provided
  assertProductionReadyConfig();
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use((await import('express')).default.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SmartCity Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
