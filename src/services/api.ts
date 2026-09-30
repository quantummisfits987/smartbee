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

// Fallback client for same-origin in case cross-port fails
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
    // If external port 5000 refused, retry same-origin /api if different
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

export async function getOllamaHealth() {
  return requestWithFallback(async (client) => {
    const res = await client.get('/health/ollama');
    return res.data;
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
    const res = await client.post('/ai/health-analysis', data, { timeout: 60000 });
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

// 9. Smart Alert & Early Warning System (Additive module)
export interface SmartAlert {
  hive_id: number;
  hive_code: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  type: string;
  message: string;
  value: string | number;
  threshold: string | number;
  conditions?: any[];
  created_at: string;
}

export async function getSmartAlerts(hiveId?: string | number): Promise<SmartAlert[]> {
  return requestWithFallback(async (client) => {
    const params = hiveId ? { hive_id: hiveId } : {};
    const res = await client.get('/alerts', { params });
    return res.data?.alerts || [];
  });
}

// 10. Hive Health Score System (Additive module)
export interface HiveHealthScore {
  hive_id: number;
  hive_code: string;
  location?: string;
  health_score: number | null;
  status: 'Healthy' | 'Needs Attention' | 'At Risk' | 'Critical' | 'No Data';
  temperature: number | null;
  humidity: number | null;
  weight: number | null;
  bee_activity: string | null;
  alert_severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | null;
  recorded_at?: string | null;
  deductions?: { rule: string; points: number }[];
}

export async function getHiveHealthScores(hiveId?: string | number): Promise<HiveHealthScore[]> {
  return requestWithFallback(async (client) => {
    const params = hiveId ? { hive_id: hiveId } : {};
    const res = await client.get('/hive-health', { params });
    return res.data?.hives || [];
  });
}

// 11. Hive Health Trends & Analytics (Additive module)
export type TrendDirection = 'increasing' | 'decreasing' | 'stable' | 'Insufficient data';

export interface HiveAnalyticsReading {
  id: number;
  hive_id: number;
  recorded_at: string;
  temperature: number;
  humidity: number;
  weight: number;
  bee_activity: 'High' | 'Normal' | 'Low' | string;
  health_score: number | null;
  health_status: string;
}

export interface HiveAnalyticsTrends {
  temperature: TrendDirection;
  humidity: TrendDirection;
  weight: TrendDirection;
  bee_activity: TrendDirection;
  health_score: TrendDirection;
  earliest?: any;
  latest?: any;
}

export interface HiveAnalyticsResponse {
  success: boolean;
  hive_id: number;
  hive_code: string;
  location?: string;
  range: '24h' | '7d' | '30d';
  count: number;
  has_data: boolean;
  message?: string | null;
  trends: HiveAnalyticsTrends;
  readings: HiveAnalyticsReading[];
}

export async function getHiveAnalytics(
  hiveId: string | number,
  range: '24h' | '7d' | '30d' = '7d'
): Promise<HiveAnalyticsResponse> {
  return requestWithFallback(async (client) => {
    const res = await client.get(`/analytics/hive/${hiveId}`, { params: { range } });
    return res.data;
  });
}

// 12. Weather-Based Smart Advisory (Additive module)
export interface WeatherAdvisory {
  type: string;
  severity: 'HIGH' | 'MEDIUM';
  message: string;
  metric?: string;
  value?: number;
}

export interface WeatherAdvisoryResponse {
  success: boolean;
  source?: string;
  weather: {
    temperature: number | null;
    humidity: number | null;
    wind_speed: number | null;
  };
  risk: 'LOW' | 'MODERATE' | 'HIGH';
  advisories: WeatherAdvisory[];
  updatedAt?: string;
  error?: string;
  message?: string;
}

export async function getWeatherAdvisory(lat?: number, lon?: number): Promise<WeatherAdvisoryResponse> {
  return requestWithFallback(async (client) => {
    const params = lat && lon ? { lat, lon } : {};
    const res = await client.get('/weather/advisory', { params });
    return res.data;
  });
}

// Backward-compatible named exports
export const fetchSystemStatus = getSystemStatus;
export const fetchHives = getHives;
export const fetchHiveById = getHive;
export const fetchRecentSensors = getRecentSensors;
export const fetchHiveSensors = getHiveSensors;
export const recordSensorReading = createSensorReading;
export const fetchWeather = getWeather;
export const fetchAiStatus = getAIStatus;
export const submitHealthAnalysis = generateHealthAnalysis;
export const fetchBatches = getBatches;
export const fetchBatchByCode = getBatch;
export const verifyHoneyBatch = verifyBatch;
export const fetchSmartAlerts = getSmartAlerts;
export const fetchHiveHealthScores = getHiveHealthScores;
export const fetchHiveAnalytics = getHiveAnalytics;
export const fetchWeatherAdvisory = getWeatherAdvisory;

export default api;
