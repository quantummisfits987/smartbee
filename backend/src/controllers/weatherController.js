import { getWeatherData } from '../services/weatherService.js';

/**
 * Weather Controller
 * Integrates Open-Meteo through backend
 */

export async function getWeather(req, res, next) {
  try {
    const { lat, lon } = req.query;
    const weather = await getWeatherData(lat, lon);
    res.status(200).json({
      success: true,
      data: weather,
      ...weather,
    });
  } catch (error) {
    next(error);
  }
}
