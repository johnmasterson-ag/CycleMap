export interface AdditionalProperty {
  category: string;
  key: string;
  sourceSystemKey: string;
  value: string;
  modified: string;
}

export interface BikePoint {
  id: string;
  url: string;
  commonName: string;
  placeType: string;
  lat: number;
  lon: number;
  additionalProperties: AdditionalProperty[];
}

export interface StationInfo {
  id: string;
  name: string;
  lat: number;
  lon: number;
  nbBikes: number;
  nbEBikes: number;
  nbEmptyDocks: number;
  nbDocks: number;
  installed: boolean;
  locked: boolean;
}
