import { useState, useEffect } from 'react';
import type { OpenMeteoResponse, LocationWeather } from '../types/weather';

const LOCATIONS = {
  londonBridge: { name: 'London Bridge', lat: 51.5055, lon: -0.0875 },
  redhill: { name: 'Redhill', lat: 51.2404, lon: -0.1676 },
} as const;

const PARAMS = 'hourly=temperature_2m,precipitation_probability,rain,weathercode,wind_speed_10m,wind_direction_10m&forecast_days=2&timezone=Europe/London';

function parseWeather(data: OpenMeteoResponse, locationName: string): LocationWeather {
  const { hourly } = data;
  const now = new Date();
  const currentHourIndex = now.getHours();

  // Get up to 24 hours of forecast from current hour
  const hourlyForecast = [];
  for (let i = currentHourIndex; i < Math.min(currentHourIndex + 24, hourly.time.length); i++) {
    hourlyForecast.push({
      time: hourly.time[i],
      temp: hourly.temperature_2m[i],
      rainProbability: hourly.precipitation_probability[i],
      rain: hourly.rain[i],
      weatherCode: hourly.weathercode[i],
      windSpeed: hourly.wind_speed_10m[i],
      windDirection: hourly.wind_direction_10m[i],
    });
  }

  return {
    locationName,
    currentTemp: hourly.temperature_2m[currentHourIndex] ?? 0,
    currentWeatherCode: hourly.weathercode[currentHourIndex] ?? 0,
    currentRainProbability: hourly.precipitation_probability[currentHourIndex] ?? 0,
    currentRain: hourly.rain[currentHourIndex] ?? 0,
    currentWindSpeed: hourly.wind_speed_10m[currentHourIndex] ?? 0,
    currentWindDirection: hourly.wind_direction_10m[currentHourIndex] ?? 0,
    hourlyForecast,
  };
}

async function fetchWeather(
  lat: number,
  lon: number,
  signal: AbortSignal,
): Promise<OpenMeteoResponse> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&${PARAMS}`;
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Weather API error: ${response.status}`);
  return response.json();
}

export function useWeather() {
  const [londonBridge, setLondonBridge] = useState<LocationWeather | null>(null);
  const [redhill, setRedhill] = useState<LocationWeather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchAll() {
      try {
        setLoading(true);
        const [lbData, rhData] = await Promise.all([
          fetchWeather(LOCATIONS.londonBridge.lat, LOCATIONS.londonBridge.lon, controller.signal),
          fetchWeather(LOCATIONS.redhill.lat, LOCATIONS.redhill.lon, controller.signal),
        ]);
        setLondonBridge(parseWeather(lbData, LOCATIONS.londonBridge.name));
        setRedhill(parseWeather(rhData, LOCATIONS.redhill.name));
        setError(null);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
    return () => controller.abort();
  }, []);

  return { londonBridge, redhill, loading, error };
}
