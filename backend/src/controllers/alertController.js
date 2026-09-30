import { getSmartAlerts, evaluateSensorReading } from '../services/alertService.js';

/**
 * Alert Controller
 * Smart Alert & Early Warning System endpoints
 */

export async function getAlerts(req, res, next) {
  try {
    const hiveId = req.query.hive_id || req.query.hiveId || null;
    const alerts = await getSmartAlerts(hiveId);

    return res.status(200).json({
      success: true,
      count: alerts.length,
      alerts: alerts,
    });
  } catch (error) {
    if (error.code === 'DATABASE_UNAVAILABLE' || error.statusCode === 503) {
      return res.status(503).json({
        success: false,
        error: 'Database unavailable',
        message: 'Unable to load smart alerts. Database unavailable.',
        alerts: [],
      });
    }
    next(error);
  }
}

/**
 * Optional helper endpoint to evaluate a reading payload directly (useful for tests/preview)
 */
export function evaluateReadingPreview(req, res) {
  const reading = req.body;
  if (!reading) {
    return res.status(400).json({
      success: false,
      message: 'Reading object is required',
    });
  }

  const alerts = evaluateSensorReading(reading, {
    id: reading.hive_id || 1,
    hive_code: reading.hive_code || `HIVE-${reading.hive_id || 1}`,
  });

  return res.status(200).json({
    success: true,
    count: alerts.length,
    alerts,
  });
}
