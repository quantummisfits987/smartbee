import { query } from '../db/index.js';

/**
 * Smart Alert & Early Warning System Service
 * Rule-based evaluation of PostgreSQL sensor telemetry.
 *
 * Rules:
 * 1. HIGH TEMPERATURE: temp > 38°C (HIGH) - "High hive temperature detected."
 * 2. LOW TEMPERATURE: temp < 25°C (MEDIUM) - "Low hive temperature detected."
 * 3. HIGH HUMIDITY: humidity > 80% (HIGH) - "High hive humidity detected."
 * 4. LOW HUMIDITY: humidity < 40% (MEDIUM) - "Low hive humidity detected."
 * 5. LOW BEE ACTIVITY: bee_activity = "Low" (HIGH) - "Low bee activity detected."
 * 6. LOW HIVE WEIGHT: weight < 20 kg (MEDIUM) - "Low hive weight detected."
 * 7. MULTIPLE ABNORMAL CONDITIONS: >= 2 abnormal conditions on same hive (CRITICAL)
 */

export function evaluateSensorReading(reading, hiveInfo = {}) {
  const alerts = [];
  const abnormalConditions = [];

  const hiveId = reading.hive_id || hiveInfo.id || hiveInfo.hive_id;
  const hiveCode = hiveInfo.hive_code || reading.hive_code || `HIVE-${hiveId}`;
  const recordedAt = reading.recorded_at || new Date().toISOString();

  const temp = reading.temperature !== null && reading.temperature !== undefined ? parseFloat(reading.temperature) : null;
  const humidity = reading.humidity !== null && reading.humidity !== undefined ? parseFloat(reading.humidity) : null;
  const weight = reading.weight !== null && reading.weight !== undefined ? parseFloat(reading.weight) : null;
  const activity = reading.bee_activity;

  // 1. High Temperature (> 38°C)
  if (temp !== null && temp > 38) {
    abnormalConditions.push({
      hive_id: hiveId,
      hive_code: hiveCode,
      severity: 'HIGH',
      type: 'HIGH_TEMPERATURE',
      message: 'High hive temperature detected.',
      value: temp,
      threshold: 38,
      created_at: recordedAt,
    });
  }

  // 2. Low Temperature (< 25°C)
  if (temp !== null && temp < 25) {
    abnormalConditions.push({
      hive_id: hiveId,
      hive_code: hiveCode,
      severity: 'MEDIUM',
      type: 'LOW_TEMPERATURE',
      message: 'Low hive temperature detected.',
      value: temp,
      threshold: 25,
      created_at: recordedAt,
    });
  }

  // 3. High Humidity (> 80%)
  if (humidity !== null && humidity > 80) {
    abnormalConditions.push({
      hive_id: hiveId,
      hive_code: hiveCode,
      severity: 'HIGH',
      type: 'HIGH_HUMIDITY',
      message: 'High hive humidity detected.',
      value: humidity,
      threshold: 80,
      created_at: recordedAt,
    });
  }

  // 4. Low Humidity (< 40%)
  if (humidity !== null && humidity < 40) {
    abnormalConditions.push({
      hive_id: hiveId,
      hive_code: hiveCode,
      severity: 'MEDIUM',
      type: 'LOW_HUMIDITY',
      message: 'Low hive humidity detected.',
      value: humidity,
      threshold: 40,
      created_at: recordedAt,
    });
  }

  // 5. Low Bee Activity ("Low")
  if (activity === 'Low') {
    abnormalConditions.push({
      hive_id: hiveId,
      hive_code: hiveCode,
      severity: 'HIGH',
      type: 'LOW_BEE_ACTIVITY',
      message: 'Low bee activity detected.',
      value: 'Low',
      threshold: 'Normal',
      created_at: recordedAt,
    });
  }

  // 6. Low Hive Weight (< 20 kg)
  if (weight !== null && weight < 20) {
    abnormalConditions.push({
      hive_id: hiveId,
      hive_code: hiveCode,
      severity: 'MEDIUM',
      type: 'LOW_HIVE_WEIGHT',
      message: 'Low hive weight detected.',
      value: weight,
      threshold: 20,
      created_at: recordedAt,
    });
  }

  // 7. Multiple Abnormal Conditions Check (CRITICAL)
  if (abnormalConditions.length >= 2) {
    const conditionMessages = abnormalConditions.map((c) => c.message).join(' ');
    // Primary CRITICAL alert
    alerts.push({
      hive_id: hiveId,
      hive_code: hiveCode,
      severity: 'CRITICAL',
      type: 'MULTIPLE_ABNORMAL_CONDITIONS',
      message: `Multiple abnormal conditions detected. ${conditionMessages}`,
      value: abnormalConditions.map((c) => `${c.type}: ${c.value}`).join(', '),
      threshold: abnormalConditions.map((c) => `${c.type}: ${c.threshold}`).join(', '),
      conditions: abnormalConditions,
      created_at: recordedAt,
    });

    // Also include the individual conditions
    for (const cond of abnormalConditions) {
      alerts.push(cond);
    }
  } else if (abnormalConditions.length === 1) {
    alerts.push(abnormalConditions[0]);
  }

  return alerts;
}

/**
 * Fetch latest sensor readings for hives and compute alerts from PostgreSQL
 * Supports optional ?hive_id filter
 */
export async function getSmartAlerts(hiveId = null) {
  let sql = `
    SELECT DISTINCT ON (h.id)
      h.id as hive_id,
      h.hive_code,
      h.location as hive_location,
      sr.id as reading_id,
      sr.temperature,
      sr.humidity,
      sr.weight,
      sr.bee_activity,
      sr.recorded_at
    FROM hives h
    JOIN sensor_readings sr ON h.id = sr.hive_id
  `;

  const params = [];
  if (hiveId) {
    sql += ` WHERE h.id = $1`;
    params.push(parseInt(hiveId, 10));
  }

  sql += ` ORDER BY h.id, sr.recorded_at DESC`;

  const result = await query(sql, params);
  const allAlerts = [];

  for (const row of result.rows) {
    const hiveAlerts = evaluateSensorReading(row, {
      id: row.hive_id,
      hive_code: row.hive_code,
      location: row.hive_location,
    });
    allAlerts.push(...hiveAlerts);
  }

  // Sort alerts by severity priority: CRITICAL -> HIGH -> MEDIUM, then by time DESC
  const severityRank = {
    CRITICAL: 1,
    HIGH: 2,
    MEDIUM: 3,
  };

  allAlerts.sort((a, b) => {
    const rankDiff = (severityRank[a.severity] || 99) - (severityRank[b.severity] || 99);
    if (rankDiff !== 0) return rankDiff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return allAlerts;
}
