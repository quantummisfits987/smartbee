import axios from 'axios';

/**
 * Weather Service integrating Open-Meteo API
 * Open-Meteo is free, requires no API key, and provides hourly/current weather metrics.
 */

// Default coordinates (Apiary primary location or customizable)
const DEFAULT_LATITUDE = 40.7128;
const DEFAULT_LONGITUDE = -74.0060;

export async function getWeatherData(latitude = DEFAULT_LATITUDE, longitude = DEFAULT_LONGITUDE) {
  try {
    const lat = parseFloat(latitude) || DEFAULT_LATITUDE;
    const lon = parseFloat(longitude) || DEFAULT_LONGITUDE;

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,rain,wind_speed_10m,weather_code&hourly=temperature_2m,relative_humidity_2m&timezone=auto`;

    const response = await axios.get(url, { timeout: 6000, headers: { 'User-Agent': 'SmartBee-App/1.0' } });
    const current = response.data?.current || {};

    const temperature = current.temperature_2m ?? 24.5;
    const humidity = current.relative_humidity_2m ?? 55;
    const rain = current.rain ?? 0.0;
    const windSpeed = current.wind_speed_10m ?? 8.2;

    // Interpret bee flight condition based on weather
    let flightCondition = 'Ideal for Foraging';
    if (rain > 0.5) {
      flightCondition = 'Rainy – Bees Inside Hive';
    } else if (windSpeed > 25) {
      flightCondition = 'High Wind – Restricted Flight';
    } else if (temperature < 12) {
      flightCondition = 'Too Cold (<12°C) – Clustered';
    } else if (temperature > 38) {
      flightCondition = 'Extreme Heat – Hive Cooling Active';
    }

    return {
      success: true,
      source: 'Open-Meteo API',
      latitude: lat,
      longitude: lon,
      temperature,
      humidity,
      rain,
      windSpeed,
      flightCondition,
      units: {
        temperature: '°C',
        humidity: '%',
        rain: 'mm',
        windSpeed: 'km/h',
      },
      updatedAt: current.time || new Date().toISOString(),
    };
  } catch (error) {
    console.warn('[WeatherService] Open-Meteo call failed or timed out:', error.message);
    // Return realistic fallback data so UI remains functional
    return {
      success: false,
      source: 'Open-Meteo Fallback (Offline)',
      latitude,
      longitude,
      temperature: 23.4,
      humidity: 58.0,
      rain: 0.0,
      windSpeed: 9.5,
      flightCondition: 'Favorable (Estimated)',
      units: {
        temperature: '°C',
        humidity: '%',
        rain: 'mm',
        windSpeed: 'km/h',
      },
      updatedAt: new Date().toISOString(),
      error: 'Weather service temporarily unreachable',
    };
  }
}
