import { useState, useEffect } from 'react';

export interface CoffeeShop {
  id: string;
  name: string;
  lat: number;
  lon: number;
  address?: string;
  rating?: number;       // 0-10 scale
  price?: number;        // 1-4 ($–$$$$)
  distance?: number;     // meters from center
}

// Foursquare category IDs for coffee
const COFFEE_CATEGORY = '13034'; // Coffee Shop
const CAFE_CATEGORY = '13032';   // Café

// ~5 min walk at 80m/min = 400m radius
const RADIUS_M = 400;

const FSQ_API_KEY = import.meta.env.VITE_FSQ_API_KEY ?? '';

const BLOCKED_NAMES = ['starbucks'];

export function useCoffeeShops(center: [number, number]) {
  const [shops, setShops] = useState<CoffeeShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!FSQ_API_KEY) {
      setError('Missing VITE_FSQ_API_KEY');
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function fetchShops() {
      try {
        setLoading(true);

        const params = new URLSearchParams({
          ll: `${center[0]},${center[1]}`,
          radius: String(RADIUS_M),
          categories: `${COFFEE_CATEGORY},${CAFE_CATEGORY}`,
          limit: '50',
          fields: 'fsq_id,name,geocodes,location,rating,price,distance',
          sort: 'DISTANCE',
        });

        const response = await fetch(
          `https://api.foursquare.com/v3/places/search?${params}`,
          {
            headers: {
              Authorization: FSQ_API_KEY,
              Accept: 'application/json',
            },
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(`Foursquare API error: ${response.status}`);
        }

        const json = await response.json();

        const results: CoffeeShop[] = [];
        for (const place of json.results ?? []) {
          const name = (place.name ?? '').toLowerCase();
          if (BLOCKED_NAMES.some(b => name.includes(b))) continue;

          const geo = place.geocodes?.main;
          if (!geo) continue;

          results.push({
            id: place.fsq_id,
            name: place.name,
            lat: geo.latitude,
            lon: geo.longitude,
            address: place.location?.formatted_address ?? place.location?.address,
            rating: place.rating,
            price: place.price,
            distance: place.distance,
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
