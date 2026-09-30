import { getWeatherAdvisory, evaluateWeatherAdvisories } from '../services/weatherAdvisoryService.js';

/**
 * Weather Advisory Controller
 * Handles weather-based smart advisory endpoints
 */

export async function getWeatherAdvisoryHandler(req, res, next) {
  try {
    const { lat, lon } = req.query;
    const advisory = await getWeatherAdvisory(lat, lon);
    return res.status(200).json(advisory);
  } catch (error) {
    if (error.statusCode === 503 || error.code === 'WEATHER_SERVICE_UNAVAILABLE') {
      return res.status(503).json({
        success: false,
        error: 'Weather service unavailable',
        message: 'Weather advisory unavailable. Weather service is currently unavailable.',
        risk: 'UNKNOWN',
        advisories: [],
      });
    }
    next(error);
  }
}

/**
 * Endpoint to evaluate a simulated/custom weather payload directly
 */
export function evaluateWeatherAdvisoryPreview(req, res) {
  const weather = req.body;
  if (!weather) {
    return res.status(400).json({
      success: false,
      message: 'Weather object is required',
    });
  }

  const evaluation = evaluateWeatherAdvisories(weather);
  return res.status(200).json({
    success: true,
    weather: evaluation.weather,
    risk: evaluation.risk,
    advisories: evaluation.advisories,
  });
}
