import axios from 'axios';

// Base URL configuration: prefer VITE_API_BASE_URL or VITE_API_URL if configured, fallback to '/api' for same-origin
const rawApiUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '/api';
const API_BASE_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : (rawApiUrl === '/' ? '/api' : `${rawApiUrl.replace(/\/$/, '')}/api`);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

const localFallbackApi = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

async function requestWithFallback<T>(fn: (client: typeof api) => Promise<T>): Promise<T> {
  try {
    return await fn(api);
  } catch (err: any) {
    if (API_BASE_URL !== '/api' && (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error'))) {
      try {
        return await fn(localFallbackApi);
      } catch {
        throw err;
      }
    }
    throw err;
  }
}

// 1. System Status
export async function getSystemStatus() {
  return requestWithFallback(async (client) => {
    const res = await client.get('/system-status');
    return res.data;
  });
}

// 2. Hives
export async function getHives() {
  return requestWithFallback(async (client) => {
    const res = await client.get('/hives');
    return res.data?.data || res.data?.hives || [];
  });
}

export async function getHive(id: string | number) {
  return requestWithFallback(async (client) => {
    const res = await client.get(`/hives/${id}`);
    return res.data?.data || res.data?.hive;
  });
}

export async function createHive(data: { hive_code: string; location: string; status?: string }) {
  return requestWithFallback(async (client) => {
    const res = await client.post('/hives', data);
    return res.data?.data || res.data?.hive;
  });
}

// 3. Sensors
export async function getRecentSensors(limit = 10) {
  return requestWithFallback(async (client) => {
    const res = await client.get(`/sensors/recent?limit=${limit}`);
    return res.data?.data || res.data?.readings || [];
  });
}

export async function getHiveSensors(hiveId: string | number) {
  return requestWithFallback(async (client) => {
    const res = await client.get(`/sensors/${hiveId}`);
    return res.data?.data || res.data?.readings || [];
  });
}

export async function createSensorReading(data: {
  hive_id: number | string;
  temperature?: number;
  humidity?: number;
  weight?: number;
  bee_activity?: 'High' | 'Normal' | 'Low' | string;
  is_simulation?: boolean;
}) {
  return requestWithFallback(async (client) => {
    const res = await client.post('/sensors', data);
    return res.data?.data || res.data?.reading || res.data;
  });
}

// 4. Weather
export async function getWeather(lat?: number, lon?: number) {
  return requestWithFallback(async (client) => {
    const params = lat && lon ? `?lat=${lat}&lon=${lon}` : '';
    const res = await client.get(`/weather${params}`);
    return res.data?.data || res.data;
  });
}

// 5. AI Health Status & Analysis
export async function getAIStatus() {
  return requestWithFallback(async (client) => {
    const res = await client.get('/ai/status');
    return res.data?.data || res.data;
  });
}

export async function generateHealthAnalysis(data: {
  hive_id: number | string;
  mite_count: 'Low' | 'Medium' | 'High';
  bee_activity: 'Normal' | 'Low';
  brood_pattern: 'Normal' | 'Irregular';
  dead_bees: number;
}) {
  return requestWithFallback(async (client) => {
    const res = await client.post('/ai/health-analysis', data);
    return res.data?.data || res.data?.advisory || res.data;
  });
}

// 6. Honey Batches & Traceability
export async function getBatches() {
  return requestWithFallback(async (client) => {
    const res = await client.get('/batches');
    return res.data?.data || res.data?.batches || [];
  });
}

export async function createBatch(data: {
  batch_code: string;
  hive_id: number | string;
  harvest_date: string;
  quantity: number;
  location: string;
}) {
  return requestWithFallback(async (client) => {
    const res = await client.post('/batches', data);
    return res.data?.data || res.data?.batch;
  });
}

export async function getBatch(batchCode: string) {
  return requestWithFallback(async (client) => {
    const res = await client.get(`/batches/${encodeURIComponent(batchCode)}`);
    return res.data?.data || res.data?.batch;
  });
}

export async function verifyBatch(batchCode: string) {
  return requestWithFallback(async (client) => {
    const res = await client.get(`/verify/${encodeURIComponent(batchCode)}`);
    return res.data;
  });
}

export default api;
