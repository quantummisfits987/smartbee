import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './backend/src/routes/api.js';
import { testConnection } from './backend/src/db/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(cors());
  app.use(express.json());

  // Mount SmartBee REST API
  app.use('/api', apiRouter);

  // Mount Vite development middlewares or static files
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  // Test PostgreSQL connection at startup
  await testConnection();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🐝 SmartBee server listening on http://0.0.0.0:${PORT}`);
    console.log(`📦 REST APIs active at http://localhost:${PORT}/api`);
    console.log(`🩺 DB health:          http://localhost:${PORT}/api/health/db`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting SmartBee server:', err);
  process.exit(1);
});
