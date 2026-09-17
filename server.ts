import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './src/server/api';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Mount API router FIRST before Vite middlewares
  app.use('/api', apiRouter);

  // Serve static assets from public/images directly
  app.use('/images', express.static(path.join(process.cwd(), 'public/images')));

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Start server-side Keep-alive self-ping
  // Render free tier spins down after 15 minutes of inactivity.
  // We ping our own public URL every 10 minutes to reset the timer.
  const EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL || 'https://angusshopx.onrender.com';
  setInterval(() => {
    fetch(`${EXTERNAL_URL}/api/health`)
      .then(res => console.log(`[Keep-Alive] Pinged ${EXTERNAL_URL}: ${res.status}`))
      .catch(err => console.error(`[Keep-Alive] Ping failed:`, err.message));
  }, 10 * 60 * 1000); // 10 minutes

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AngusShop Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
