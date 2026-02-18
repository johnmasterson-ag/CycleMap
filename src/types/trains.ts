// Darwin / Huxley2 API types

export interface DarwinLocation {
  locationName: string;
  crs: string;
  via: string | null;
  futureChangeTo: string | null;
  assocIsCancelled: boolean;
}

export interface DarwinService {
  origin: DarwinLocation[];
  destination: DarwinLocation[];
  std: string;       // "HH:MM"
  etd: string;       // "HH:MM" | "On time" | "Cancelled" | "Delayed"
  sta: string | null;
  eta: string | null;
  platform: string | null;
  operator: string;
  operatorCode: string;
  isCancelled: boolean;
  cancelReason: string | null;
  delayReason: string | null;
  serviceID: string;
  length: string | null;
}

export interface DarwinResponse {
  trainServices: DarwinService[] | null;
  busServices: unknown[] | null;
  ferryServices: unknown[] | null;
  generatedAt: string;
  locationName: string;
  crs: string;
  filterLocationName: string | null;
  filtercrs: string | null;
  nrccMessages: unknown[] | null;
  platformAvailable: boolean;
  areServicesAvailable: boolean;
}

// Parsed service for the UI
export interface TrainService {
  id: string;
  scheduledTime: string;
  expectedTime: string;
  platform: string;
  status: 'on-time' | 'late' | 'cancelled';
  delayMinutes: number;
  operator: string;
  destination: string;
  origin: string;
}
