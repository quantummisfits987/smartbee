import { getHiveAnalytics, calculateTrends } from '../services/analyticsService.js';

/**
 * Analytics Controller
 * Handles Hive Health Trends & Historical Analytics endpoints
 */

export async function getHiveTrends(req, res, next) {
  try {
    const { hiveId } = req.params;
    const range = req.query.range || '7d';

    const analytics = await getHiveAnalytics(hiveId, range);
    return res.status(200).json(analytics);
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    if (error.code === 'DATABASE_UNAVAILABLE' || error.statusCode === 503) {
      return res.status(503).json({
        success: false,
        error: 'Database unavailable',
        message: 'Unable to load hive analytics.',
      });
    }

    next(error);
  }
}

/**
 * Evaluate trends directly from a test array of readings
 */
export function evaluateTrendsPreview(req, res) {
  const readings = req.body?.readings;
  if (!Array.isArray(readings)) {
    return res.status(400).json({
      success: false,
      message: 'Body must contain readings array',
    });
  }

  const trends = calculateTrends(readings);
  return res.status(200).json({
    success: true,
    count: readings.length,
    trends,
  });
}
