import { query } from '../db/index.js';
import { calculateHealthScore } from './healthScoreService.js';

/**
 * Hive Health Trends & Analytics Service
 * Computes deterministic historical trends from PostgreSQL telemetry
 *
 * Tolerances:
 * - Temperature: ±0.5°C
 * - Humidity: ±2.0%
 * - Hive Weight: ±0.5 kg
 * - Bee Activity: Low (1) -> Normal (2) -> High (3)
 * - Health Score: uses calculateHealthScore from healthScoreService.js
 */

const ACTIVITY_MAP = {
  Low: 1,
  Normal: 2,
  High: 3,
};

export function calculateTrends(readings = []) {
  if (!Array.isArray(readings) || readings.length < 2) {
    return {
      temperature: 'Insufficient data',
      humidity: 'Insufficient data',
      weight: 'Insufficient data',
      bee_activity: 'Insufficient data',
      health_score: 'Insufficient data',
      earliest: readings[0] || null,
      latest: readings[0] || null,
    };
  }

  const earliest = readings[0];
  const latest = readings[readings.length - 1];

  // 1. Temperature Trend (Tolerance ±0.5°C)
  const eTemp = parseFloat(earliest.temperature);
  const lTemp = parseFloat(latest.temperature);
  let tempTrend = 'stable';
  if (!isNaN(eTemp) && !isNaN(lTemp)) {
    const diff = lTemp - eTemp;
    if (diff > 0.5) tempTrend = 'increasing';
    else if (diff < -0.5) tempTrend = 'decreasing';
    else tempTrend = 'stable';
  } else {
    tempTrend = 'Insufficient data';
  }

  // 2. Humidity Trend (Tolerance ±2.0%)
  const eHum = parseFloat(earliest.humidity);
  const lHum = parseFloat(latest.humidity);
  let humTrend = 'stable';
  if (!isNaN(eHum) && !isNaN(lHum)) {
    const diff = lHum - eHum;
    if (diff > 2.0) humTrend = 'increasing';
    else if (diff < -2.0) humTrend = 'decreasing';
    else humTrend = 'stable';
  } else {
    humTrend = 'Insufficient data';
  }

  // 3. Hive Weight Trend (Tolerance ±0.5 kg)
  const eWeight = parseFloat(earliest.weight);
  const lWeight = parseFloat(latest.weight);
  let weightTrend = 'stable';
  if (!isNaN(eWeight) && !isNaN(lWeight)) {
    const diff = lWeight - eWeight;
    if (diff > 0.5) weightTrend = 'increasing';
    else if (diff < -0.5) weightTrend = 'decreasing';
    else weightTrend = 'stable';
  } else {
    weightTrend = 'Insufficient data';
  }

  // 4. Bee Activity Trend (Low=1, Normal=2, High=3)
  const eActVal = ACTIVITY_MAP[earliest.bee_activity] || 2;
  const lActVal = ACTIVITY_MAP[latest.bee_activity] || 2;
  let actTrend = 'stable';
  if (lActVal > eActVal) actTrend = 'increasing';
  else if (lActVal < eActVal) actTrend = 'decreasing';
  else actTrend = 'stable';

  // 5. Health Score Trend (Uses existing calculateHealthScore)
  const eScoreObj = earliest.health_score !== undefined ? earliest : calculateHealthScore(earliest);
  const lScoreObj = latest.health_score !== undefined ? latest : calculateHealthScore(latest);
  const eScore = eScoreObj.health_score;
  const lScore = lScoreObj.health_score;

  let healthTrend = 'stable';
  if (eScore === null || lScore === null || isNaN(eScore) || isNaN(lScore)) {
    healthTrend = 'Insufficient data';
  } else if (lScore > eScore) {
    healthTrend = 'increasing';
  } else if (lScore < eScore) {
    healthTrend = 'decreasing';
  } else {
    healthTrend = 'stable';
  }

  return {
    temperature: tempTrend,
    humidity: humTrend,
    weight: weightTrend,
    bee_activity: actTrend,
    health_score: healthTrend,
    earliest: {
      temperature: eTemp,
      humidity: eHum,
      weight: eWeight,
      bee_activity: earliest.bee_activity,
      health_score: eScore,
      recorded_at: earliest.recorded_at,
    },
    latest: {
      temperature: lTemp,
      humidity: lHum,
      weight: lWeight,
      bee_activity: latest.bee_activity,
      health_score: lScore,
      recorded_at: latest.recorded_at,
    },
  };
}

/**
 * Retrieve chronological readings for a hive from PostgreSQL within given time range
 * Valid ranges: '24h', '7d', '30d' (default: '7d')
 */
export async function getHiveAnalytics(hiveId, range = '7d') {
  // Validate hive exists
  const hiveResult = await query('SELECT id, hive_code, location FROM hives WHERE id = $1', [hiveId]);
  if (hiveResult.rows.length === 0) {
    const error = new Error(`Hive with ID ${hiveId} not found`);
    error.statusCode = 404;
    throw error;
  }
  const hive = hiveResult.rows[0];

  let intervalStr = '7 days';
  if (range === '24h') intervalStr = '24 hours';
  else if (range === '30d') intervalStr = '30 days';
  else intervalStr = '7 days';

  const sql = `
    SELECT
      sr.id,
      sr.hive_id,
      sr.temperature,
      sr.humidity,
      sr.weight,
      sr.bee_activity,
      sr.recorded_at,
      h.hive_code,
      h.location AS hive_location
    FROM sensor_readings sr
    JOIN hives h ON sr.hive_id = h.id
    WHERE sr.hive_id = $1
      AND sr.recorded_at >= NOW() - $2::interval
    ORDER BY sr.recorded_at ASC;
  `;

  const result = await query(sql, [hiveId, intervalStr]);
  const rawRows = result.rows;

  // Augment each reading with its deterministic health score
  const enrichedReadings = rawRows.map((r) => {
    const health = calculateHealthScore(r);
    return {
      id: r.id,
      hive_id: r.hive_id,
      recorded_at: r.recorded_at,
      temperature: parseFloat(r.temperature),
      humidity: parseFloat(r.humidity),
      weight: parseFloat(r.weight),
      bee_activity: r.bee_activity,
      health_score: health.health_score,
      health_status: health.status,
    };
  });

  const trends = calculateTrends(enrichedReadings);

  return {
    success: true,
    hive_id: parseInt(hiveId, 10),
    hive_code: hive.hive_code,
    location: hive.location,
    range,
    count: enrichedReadings.length,
    has_data: enrichedReadings.length > 0,
    message: enrichedReadings.length === 0 ? 'No historical sensor data available for this hive.' : null,
    trends,
    readings: enrichedReadings,
  };
}
