import { useTrainDepartures } from '../hooks/useTrainDepartures';
import { useWeather } from '../hooks/useWeather';
import { getWeatherInfo } from '../utils/weatherCodes';
import type { LocationWeather, HourlyForecast } from '../types/weather';
import type { TrainService } from '../types/trains';

// Commute windows (hours, 24h format)
const MORNING_START = 7;
const MORNING_END = 9;
const EVENING_START = 17;
const EVENING_END = 19;

function windDirectionLabel(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

function kphToMph(kph: number): number {
  return Math.round(kph * 0.621371);
}

function getRainBarColor(probability: number): string {
  if (probability > 60) return '#FF0000';
  if (probability > 30) return '#FF8B00';
  return '#B4BBBF';
}

function isInCommuteWindow(hour: number): boolean {
  return (hour >= MORNING_START && hour < MORNING_END) ||
         (hour >= EVENING_START && hour < EVENING_END);
}

// ========== Commute Decision Banner ==========

function getCommuteDecision(weather: LocationWeather | null): {
  level: 'green' | 'orange' | 'red';
  text: string;
  detail: string;
} {
  if (!weather) return { level: 'green', text: 'Loading conditions...', detail: '' };

  // Check commute hours
  const commuteHours = weather.hourlyForecast.filter(h => {
    const hour = new Date(h.time).getHours();
    return isInCommuteWindow(hour);
  });

  const maxRain = commuteHours.length > 0
    ? Math.max(...commuteHours.map(h => h.rainProbability))
    : weather.currentRainProbability;

  const maxWind = commuteHours.length > 0
    ? Math.max(...commuteHours.map(h => h.windSpeed))
    : weather.currentWindSpeed;

  const maxWindMph = kphToMph(maxWind);
  const worstHour = commuteHours.reduce<HourlyForecast | null>(
    (worst, h) => (!worst || h.rainProbability > worst.rainProbability ? h : worst),
    null,
  );

  const worstTime = worstHour
    ? `${new Date(worstHour.time).getHours().toString().padStart(2, '0')}:00`
    : '';

  const details: string[] = [];
  if (maxRain > 30) details.push(`${maxRain}% chance of rain${worstTime ? ` at ${worstTime}` : ''}`);
  if (maxWindMph > 15) details.push(`${maxWindMph}mph wind`);

  if (maxRain > 80 || maxWindMph > 30) {
    return {
      level: 'red',
      text: 'Consider the train',
      detail: details.join(', ') || 'Severe conditions expected',
    };
  }
  if (maxRain > 60 || maxWindMph > 20) {
    return {
      level: 'orange',
      text: 'Check conditions',
      detail: details.join(', ') || 'Moderate risk',
    };
  }
  return {
    level: 'green',
    text: 'Good cycling conditions',
    detail: details.length > 0 ? details.join(', ') : 'Low rain risk, calm winds',
  };
}

const DECISION_STYLES: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  green: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', icon: '🚴' },
  orange: { bg: '#fffbeb', border: '#fde68a', text: '#92400e', icon: '🌦️' },
  red: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', icon: '🚆' },
};

function CommuteBanner({ weather }: { weather: LocationWeather | null }) {
  const decision = getCommuteDecision(weather);
  const style = DECISION_STYLES[decision.level];

  return (
    <div
      className="commute-banner"
      style={{ background: style.bg, borderColor: style.border, color: style.text }}
    >
      <span className="commute-icon">{style.icon}</span>
      <div>
        <div className="commute-text">{decision.text}</div>
        {decision.detail && <div className="commute-detail">{decision.detail}</div>}
      </div>
    </div>
  );
}

// ========== Weather Card ==========

