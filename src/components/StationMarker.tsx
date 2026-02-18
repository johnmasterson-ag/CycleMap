import { Marker, Popup } from 'react-leaflet';
import type { StationInfo } from '../types/bikePoint';
import { createStationIcon } from '../utils/markerUtils';

interface StationMarkerProps {
  station: StationInfo;
}

export function StationMarker({ station }: StationMarkerProps) {
  const icon = createStationIcon(station.nbBikes, station.nbDocks);

  return (
    <Marker position={[station.lat, station.lon]} icon={icon}>
      <Popup>
        <div className="station-popup">
          <h3>{station.name}</h3>
          <div className="popup-stats">
            <div className="stat">
              <span className="stat-value bikes">{station.nbBikes}</span>
              <span className="stat-label">Bikes</span>
            </div>
            <div className="stat">
              <span className="stat-value ebikes">{station.nbEBikes}</span>
              <span className="stat-label">E-Bikes</span>
            </div>
            <div className="stat">
              <span className="stat-value empty">{station.nbEmptyDocks}</span>
              <span className="stat-label">Empty</span>
            </div>
          </div>
          <p className="popup-total">Total docks: {station.nbDocks}</p>
        </div>
      </Popup>
    </Marker>
  );
}
