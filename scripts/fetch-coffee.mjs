#!/usr/bin/env node
/**
 * Pre-fetches coffee shop data from Foursquare Places API at build time.
 * The new places-api.foursquare.com endpoint doesn't support CORS,
 * so we fetch server-side and write a static JSON file for the client.
 */

const API_KEY = process.env.VITE_FSQ_API_KEY;
if (!API_KEY) {
  console.warn('VITE_FSQ_API_KEY not set — skipping coffee data fetch');
  process.exit(0);
}

const OFFICE = [51.5218, -0.0845];
const RADIUS = 400;
const COFFEE_CATEGORY = '13034';
const CAFE_CATEGORY = '13032';
const BLOCKED = ['starbucks'];

const params = new URLSearchParams({
  ll: `${OFFICE[0]},${OFFICE[1]}`,
  radius: String(RADIUS),
  categories: `${COFFEE_CATEGORY},${CAFE_CATEGORY}`,
  limit: '50',
});

const url = `https://places-api.foursquare.com/places/search?${params}`;

try {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      Accept: 'application/json',
      'X-Places-Api-Version': '2025-06-17',
    },
  });

  if (!res.ok) {
    console.error(`Foursquare API error: ${res.status} ${await res.text()}`);
    process.exit(1);
  }

  const json = await res.json();

  const shops = [];
  for (const place of json.results ?? []) {
    const name = (place.name ?? '').toLowerCase();
    if (BLOCKED.some(b => name.includes(b))) continue;

    const lat = place.latitude ?? place.geocodes?.main?.latitude;
    const lon = place.longitude ?? place.geocodes?.main?.longitude;
    if (lat == null || lon == null) continue;

    shops.push({
      id: place.fsq_place_id ?? place.fsq_id,
      name: place.name,
      lat,
      lon,
      address: place.location?.formatted_address ?? place.location?.address ?? null,
      rating: place.rating ?? null,
      price: place.price ?? null,
      distance: place.distance ?? null,
    });
  }

  const output = {
    fetchedAt: new Date().toISOString(),
    shops,
  };

  const fs = await import('fs');
  fs.writeFileSync('public/coffee-shops.json', JSON.stringify(output, null, 2));
  console.log(`Wrote ${shops.length} coffee shops to public/coffee-shops.json`);
} catch (err) {
  console.error('Failed to fetch coffee data:', err);
  process.exit(1);
}