function WeatherCard({ weather }: { weather: LocationWeather }) {
  const info = getWeatherInfo(weather.currentWeatherCode);
  const windMph = kphToMph(weather.currentWindSpeed);
  const windDir = windDirectionLabel(weather.currentWindDirection);
  const currentHour = new Date().getHours();

  // Show up to 24 hours — chart scrolls horizontally on mobile
  const hours = weather.hourlyForecast;

  return (
    <div className="tw-weather-card">
      {/* Compact header line */}
      <div className="tw-card-header">
        <span className="tw-card-title">{weather.locationName}</span>
        <span className="tw-card-conditions">
          {info.emoji} {Math.round(weather.currentTemp)}°C · {info.description}
          <span className="tw-wind">💨 {windMph}mph {windDir}</span>
        </span>
      </div>

      {/* Hourly rain bar chart — scrollable on small screens */}
      <div className="tw-rain-chart-scroll">
        <div className="tw-rain-chart" style={{ minWidth: hours.length > 12 ? `${hours.length * 22}px` : undefined }}>
          {hours.map((h, i) => {
            const hour = new Date(h.time).getHours();
            const isCurrent = hour === currentHour;
            const inCommute = isInCommuteWindow(hour);
            const barHeight = Math.max(2, (h.rainProbability / 100) * 48);

            return (
              <div
                key={i}
                className={`tw-bar-col ${isCurrent ? 'current' : ''} ${inCommute ? 'commute' : ''}`}
              >
                <div className="tw-bar-value">{h.rainProbability > 0 ? `${h.rainProbability}` : ''}</div>
                <div className="tw-bar-track">
                  <div
                    className="tw-bar-fill"
                    style={{
                      height: `${barHeight}px`,
                      backgroundColor: getRainBarColor(h.rainProbability),
                    }}
                  />
                </div>
                <div className="tw-bar-label">{hour.toString().padStart(2, '0')}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="tw-chart-legend">
        <span className="tw-commute-indicator" /> Commute window
      </div>
    </div>
  );
}

// ========== Train Table ==========

function getStatusClass(status: TrainService['status']): string {
  if (status === 'on-time') return 'status-on-time';
  if (status === 'late') return 'status-late';
  return 'status-cancelled';
}

function getStatusText(service: TrainService): string {
  if (service.status === 'cancelled') return 'Cancelled';
  if (service.status === 'late') return `Exp ${service.expectedTime} (+${service.delayMinutes})`;
  return 'On time';
}

function TrainTable({ services, title }: { services: TrainService[]; title: string }) {
  const displayed = services.slice(0, 5);

  return (
    <div className="tw-train-col">
      <h3 className="tw-section-heading">{title}</h3>
      {displayed.length === 0 ? (
        <p className="no-services">No services found</p>
      ) : (
        <table className="train-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Plat</th>
              <th className="hide-mobile">Operator</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map(s => (
              <tr key={s.id} className={getStatusClass(s.status)}>
                <td className="train-time">{s.scheduledTime}</td>
                <td>{s.platform}</td>
                <td className="hide-mobile">{s.operator}</td>
                <td className="train-status">{getStatusText(s)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ========== Main Component ==========

export function TrainsWeather() {
  const weather = useWeather();
  const trains = useTrainDepartures();

  return (
    <div className="tw-container">
      {/* Commute decision banner */}
      <CommuteBanner weather={weather.londonBridge} />

      {/* Weather cards */}
      {weather.error && (
        <div className="error-banner" style={{ borderRadius: 8, marginBottom: 16 }}>
          Weather: {weather.error}
        </div>
      )}
      <div className="tw-weather-row">
        {weather.londonBridge && <WeatherCard weather={weather.londonBridge} />}
        {weather.redhill && <WeatherCard weather={weather.redhill} />}
        {weather.loading && <p className="loading-text">Loading weather...</p>}
      </div>

      {/* Live trains */}
      <h3 className="tw-section-heading">Live Trains</h3>
      {trains.error && (
        <div className="error-banner" style={{ borderRadius: 8, marginBottom: 16 }}>
          Trains: {trains.error}
        </div>
      )}
      <div className="tw-trains-row">
        <TrainTable title="London Bridge → Redhill" services={trains.departures} />
        <TrainTable title="Redhill → London Bridge" services={trains.arrivals} />
        {trains.loading && <p className="loading-text">Loading trains...</p>}
      </div>
    </div>
  );
}
