import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'smartbee-jwt-default-development-secret-key-2026';
const JWT_EXPIRES_IN = '24h';

// Basic email regex validator
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Register a new user
 * POST /api/auth/register
 */
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    // 1. Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields (name, email, password) are required.',
      });
    }

    const trimmedName = String(name).trim();
    const trimmedEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password);

    if (trimmedName.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Full Name must be at least 2 characters.',
      });
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    if (cleanPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // 2. Check if email already registered in PostgreSQL
    const existingResult = await query(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      [trimmedEmail]
    );

    if (existingResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // 3. Hash password using bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(cleanPassword, saltRounds);

    // 4. Insert into PostgreSQL
    const insertResult = await query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [trimmedName, trimmedEmail, passwordHash]
    );

    const newUser = insertResult.rows[0];

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please log in.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        created_at: newUser.created_at,
      },
    });
  } catch (error) {
    if (error.code === 'DATABASE_UNAVAILABLE' || error.statusCode === 503) {
      return res.status(503).json({
        success: false,
        message: 'Unable to process request. Database is unavailable. Please try again.',
      });
    }
    // Handle Postgres unique constraint violation
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
    }
    next(error);
  }
}

/**
 * Login user
 * POST /api/auth/login
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password);

    // 1. Find user by email in PostgreSQL
    const userResult = await query(
      'SELECT id, name, email, password_hash, created_at FROM users WHERE email = $1 LIMIT 1',
      [trimmedEmail]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const user = userResult.rows[0];

    // 2. Compare password with bcrypt hash
    const passwordMatch = await bcrypt.compare(cleanPassword, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // 3. Generate JWT
    const payload = {
      userId: user.id,
      email: user.email,
      name: user.name,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // 4. Return token and user info (NEVER return password_hash)
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    if (error.code === 'DATABASE_UNAVAILABLE' || error.statusCode === 503) {
      return res.status(503).json({
        success: false,
        message: 'Unable to process request. Database is unavailable. Please try again.',
      });
    }
    next(error);
  }
}

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
export async function getMe(req, res, next) {
  try {
    const userId = req.user.userId;

    const userResult = await query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1 LIMIT 1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const user = userResult.rows[0];

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    if (error.code === 'DATABASE_UNAVAILABLE' || error.statusCode === 503) {
      return res.status(503).json({
        success: false,
        message: 'Unable to process request. Database is unavailable. Please try again.',
      });
    }
    next(error);
  }
}
