import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import app from './app.js';
import { testConnection } from './db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env: backend/.env wins over root .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });  // root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });        // backend/.env (higher priority)

const PORT = process.env.PORT || 5000;

async function startServer() {
  // Test PostgreSQL connection before accepting traffic
  await testConnection();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🐝 SmartBee Backend running on http://0.0.0.0:${PORT}`);
    console.log(`📡 REST API mounted at http://localhost:${PORT}/api`);
    console.log(`🔍 Verification endpoint: http://localhost:${PORT}/api/verify/:batchCode`);
    console.log(`🩺 DB health endpoint:    http://localhost:${PORT}/api/health/db`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting SmartBee backend:', err);
  process.exit(1);
});
