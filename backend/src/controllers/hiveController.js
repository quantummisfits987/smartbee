import { query } from '../db/index.js';

/**
 * Hive Controller
 */

export async function getHives(req, res, next) {
  try {
    const hivesResult = await query('SELECT * FROM hives ORDER BY id ASC');
    const hives = hivesResult.rows;

    const enriched = await Promise.all(
      hives.map(async (hive) => {
        const sensorRes = await query(
          'SELECT * FROM sensor_readings WHERE hive_id = $1 ORDER BY recorded_at DESC LIMIT 1',
          [hive.id]
        );
        const advisoryRes = await query(
          'SELECT * FROM ai_advisories WHERE hive_id = $1 ORDER BY created_at DESC LIMIT 1',
          [hive.id]
        );
        return {
          ...hive,
          latestSensor: sensorRes.rows[0] || null,
          latestAdvisory: advisoryRes.rows[0] || null,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: enriched,
      count: enriched.length,
      hives: enriched,
    });
  } catch (error) {
    next(error);
  }
}

export async function getHiveById(req, res, next) {
  try {
    const { id } = req.params;
    const hiveResult = await query('SELECT * FROM hives WHERE id = $1', [id]);

    if (hiveResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Hive with ID ${id} not found`,
      });
    }

    const hive = hiveResult.rows[0];

    const sensorRes = await query(
      'SELECT * FROM sensor_readings WHERE hive_id = $1 ORDER BY recorded_at DESC LIMIT 50',
      [id]
    );
    const sensors = sensorRes.rows;

    const advisoryRes = await query(
      'SELECT * FROM ai_advisories WHERE hive_id = $1 ORDER BY created_at DESC LIMIT 1',
      [id]
    );
    const latestAdvisory = advisoryRes.rows[0] || null;

    // Compute basic statistics
    let avgTemperature = null;
    let avgHumidity = null;
    let latestWeight = null;

    if (sensors.length > 0) {
      const totalTemp = sensors.reduce((acc, s) => acc + parseFloat(s.temperature), 0);
      const totalHum = sensors.reduce((acc, s) => acc + parseFloat(s.humidity), 0);
      avgTemperature = parseFloat((totalTemp / sensors.length).toFixed(1));
      avgHumidity = parseFloat((totalHum / sensors.length).toFixed(1));
      latestWeight = parseFloat(sensors[0].weight);
    }

    const statistics = {
      total_readings: sensors.length,
      avg_temperature: avgTemperature,
      avg_humidity: avgHumidity,
      latest_weight: latestWeight,
    };

    const payload = {
      ...hive,
      latestSensor: sensors[0] || null,
      sensors,
      latestAdvisory,
      statistics,
    };

    res.status(200).json({
      success: true,
      data: payload,
      hive: payload,
    });
  } catch (error) {
    next(error);
  }
}

export async function createHive(req, res, next) {
  try {
    const { hive_code, location, status = 'Active' } = req.body;

    if (!hive_code || typeof hive_code !== 'string' || !hive_code.trim()) {
      return res.status(400).json({
        success: false,
        error: 'hive_code is required and must be a non-empty string',
      });
    }

    if (!location || typeof location !== 'string' || !location.trim()) {
      return res.status(400).json({
        success: false,
        error: 'location is required and must be a non-empty string',
      });
    }

    const cleanCode = hive_code.trim().toUpperCase();
    const cleanLocation = location.trim();

    // Check duplicate
    const existing = await query('SELECT * FROM hives WHERE hive_code = $1', [cleanCode]);
    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Hive code '${cleanCode}' already exists`,
      });
    }

    const result = await query(
      'INSERT INTO hives (hive_code, location, status) VALUES ($1, $2, $3) RETURNING *',
      [cleanCode, cleanLocation, status || 'Active']
    );

    const newHive = result.rows[0];

    // Seed baseline initial sensor telemetry for the newly created hive
    await query(
      'INSERT INTO sensor_readings (hive_id, temperature, humidity, weight, bee_activity) VALUES ($1, $2, $3, $4, $5)',
      [newHive.id, 35.0, 56.0, 38.0, 'Normal']
    );

    res.status(201).json({
      success: true,
      data: newHive,
      hive: newHive,
    });
  } catch (error) {
    next(error);
  }
}
