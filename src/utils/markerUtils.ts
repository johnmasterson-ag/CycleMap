import L from 'leaflet';

export type AvailabilityLevel = 'high' | 'medium' | 'low' | 'empty' | 'closed';

export function getAvailabilityLevel(count: number, total: number, closed = false): AvailabilityLevel {
  if (closed) return 'closed';
  if (count === 0) return 'empty';
  const ratio = count / total;
  if (ratio < 0.2) return 'low';
  if (ratio < 0.5) return 'medium';
  return 'high';
}

export const AVAILABILITY_COLORS: Record<AvailabilityLevel, string> = {
  high: '#4CAF50',
  medium: '#FF8B00',
  low: '#FF0000',
  empty: '#666666',
  closed: '#B4BBBF',
};

export function createStationIcon(nbBikes: number, nbDocks: number): L.DivIcon {
  const level = getAvailabilityLevel(nbBikes, nbDocks);
  const color = AVAILABILITY_COLORS[level];

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
