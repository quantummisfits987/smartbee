import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Public Authentication Routes
 */
router.post('/register', register);
router.post('/login', login);

/**
 * Protected Profile Route (Demonstrates authMiddleware)
 */
router.get('/me', authenticateToken, getMe);

export default router;
