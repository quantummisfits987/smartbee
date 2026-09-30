import { query } from '../db/index.js';

/**
 * Sensor Controller
 * Handles IoT sensor telemetry and simulated data ingestion
 */

export async function getHiveSensors(req, res, next) {
  try {
    const { hiveId } = req.params;

    // Verify hive exists
    const hiveRes = await query('SELECT id FROM hives WHERE id = $1', [hiveId]);
    if (hiveRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Hive with ID ${hiveId} not found`,
      });
    }

    const result = await query(
      'SELECT * FROM sensor_readings WHERE hive_id = $1 ORDER BY recorded_at DESC LIMIT 50',
      [hiveId]
    );

    res.status(200).json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      readings: result.rows,
    });
  } catch (error) {
    next(error);
  }
}

export async function getRecentSensors(req, res, next) {
  try {
    const limit = parseInt(req.query.limit || '20', 10);
    const result = await query(
      `SELECT sr.*, h.hive_code, h.location as hive_location 
       FROM sensor_readings sr 
       JOIN hives h ON sr.hive_id = h.id 
       ORDER BY sr.recorded_at DESC 
       LIMIT $1`,
      [limit]
    );

    res.status(200).json({
      success: true,
      data: result.rows,
      readings: result.rows,
    });
  } catch (error) {
    next(error);
  }
}

export async function addSensorReading(req, res, next) {
  try {
    let { hive_id, temperature, humidity, weight, bee_activity, is_simulation = false } = req.body;

    // 1. Validate hive_id
    if (!hive_id || isNaN(Number(hive_id))) {
      return res.status(400).json({
        success: false,
        error: 'Valid numeric hive_id is required',
      });
    }

    const parsedHiveId = parseInt(hive_id, 10);

    // Verify hive exists
    const hiveRes = await query('SELECT id FROM hives WHERE id = $1', [parsedHiveId]);
    if (hiveRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Hive with ID ${parsedHiveId} not found`,
      });
    }

    // If simulation flagged and parameters are missing, compute realistic fluctuations
    if (is_simulation && (temperature === undefined || humidity === undefined || weight === undefined)) {
      const lastReadingRes = await query(
        'SELECT * FROM sensor_readings WHERE hive_id = $1 ORDER BY recorded_at DESC LIMIT 1',
        [parsedHiveId]
      );
      const prev = lastReadingRes.rows[0];

      const prevTemp = prev ? parseFloat(prev.temperature) : 35.0;
      const prevHum = prev ? parseFloat(prev.humidity) : 55.0;
      const prevWeight = prev ? parseFloat(prev.weight) : 42.0;

      const tempDelta = (Math.random() * 0.6 - 0.3);
      temperature = parseFloat((Math.min(37.5, Math.max(31.5, prevTemp + tempDelta))).toFixed(1));

      const humDelta = (Math.random() * 2.0 - 1.0);
      humidity = parseFloat((Math.min(75.0, Math.max(45.0, prevHum + humDelta))).toFixed(1));

      const weightDelta = (Math.random() * 0.2 - 0.05);
      weight = parseFloat((Math.max(25.0, prevWeight + weightDelta)).toFixed(2));

      const activities = ['Normal', 'High', 'Normal', 'Normal', 'Low'];
      bee_activity = bee_activity || activities[Math.floor(Math.random() * activities.length)];
    }

    // 2. Validate input fields
    const parsedTemp = parseFloat(temperature);
    if (temperature === undefined || isNaN(parsedTemp)) {
      return res.status(400).json({
        success: false,
        error: 'Valid numeric temperature is required',
      });
    }

    const parsedHum = parseFloat(humidity);
    if (humidity === undefined || isNaN(parsedHum) || parsedHum < 0 || parsedHum > 100) {
      return res.status(400).json({
        success: false,
        error: 'Valid numeric humidity between 0 and 100 is required',
      });
    }

    const parsedWeight = parseFloat(weight);
    if (weight === undefined || isNaN(parsedWeight) || parsedWeight <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid numeric weight greater than 0 is required',
      });
    }

    if (!bee_activity || typeof bee_activity !== 'string' || !bee_activity.trim()) {
      return res.status(400).json({
        success: false,
        error: 'bee_activity is required and must be a string',
      });
    }

    const result = await query(
      `INSERT INTO sensor_readings (hive_id, temperature, humidity, weight, bee_activity)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [parsedHiveId, parsedTemp, parsedHum, parsedWeight, bee_activity.trim()]
    );

    const newReading = result.rows[0];

    res.status(201).json({
      success: true,
      data: newReading,
      reading: newReading,
      source: is_simulation ? 'Simulated IoT Data' : 'Sensor Ingestion',
    });
  } catch (error) {
    next(error);
  }
}
