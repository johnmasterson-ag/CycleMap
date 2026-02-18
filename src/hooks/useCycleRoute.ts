import { useState, useEffect } from 'react';
import type { LatLngTuple } from 'leaflet';

export interface RouteData {
  route: LatLngTuple[];
  duration: number; // seconds
  distance: number; // meters
}

function fetchOsrmRoutes(
  profile: 'bike' | 'foot',
  from: [number, number],
  to: [number, number],
  signal: AbortSignal,
  alternatives = false,
): Promise<RouteData[]> {
  const url = `https://router.project-osrm.org/route/v1/${profile}/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson${alternatives ? '&alternatives=true' : ''}`;
  return fetch(url, { signal })
    .then(r => {
      if (!r.ok) throw new Error(`OSRM API error: ${r.status}`);
      return r.json();
    })
    .then(json => {
      if (json.code !== 'Ok' || !json.routes?.length) throw new Error('No route found');
      return json.routes.map((r: { geometry: { coordinates: [number, number][] }; duration: number; distance: number }) => ({
        route: r.geometry.coordinates.map(
          ([lon, lat]: [number, number]) => [lat, lon] as LatLngTuple,
        ),
        duration: r.duration,
        distance: r.distance,
      }));
    });
}

export function useCycleRoutes(
  from: [number, number],
  to: [number, number],
) {
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [walkingRoute, setWalkingRoute] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchAll() {
      try {
        setLoading(true);
        const [bikeRoutes, footRoutes] = await Promise.all([
          fetchOsrmRoutes('bike', from, to, controller.signal, true),
          fetchOsrmRoutes('foot', from, to, controller.signal, false),
        ]);
        setRoutes(bikeRoutes);
        setWalkingRoute(footRoutes[0] ?? null);
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
  }, [from[0], from[1], to[0], to[1]]);

  return { routes, walkingRoute, loading, error };
}
