import { query } from '../db/index.js';
import { evaluateSensorReading } from './alertService.js';

/**
 * Hive Health Score Service
 * Deterministic scoring engine (0-100) based on latest sensor telemetry
 * and existing Smart Alert rule evaluations.
 *
 * Scoring Rules (Start at 100):
 * - Temperature:
 *     25°C to 38°C: -0
 *     < 25°C: -10
 *     > 38°C: -15
 * - Humidity:
 *     40% to 80%: -0
 *     < 40%: -5
 *     > 80%: -10
 * - Bee Activity:
 *     "High": -0
 *     "Normal": -5
 *     "Low": -15
 * - Hive Weight:
 *     >= 20 kg: -0
 *     < 20 kg: -10
 * - Smart Alert Impact:
 *     CRITICAL: -20 (applied once for multiple abnormal conditions; no double-counting individual alerts)
 *
 * Status Mapping:
 *   80 - 100: "Healthy"
 *   60 - 79:  "Needs Attention"
 *   40 - 59:  "At Risk"
 *   0  - 39:  "Critical"
 */

export function calculateHealthScore(reading, options = {}) {
  if (
    !reading ||
    reading.temperature === null ||
    reading.temperature === undefined ||
    reading.humidity === null ||
    reading.humidity === undefined
  ) {
    return {
      health_score: null,
      status: 'No Data',
      temperature: null,
      humidity: null,
      weight: null,
      bee_activity: null,
      alert_severity: null,
      deductions: [],
    };
  }

  const temp = parseFloat(reading.temperature);
  const humidity = parseFloat(reading.humidity);
  const weight = reading.weight !== null && reading.weight !== undefined ? parseFloat(reading.weight) : null;
  const activity = reading.bee_activity;

  let score = 100;
  const deductions = [];

  // 1. Temperature
  if (temp < 25) {
    score -= 10;
    deductions.push({ rule: 'Low Temperature (< 25°C)', points: -10 });
  } else if (temp > 38) {
    score -= 15;
    deductions.push({ rule: 'High Temperature (> 38°C)', points: -15 });
  }

  // 2. Humidity
  if (humidity < 40) {
    score -= 5;
    deductions.push({ rule: 'Low Humidity (< 40%)', points: -5 });
  } else if (humidity > 80) {
    score -= 10;
    deductions.push({ rule: 'High Humidity (> 80%)', points: -10 });
  }

  // 3. Bee Activity
  if (activity === 'Normal') {
    score -= 5;
    deductions.push({ rule: 'Normal Bee Activity', points: -5 });
  } else if (activity === 'Low') {
    score -= 15;
    deductions.push({ rule: 'Low Bee Activity', points: -15 });
  }

  // 4. Hive Weight
  if (weight !== null && weight < 20) {
    score -= 10;
    deductions.push({ rule: 'Low Hive Weight (< 20 kg)', points: -10 });
  }

  // 5. Smart Alert Impact
  const alerts = options.alerts || evaluateSensorReading(reading, {
    hive_id: reading.hive_id,
    hive_code: reading.hive_code,
  });

  let maxAlertSeverity = null;
  const hasCritical = alerts.some((a) => a.severity === 'CRITICAL');
  const hasHigh = alerts.some((a) => a.severity === 'HIGH');
  const hasMedium = alerts.some((a) => a.severity === 'MEDIUM');

  if (hasCritical) {
    maxAlertSeverity = 'CRITICAL';
    score -= 20;
    deductions.push({ rule: 'CRITICAL Smart Alert (Multiple Abnormal Conditions)', points: -20 });
  } else if (hasHigh) {
    maxAlertSeverity = 'HIGH';
    // Individual condition deduction already applied; do not double count
  } else if (hasMedium) {
    maxAlertSeverity = 'MEDIUM';
    // Individual condition deduction already applied; do not double count
  }

  const finalScore = Math.max(0, Math.min(100, score));

  // Determine status
  let status = 'Critical';
  if (finalScore >= 80) {
    status = 'Healthy';
  } else if (finalScore >= 60) {
    status = 'Needs Attention';
  } else if (finalScore >= 40) {
    status = 'At Risk';
  } else {
    status = 'Critical';
  }

  return {
    health_score: finalScore,
    status,
    temperature: temp,
    humidity,
    weight,
    bee_activity: activity,
    alert_severity: maxAlertSeverity,
    deductions,
  };
}

/**
 * Fetch latest sensor reading for each hive and compute health scores from PostgreSQL
 * Supports optional ?hive_id filter
 */
export async function getHiveHealthScores(hiveId = null) {
  let sql = `
    SELECT
      h.id AS hive_id,
      h.hive_code,
      h.location AS hive_location,
      sr.id AS reading_id,
      sr.temperature,
      sr.humidity,
      sr.weight,
      sr.bee_activity,
      sr.recorded_at
    FROM hives h
    LEFT JOIN LATERAL (
      SELECT *
      FROM sensor_readings sr
      WHERE sr.hive_id = h.id
      ORDER BY sr.recorded_at DESC
      LIMIT 1
    ) sr ON true
  `;

  const params = [];
  if (hiveId) {
    sql += ` WHERE h.id = $1`;
    params.push(parseInt(hiveId, 10));
  }

  sql += ` ORDER BY h.id`;

  const result = await query(sql, params);
  const hivesData = [];

  for (const row of result.rows) {
    const reading = row.reading_id ? row : null;
    const scoreData = calculateHealthScore(reading);

    hivesData.push({
      hive_id: row.hive_id,
      hive_code: row.hive_code,
      location: row.hive_location,
      health_score: scoreData.health_score,
      status: scoreData.status,
      temperature: scoreData.temperature,
      humidity: scoreData.humidity,
      weight: scoreData.weight,
      bee_activity: scoreData.bee_activity,
      alert_severity: scoreData.alert_severity,
      recorded_at: row.recorded_at || null,
      deductions: scoreData.deductions,
    });
  }

  return hivesData;
}
