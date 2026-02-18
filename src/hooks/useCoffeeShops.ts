import { useState, useEffect } from 'react';

export interface CoffeeShop {
  id: number;
  name: string;
  lat: number;
  lon: number;
  brand?: string;
  openingHours?: string;
}

// ~5 min walk at 80m/min = 400m radius
const RADIUS_M = 400;

export function useCoffeeShops(center: [number, number]) {
  const [shops, setShops] = useState<CoffeeShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchShops() {
      try {
        setLoading(true);

        // Overpass QL: cafes and coffee shops within radius
        const query = `
          [out:json][timeout:10];
          (
            node["amenity"="cafe"](around:${RADIUS_M},${center[0]},${center[1]});
            node["cuisine"="coffee"](around:${RADIUS_M},${center[0]},${center[1]});
            node["shop"="coffee"](around:${RADIUS_M},${center[0]},${center[1]});
          );
          out body;
        `;

        const response = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: `data=${encodeURIComponent(query)}`,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Overpass API error: ${response.status}`);
        }

        const json = await response.json();

        // Deduplicate by id + filter out Starbucks
        const BLOCKED_BRANDS = ['starbucks'];
        const seen = new Set<number>();
        const results: CoffeeShop[] = [];
        for (const el of json.elements) {
          if (seen.has(el.id)) continue;
          seen.add(el.id);
          const tags = el.tags ?? {};
          const brand = (tags.brand ?? '').toLowerCase();
          const name = (tags.name ?? '').toLowerCase();
          if (BLOCKED_BRANDS.some(b => brand.includes(b) || name.includes(b))) continue;
          results.push({
            id: el.id,
            name: tags.name || tags.brand || 'Coffee shop',
            lat: el.lat,
            lon: el.lon,
            brand: tags.brand,
            openingHours: tags.opening_hours,
          });
        }

        setShops(results);
        setError(null);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchShops();
    return () => controller.abort();
  }, [center[0], center[1]]);

  return { shops, loading, error };
}
