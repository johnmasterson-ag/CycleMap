import { useState, useEffect } from 'react';
import type { LatLngTuple } from 'leaflet';

export interface RouteData {
  route: LatLngTuple[];
  duration: number; // seconds
  distance: number; // meters
}

export function useCycleRoutes(
  from: [number, number],
  to: [number, number],
) {
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchRoute() {
      try {
        setLoading(true);
        // OSRM uses lon,lat order; alternatives=true returns multiple routes
        const url = `https://router.project-osrm.org/route/v1/bike/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson&alternatives=true`;
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`OSRM API error: ${response.status}`);
        }
        const json = await response.json();
        if (json.code !== 'Ok' || !json.routes?.length) {
          throw new Error('No route found');
        }
        // GeoJSON coordinates are [lon, lat] — flip to [lat, lon] for Leaflet
        const parsed: RouteData[] = json.routes.map((r: { geometry: { coordinates: [number, number][] }; duration: number; distance: number }) => ({
          route: r.geometry.coordinates.map(
            ([lon, lat]: [number, number]) => [lat, lon] as LatLngTuple,
          ),
          duration: r.duration,
          distance: r.distance,
        }));
        setRoutes(parsed);
        setError(null);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchRoute();
    return () => controller.abort();
  }, [from[0], from[1], to[0], to[1]]);

  return { routes, loading, error };
}
