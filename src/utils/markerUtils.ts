import L from 'leaflet';

type AvailabilityLevel = 'high' | 'medium' | 'low' | 'empty';

function getAvailabilityLevel(nbBikes: number, nbDocks: number): AvailabilityLevel {
  if (nbBikes === 0) return 'empty';
  const ratio = nbBikes / nbDocks;
  if (ratio < 0.25) return 'low';
  if (ratio < 0.5) return 'medium';
  return 'high';
}

const COLORS: Record<AvailabilityLevel, string> = {
  high: '#22c55e',
  medium: '#f97316',
  low: '#ef4444',
  empty: '#6b7280',
};

export function createStationIcon(nbBikes: number, nbDocks: number): L.DivIcon {
  const level = getAvailabilityLevel(nbBikes, nbDocks);
  const color = COLORS[level];

  return L.divIcon({
    className: 'station-marker',
    html: `<div style="
      background-color: ${color};
      color: white;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">${nbBikes}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}
