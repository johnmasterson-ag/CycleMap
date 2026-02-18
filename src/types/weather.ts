export interface OpenMeteoHourly {
  time: string[];
  temperature_2m: number[];
  precipitation_probability: number[];
  rain: number[];
  weathercode: number[];
  wind_speed_10m: number[];
  wind_direction_10m: number[];
}

export interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  hourly: OpenMeteoHourly;
}

export interface HourlyForecast {
  time: string;
  temp: number;
  rainProbability: number;
  rain: number;
  weatherCode: number;
  windSpeed: number;
  windDirection: number;
}

export interface LocationWeather {
  locationName: string;
  currentTemp: number;
  currentWeatherCode: number;
  currentRainProbability: number;
  currentRain: number;
  currentWindSpeed: number;
  currentWindDirection: number;
  hourlyForecast: HourlyForecast[];
}
