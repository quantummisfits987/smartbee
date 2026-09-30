import { getWeatherData } from './weatherService.js';

/**
 * Weather-Based Smart Advisory Service
 * Deterministic rule-based evaluation of live Open-Meteo ambient conditions.
 *
 * Rules:
 * 1. Temperature:
 *    > 35°C: HIGH ("High temperature detected. Monitor hive heat conditions and provide adequate shade if necessary.")
 *    >= 30°C and <= 35°C: MEDIUM ("Warm weather detected. Monitor hive temperature regularly.")
 *    < 15°C: HIGH ("Low temperature detected. Monitor hive warmth and colony activity.")
 *    >= 15°C and < 30°C: None
 *
 * 2. Humidity:
 *    > 80%: HIGH ("High humidity detected. Monitor hive ventilation and moisture conditions.")
 *    >= 70% and <= 80%: MEDIUM ("Elevated humidity detected. Monitor hive moisture conditions.")
 *    < 40%: MEDIUM ("Low humidity detected. Monitor hive moisture conditions.")
 *    Otherwise: None
 *
 * 3. Wind:
 *    > 30 km/h: HIGH ("Strong wind conditions detected. Inspect hive stability and surroundings.")
 *    >= 20 km/h and <= 30 km/h: MEDIUM ("Moderate wind conditions detected. Monitor hive surroundings.")
 *    Otherwise: None
 *
 * Overall Risk:
 *    Any HIGH -> "HIGH"
 *    Else any MEDIUM -> "MODERATE"
 *    Else -> "LOW"
 */

export function evaluateWeatherAdvisories(weatherData) {
  const advisories = [];

  const temp = weatherData.temperature !== undefined && weatherData.temperature !== null
    ? parseFloat(weatherData.temperature)
    : null;
  const humidity = weatherData.humidity !== undefined && weatherData.humidity !== null
    ? parseFloat(weatherData.humidity)
    : null;
  const windSpeed = weatherData.windSpeed !== undefined && weatherData.windSpeed !== null
    ? parseFloat(weatherData.windSpeed)
    : weatherData.wind_speed !== undefined && weatherData.wind_speed !== null
    ? parseFloat(weatherData.wind_speed)
    : null;

  // 1. Temperature Rules
  if (temp !== null && !isNaN(temp)) {
    if (temp > 35) {
      advisories.push({
        type: 'HIGH_TEMPERATURE',
        severity: 'HIGH',
        message: 'High temperature detected. Monitor hive heat conditions and provide adequate shade if necessary.',
        metric: 'temperature',
        value: temp,
      });
    } else if (temp >= 30 && temp <= 35) {
      advisories.push({
        type: 'WARM_WEATHER',
        severity: 'MEDIUM',
        message: 'Warm weather detected. Monitor hive temperature regularly.',
        metric: 'temperature',
        value: temp,
      });
    } else if (temp < 15) {
      advisories.push({
        type: 'LOW_TEMPERATURE',
        severity: 'HIGH',
        message: 'Low temperature detected. Monitor hive warmth and colony activity.',
        metric: 'temperature',
        value: temp,
      });
    }
  }

  // 2. Humidity Rules
  if (humidity !== null && !isNaN(humidity)) {
    if (humidity > 80) {
      advisories.push({
        type: 'HIGH_HUMIDITY',
        severity: 'HIGH',
        message: 'High humidity detected. Monitor hive ventilation and moisture conditions.',
        metric: 'humidity',
        value: humidity,
      });
    } else if (humidity >= 70 && humidity <= 80) {
      advisories.push({
        type: 'ELEVATED_HUMIDITY',
        severity: 'MEDIUM',
        message: 'Elevated humidity detected. Monitor hive moisture conditions.',
        metric: 'humidity',
        value: humidity,
      });
    } else if (humidity < 40) {
      advisories.push({
        type: 'LOW_HUMIDITY',
        severity: 'MEDIUM',
        message: 'Low humidity detected. Monitor hive moisture conditions.',
        metric: 'humidity',
        value: humidity,
      });
    }
  }

  // 3. Wind Rules
  if (windSpeed !== null && !isNaN(windSpeed)) {
    if (windSpeed > 30) {
      advisories.push({
        type: 'STRONG_WIND',
        severity: 'HIGH',
        message: 'Strong wind conditions detected. Inspect hive stability and surroundings.',
        metric: 'wind_speed',
        value: windSpeed,
      });
    } else if (windSpeed >= 20 && windSpeed <= 30) {
      advisories.push({
        type: 'MODERATE_WIND',
        severity: 'MEDIUM',
        message: 'Moderate wind conditions detected. Monitor hive surroundings.',
        metric: 'wind_speed',
        value: windSpeed,
      });
    }
  }

  // 4. Overall Weather Risk Determination
  let risk = 'LOW';
  if (advisories.some((a) => a.severity === 'HIGH')) {
    risk = 'HIGH';
  } else if (advisories.some((a) => a.severity === 'MEDIUM')) {
    risk = 'MODERATE';
  } else {
    risk = 'LOW';
  }

  return {
    risk,
    advisories,
    weather: {
      temperature: temp,
      humidity,
      wind_speed: windSpeed,
    },
  };
}

/**
 * Fetch live weather from existing weatherService and evaluate smart advisories
 */
export async function getWeatherAdvisory(lat, lon) {
  const weather = await getWeatherData(lat, lon);

  // If live weather service failed, do NOT fabricate data
  if (!weather || weather.success === false) {
    const error = new Error('Weather advisory unavailable. Weather service is currently unavailable.');
    error.statusCode = 503;
    error.code = 'WEATHER_SERVICE_UNAVAILABLE';
    throw error;
  }

  const evaluation = evaluateWeatherAdvisories({
    temperature: weather.temperature,
    humidity: weather.humidity,
    windSpeed: weather.windSpeed,
  });

  return {
    success: true,
    source: weather.source,
    weather: evaluation.weather,
    risk: evaluation.risk,
    advisories: evaluation.advisories,
    updatedAt: weather.updatedAt || new Date().toISOString(),
  };
}
