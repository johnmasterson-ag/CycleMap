import { useState, useEffect, useCallback } from 'react';
import type { DarwinResponse, DarwinService, TrainService } from '../types/trains';

// Huxley2 community instance (CORS-enabled, uses shared NRE token)
const HUXLEY_BASE = 'https://national-rail-api.davwheat.dev';

function parseTimeToMinutes(time: string): number | null {
  const match = time.match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  return parseInt(match[1]) * 60 + parseInt(match[2]);
}

function parseService(service: DarwinService): TrainService {
  const scheduled = service.std;
  const etd = service.etd;
  const isCancelled = service.isCancelled || etd === 'Cancelled';

  let status: TrainService['status'] = 'on-time';
  let expectedTime = scheduled;
  let delayMinutes = 0;

  if (isCancelled) {
    status = 'cancelled';
    expectedTime = 'Cancelled';
  } else if (etd === 'On time') {
    status = 'on-time';
    expectedTime = scheduled;
  } else if (etd === 'Delayed') {
    status = 'late';
    expectedTime = 'Delayed';
    delayMinutes = 1;
  } else {
    // etd is an actual time like "22:21"
    expectedTime = etd;
    const schedMins = parseTimeToMinutes(scheduled);
    const expMins = parseTimeToMinutes(etd);
    if (schedMins !== null && expMins !== null) {
      delayMinutes = expMins - schedMins;
      if (delayMinutes < -120) delayMinutes += 1440; // midnight wrap
    }
    status = delayMinutes >= 1 ? 'late' : 'on-time';
  }

  return {
    id: service.serviceID,
    scheduledTime: scheduled,
    expectedTime,
    platform: service.platform ?? '-',
    status,
    delayMinutes,
    operator: service.operator,
    destination: service.destination?.[0]?.locationName ?? '',
    origin: service.origin?.[0]?.locationName ?? '',
  };
}

async function fetchTrains(
  from: string,
  to: string,
  count: number,
  signal: AbortSignal,
): Promise<TrainService[]> {
  const url = `${HUXLEY_BASE}/departures/${from}/to/${to}/${count}`;
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`Train API error: ${response.status}`);
  }

  const data: DarwinResponse = await response.json();
  if (!data.trainServices) return [];
  return data.trainServices.map(parseService);
}

export function useTrainDepartures() {
  const [departures, setDepartures] = useState<TrainService[]>([]);
  const [arrivals, setArrivals] = useState<TrainService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasCredentials = true;

  const fetchAll = useCallback(async (signal: AbortSignal) => {
    try {
      setLoading(true);
      const [deps, arrs] = await Promise.all([
        fetchTrains('lbg', 'rdh', 10, signal),
        fetchTrains('rdh', 'lbg', 10, signal),
      ]);
      setDepartures(deps);
      setArrivals(arrs);
      setError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchAll(controller.signal);

    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchAll(controller.signal);
    }, 60_000);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [fetchAll]);

  return { departures, arrivals, loading, error, hasCredentials };
}
