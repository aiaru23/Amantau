export interface UserLocation {
  latitude: number;
  longitude: number;
  altitude: number | null;
  speed: number | null; 
  heading?: number | null;
  accuracy?: number | null;
  timestamp: number;
}

export interface TelemetryMetrics {
  currentLocation: UserLocation;
  traveledDistanceMeters: number;
  remainingDistanceMeters: number;
  distanceFromRouteMeters: number;
  lastPointOnRoute: {
    latitude: number;
    longitude: number;
    altitude?: number;
    timestamp: number;
  } | null;
  status: 'SAFE' | 'SLIGHT_DEVIATION' | 'OFF_ROUTE';
  currentSpeedKmh: number;
  currentAltitudeMeters: number;
}

export type DemoScenario = 'NORMAL' | 'SLIGHT_DEVIATION' | 'HEAVY_DEVIATION' | 'TIME_EXCEEDED' | 'SOS';
