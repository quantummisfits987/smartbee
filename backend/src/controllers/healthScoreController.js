import { getHiveHealthScores, calculateHealthScore } from '../services/healthScoreService.js';

/**
 * Health Score Controller
 * Hive Health Score API endpoints
 */

export async function getHiveHealth(req, res, next) {
  try {
    const hiveId = req.query.hive_id || req.query.hiveId || null;
    const hives = await getHiveHealthScores(hiveId);

    return res.status(200).json({
      success: true,
      count: hives.length,
      hives,
    });
  } catch (error) {
    if (error.code === 'DATABASE_UNAVAILABLE' || error.statusCode === 503) {
      return res.status(503).json({
        success: false,
        error: 'Database unavailable',
        message: 'Unable to load hive health scores. Database unavailable.',
        hives: [],
      });
    }
    next(error);
  }
}

/**
 * Endpoint to evaluate a simulated/test sensor reading payload directly
 */
export function evaluateHealthScorePreview(req, res) {
  const reading = req.body;
  if (!reading) {
    return res.status(400).json({
      success: false,
      message: 'Reading object is required',
    });
  }

  const result = calculateHealthScore(reading);
  return res.status(200).json({
    success: true,
    ...result,
  });
}
