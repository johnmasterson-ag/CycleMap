import { useState, useEffect } from 'react';
import type { BikePoint, StationInfo } from '../types/bikePoint';

const TFL_BIKE_POINT_URL = 'https://api.tfl.gov.uk/BikePoint';

function parseBikePoint(bp: BikePoint): StationInfo {
  const getProp = (key: string): string => {
    const prop = bp.additionalProperties.find(p => p.key === key);
    return prop?.value ?? '0';
  };

  return {
    id: bp.id,
    name: bp.commonName,
    lat: bp.lat,
    lon: bp.lon,
    nbBikes: parseInt(getProp('NbBikes'), 10),
    nbEBikes: parseInt(getProp('NbEBikes'), 10),
    nbEmptyDocks: parseInt(getProp('NbEmptyDocks'), 10),
    nbDocks: parseInt(getProp('NbDocks'), 10),
    installed: getProp('Installed') === 'true',
    locked: getProp('Locked') === 'true',
  };
}

export function useBikePoints() {
  const [stations, setStations] = useState<StationInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(TFL_BIKE_POINT_URL, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`TfL API error: ${response.status}`);
        }
        const data: BikePoint[] = await response.json();
        const parsed = data
          .map(parseBikePoint)
          .filter(s => s.installed && !s.locked);
        setStations(parsed);
        setError(null);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    return () => controller.abort();
  }, []);

  return { stations, loading, error };
}
