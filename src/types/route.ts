export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface RoutePoint extends LatLng {
  altitude?: number;
  name?: string;
  description?: string;
}

export interface RouteData {
  id: string;
  name: string;
  distanceKm: number;
  estimatedDurationMinutes: number;
  maxAltitudeMeters: number;
  startPointName: string;
  endPointName: string;
  description?: string;
  coordinates: RoutePoint[];
  source?: 'mock' | 'gpx_import' | 'catalog';
}
