import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load backend/.env first, then fall back to root .env
// This covers both: running backend standalone AND via the unified server.ts
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });   // root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });      // backend/.env (wins if present)

const { Pool } = pg;

// PostgreSQL connection config — support DATABASE_URL for Render production or individual params for local dev
const useConnectionString = !!process.env.DATABASE_URL;

const dbConfig = useConnectionString
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 20,
    }
  : {
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME     || 'smart_beekeeping',
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || '',
      ssl:      process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis:       10000,
      max:                     20,
    };

// Real PostgreSQL connection pool
export const pool = new Pool(dbConfig);

// Pool-level error listener — prevents unhandled error crashes
pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]:', err.message);
});

/**
 * Runs SELECT NOW() to confirm PostgreSQL is reachable.
 * Called once at server startup. Logs success or failure clearly.
 */
export async function testConnection() {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT NOW() AS now');
    const serverTime = result.rows[0]?.now;
    console.log('✅ [PostgreSQL] Connected successfully.');
    if (useConnectionString) {
      console.log(`   Database : Connected via DATABASE_URL`);
    } else {
      console.log(`   Host     : ${dbConfig.host}:${dbConfig.port}`);
      console.log(`   Database : ${dbConfig.database}`);
    }
    console.log(`   Server   : ${serverTime}`);
  } catch (err) {
    console.error('❌ [PostgreSQL] Connection FAILED:', err.message);
    if (!useConnectionString) {
      console.error(`   Host     : ${dbConfig.host}:${dbConfig.port}`);
      console.error(`   Database : ${dbConfig.database}`);
    }
    console.error('   Hint: Ensure PostgreSQL is running and the .env variables or DATABASE_URL are correct.');
    // Non-fatal at startup — server still boots; individual requests will surface 503s
  } finally {
    if (client) client.release();
  }
}

/**
 * Simple boolean check — used by /api/system-status and /api/health/db
 */
export async function checkDatabaseConnected() {
  let client;
  try {
    client = await pool.connect();
    await client.query('SELECT 1');
    return true;
  } catch {
    return false;
  } finally {
    if (client) client.release();
  }
}

/**
 * Executes a parameterised PostgreSQL query via the pool.
 * Converts connection-level errors to a clear DATABASE_UNAVAILABLE 503.
 */
export async function query(text, params = []) {
  try {
    return await pool.query(text, params);
  } catch (err) {
    console.error(`[PostgreSQL Query Error]: ${err.message}`);
    if (
      err.code === 'ECONNREFUSED' ||
      err.code === 'ETIMEDOUT'    ||
      err.code === '57P01'        || // admin_shutdown
      err.code === '57P02'        || // crash_shutdown
      err.code === '57P03'        || // cannot_connect_now
      err.message.includes('Connection terminated') ||
      err.message.includes('connect ECONNREFUSED')
    ) {
      const dbErr = new Error(
        'Database is disconnected or unavailable. Please ensure PostgreSQL is running.'
      );
      dbErr.statusCode = 503;
      dbErr.code = 'DATABASE_UNAVAILABLE';
      throw dbErr;
    }
    throw err;
  }
}
