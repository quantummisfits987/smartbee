import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';

dotenv.config();

const app = express();

// Middleware
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
  : process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((url) => url.trim())
  : '*';

app.use(
  cors({
    origin: allowedOrigins === '*' ? '*' : allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());

// API Routes
app.use('/api', apiRouter);

// Root informational endpoint
app.get('/', (req, res, next) => {
  if (req.app.get('isFullStackDev')) {
    return next();
  }
  res.status(200).json({
    success: true,
    message: 'SmartBee – Smart Beekeeping & Honey Traceability System Backend',
    documentation: 'See README.md for endpoint specifications',
  });
});

// 404 handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint '${req.originalUrl}' not found`,
  });
});

// Centralized basic error handling middleware
app.use((err, req, res, next) => {
  console.error('[Backend Error]', err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
  });
});

export default app;
