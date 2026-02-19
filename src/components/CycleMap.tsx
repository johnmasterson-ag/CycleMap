import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import type { StationInfo } from '../types/bikePoint';
import { StationMarker } from './StationMarker';
import { Legend } from './Legend';
import { RouteInfoPanel } from './RouteInfoPanel';
import { useCycleRoutes } from '../hooks/useCycleRoute';
import 'leaflet/dist/leaflet.css';

// 70 Wilson Street, London EC2A 2DB
const OFFICE_LOCATION: [number, number] = [51.5218, -0.0845];

// London Bridge Station
const LONDON_BRIDGE_STATION: [number, number] = [51.5052, -0.0864];

const trainIcon = L.divIcon({
  className: 'train-marker',
  html: `<div style="
    background-color: #7c3aed;
    color: white;
    border-radius: 8px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    border: 2px solid white;
    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
  ">🚆</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

const officeIcon = L.divIcon({
  className: 'office-marker',
  html: `<div style="
    background-color: #1e40af;
    color: white;
    border-radius: 8px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    border: 2px solid white;
    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
  ">🏢</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

// Fit the map to show both London Bridge Station and the office
function FitBounds() {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds([LONDON_BRIDGE_STATION, OFFICE_LOCATION]);
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map]);
  return null;
}

interface CycleMapProps {
  stations: StationInfo[];
  lastRefreshed: Date | null;
}

export function CycleMap({ stations, lastRefreshed }: CycleMapProps) {
  const { routes, walkingRoute } = useCycleRoutes(LONDON_BRIDGE_STATION, OFFICE_LOCATION);
  const primaryRoute = routes[0];
  const altRoute = routes[1];

  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
      <MapContainer
        center={LONDON_BRIDGE_STATION}
        zoom={14}
        className="map-container"
        scrollWheelZoom={true}
      >
        <FitBounds />
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* Walking route (rendered first, below cycling routes) */}
        {walkingRoute && (
          <Polyline
            positions={walkingRoute.route}
            pathOptions={{
              color: '#8b5cf6',
              weight: 4,
              opacity: 0.7,
              dashArray: '4 8',
            }}
          >
            <Popup>
              <div className="station-popup">
                <h3>Walking Route</h3>
                <p style={{ margin: '4px 0 0', color: '#374151', fontSize: '0.85rem' }}>
                  London Bridge → AG Grid
                </p>
                <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.8rem' }}>
                  {(walkingRoute.distance / 1000).toFixed(1)} km · ~{Math.round(walkingRoute.duration / 60)} min
                </p>
              </div>
            </Popup>
          </Polyline>
        )}

        {/* Alternative route (rendered first so primary draws on top) */}
        {altRoute && (
          <Polyline
            positions={altRoute.route}
            pathOptions={{
              color: '#9ca3af',
              weight: 4,
              opacity: 0.6,
              dashArray: '8 6',
            }}
          >
            <Popup>
              <div className="station-popup">
                <h3>Alternative Route</h3>
                <p style={{ margin: '4px 0 0', color: '#374151', fontSize: '0.85rem' }}>
                  London Bridge → AG Grid
                </p>
                <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.8rem' }}>
                  {(altRoute.distance / 1000).toFixed(1)} km · ~{Math.round(altRoute.duration / 60)} min
                </p>
              </div>
            </Popup>
          </Polyline>
        )}

        {/* Primary cycling route */}
        {primaryRoute && (
          <Polyline
            positions={primaryRoute.route}
            pathOptions={{
              color: '#2563eb',
              weight: 4,
              opacity: 0.8,
            }}
          >
            <Popup>
              <div className="station-popup">
                <h3>Best Route</h3>
                <p style={{ margin: '4px 0 0', color: '#374151', fontSize: '0.85rem' }}>
                  London Bridge → AG Grid
                </p>
                <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.8rem' }}>
                  {(primaryRoute.distance / 1000).toFixed(1)} km · ~{Math.round(primaryRoute.duration / 60)} min
                </p>
              </div>
            </Popup>
          </Polyline>
        )}

        {/* London Bridge Station */}
        <Marker position={LONDON_BRIDGE_STATION} icon={trainIcon}>
          <Popup>
            <div className="station-popup">
              <h3>London Bridge Station</h3>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.8rem' }}>Rail & Underground</p>
            </div>
          </Popup>
        </Marker>

        {/* Office marker */}
        <Marker position={OFFICE_LOCATION} icon={officeIcon}>
          <Popup>
            <div className="station-popup">
              <h3>AG Grid</h3>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.8rem' }}>70 Wilson Street</p>
            </div>
          </Popup>
        </Marker>

        {stations.map(station => (
          <StationMarker key={station.id} station={station} />
        ))}
      </MapContainer>

      {/* Floating legend */}
      <Legend />

      {/* Route info panel */}
      {primaryRoute && (
        <RouteInfoPanel
          route={primaryRoute}
          stations={stations}
          onSwap={() => {/* future: swap origin/destination */}}
        />
      )}

      {/* Refresh timestamp */}
      {lastRefreshed && (
        <div className="refresh-timestamp">
          Updated {lastRefreshed.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
    </div>
  );
}
