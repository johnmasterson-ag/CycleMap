import type { RouteData } from '../hooks/useCycleRoute';
import type { StationInfo } from '../types/bikePoint';
import { getAvailabilityLevel, AVAILABILITY_COLORS } from '../utils/markerUtils';

interface RouteInfoPanelProps {
  route: RouteData;
  stations: StationInfo[];
  onSwap: () => void;
}

function StationCard({
  station,
  mode,
}: {
  station: StationInfo | null;
  mode: 'origin' | 'destination';
}) {
  if (!station) return null;

  const isOrigin = mode === 'origin';
  const count = isOrigin ? station.nbBikes : station.nbEmptyDocks;
  const total = station.nbDocks;
  const level = getAvailabilityLevel(count, total);
  const color = AVAILABILITY_COLORS[level];
  const label = isOrigin
    ? `${count} bikes available`
    : `${count} empty docks`;
  const ratio = total > 0 ? count / total : 0;

  return (
    <div className="route-station-card">
      <div className="route-station-header">
        <span className="route-station-dot" style={{ backgroundColor: color }} />
        <span className="route-station-name">{station.name}</span>
      </div>
      <div className="route-station-count" style={{ color }}>
        {count}
      </div>
      <div className="route-station-label">{label}</div>
      <div className="route-station-bar-bg">
        <div
          className="route-station-bar-fill"
          style={{ width: `${ratio * 100}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function RouteInfoPanel({ route, stations, onSwap }: RouteInfoPanelProps) {
  const distKm = route.distance / 1000;
  const timeMin = Math.round((distKm / 15) * 60);

  // Find nearest stations to route start and end
  const routeStart = route.route[0];
  const routeEnd = route.route[route.route.length - 1];

  function findNearest(lat: number, lon: number): StationInfo | null {
    let best: StationInfo | null = null;
    let bestDist = Infinity;
    for (const s of stations) {
      const d = (s.lat - lat) ** 2 + (s.lon - lon) ** 2;
      if (d < bestDist) {
        bestDist = d;
        best = s;
      }
    }
    return best;
  }

  const originStation = routeStart ? findNearest(routeStart[0], routeStart[1]) : null;
  const destStation = routeEnd ? findNearest(routeEnd[0], routeEnd[1]) : null;

  return (
    <div className="route-info-panel">
      <div className="route-panel-inner">
        <div className="route-summary">
          <div className="route-time">{timeMin} min</div>
          <div className="route-distance">{distKm.toFixed(1)} km</div>
        </div>
        <div className="route-stations">
          <StationCard station={originStation} mode="origin" />
          <button className="route-swap-btn" onClick={onSwap} title="Swap direction">
            ⇄
          </button>
          <StationCard station={destStation} mode="destination" />
        </div>
      </div>
    </div>
  );
}
