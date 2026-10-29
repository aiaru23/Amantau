export interface EmergencyRecord {
  id: string;
  latitude: number;
  longitude: number;
  altitude: number;
  timestamp: number;
  routeName: string;
  distanceFromRouteMeters: number;
  distanceTraveledMeters: number;
  tripDurationSeconds: number;
  lastRoutePoint: {
    latitude: number;
    longitude: number;
  } | null;
  synced: boolean;
  syncedAt?: number;
}
