import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/backend/config/db.ts';
import { streakRouter } from './src/backend/routes/streak.routes.ts';
import { aiRouter } from './src/backend/routes/ai.routes.ts';

async function startServer() {
  await db.connectMongo();

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Trust Cloud Run / reverse proxy headers so client IP resolution works cleanly
  app.set('trust proxy', 1);

  app.use(cors());
  app.use(express.json({ limit: '15mb' }));

  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 180,
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
    message: {
      success: false,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please wait a moment and try again.',
    },
  });

  app.use('/api', apiLimiter);
  app.use('/api', streakRouter);
  app.use('/api/ai', aiRouter);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VELoop Rewards & AI Studio Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start VELoop server:', err);
});
