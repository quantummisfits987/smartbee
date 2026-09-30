import express from 'express';
import { getHives, getHiveById, createHive } from '../controllers/hiveController.js';
import { getHiveSensors, getRecentSensors, addSensorReading } from '../controllers/sensorController.js';
import { getWeather } from '../controllers/weatherController.js';
import { analyzeHiveHealth, getAiStatus, getOllamaHealthHandler } from '../controllers/aiController.js';
import { getBatches, getBatchByCode, createBatch, verifyBatch } from '../controllers/batchController.js';
import { checkDatabaseConnected, query } from '../db/index.js';
import { checkOllamaStatus } from '../services/ollamaService.js';
import authRoutes from './authRoutes.js';
import { getAlerts, evaluateReadingPreview } from '../controllers/alertController.js';
import { getHiveHealth, evaluateHealthScorePreview } from '../controllers/healthScoreController.js';
import { getHiveTrends, evaluateTrendsPreview } from '../controllers/analyticsController.js';
import { getWeatherAdvisoryHandler, evaluateWeatherAdvisoryPreview } from '../controllers/weatherAdvisoryController.js';

const router = express.Router();

// 1. Health check verifying Express server
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'SmartBee Backend API',
    version: '1.0.0',
  });
});

// 1b. PostgreSQL health check endpoint
router.get('/health/db', async (req, res) => {
  let client;
  try {
    client = await (await import('../db/index.js')).pool.connect();
    const result = await client.query('SELECT NOW() AS now');
    const serverTime = result.rows[0]?.now;
    res.status(200).json({
      success: true,
      status: 'connected',
      database: process.env.DB_NAME || 'smart_beekeeping',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || '5432',
      server_time: serverTime,
      checked_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      status: 'disconnected',
      error: err.message,
      checked_at: new Date().toISOString(),
    });
  } finally {
    if (client) client.release();
  }
});

// 1c. Ollama health check endpoint
router.get('/health/ollama', getOllamaHealthHandler);

// 2. System status (real checks - never faked)
router.get('/system-status', async (req, res, next) => {
  try {
    const [isDbConnected, ollamaStatus] = await Promise.all([
      checkDatabaseConnected(),
      checkOllamaStatus(),
    ]);

    // Exact structure specified in requirements
    res.status(200).json({
      backend: 'online',
      database: isDbConnected ? 'connected' : 'disconnected',
      ollama: ollamaStatus?.available ? 'available' : 'unavailable',
    });
  } catch (error) {
    next(error);
  }
});

// 3. Hives endpoints
router.get('/hives', getHives);
router.post('/hives', createHive);
router.get('/hives/:id', getHiveById);

// 4. Sensor telemetry endpoints
router.get('/sensors/recent', getRecentSensors);
router.get('/sensors/:hiveId', getHiveSensors);
router.post('/sensors', addSensorReading);

// 5. Weather endpoint (Open-Meteo)
router.get('/weather', getWeather);
router.get('/weather/advisory', getWeatherAdvisoryHandler);
router.post('/weather/advisory/evaluate', evaluateWeatherAdvisoryPreview);

// 6. AI Health Advisory endpoints (Ollama LLM)
router.get('/ai/status', getAiStatus);
router.post('/ai/health-analysis', analyzeHiveHealth);

// 7. Honey Batches endpoints (SHA-256 Ledger)
router.get('/batches', getBatches);
router.post('/batches', createBatch);
router.get('/batches/:batchCode', getBatchByCode);

// 8. Public Consumer Verification endpoint
router.get('/verify/:batchCode', verifyBatch);

// 9. Authentication endpoints (Additive module)
router.use('/auth', authRoutes);

// 10. Smart Alert & Early Warning System endpoints (Additive module)
router.get('/alerts', getAlerts);
router.post('/alerts/evaluate', evaluateReadingPreview);

// 11. Hive Health Score endpoints (Additive module)
router.get('/hive-health', getHiveHealth);
router.post('/hive-health/evaluate', evaluateHealthScorePreview);

// 12. Hive Health Trends & Analytics endpoints (Additive module)
router.get('/analytics/hive/:hiveId', getHiveTrends);
router.post('/analytics/evaluate-trends', evaluateTrendsPreview);

export default router;
