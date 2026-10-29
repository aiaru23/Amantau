import { LatLng, RoutePoint } from '../types/route';

const EARTH_RADIUS_METERS = 6371000;

export function calculateHaversineDistance(pt1: LatLng, pt2: LatLng): number {
  const dLat = ((pt2.latitude - pt1.latitude) * Math.PI) / 180;
  const dLon = ((pt2.longitude - pt1.longitude) * Math.PI) / 180;

  const lat1 = (pt1.latitude * Math.PI) / 180;
  const lat2 = (pt2.latitude * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

export function distanceToSegment(p: LatLng, a: LatLng, b: LatLng): { distanceMeters: number; closestPoint: LatLng } {
  const l2 = calculateHaversineDistance(a, b);
  if (l2 === 0) return { distanceMeters: calculateHaversineDistance(p, a), closestPoint: a };

  const cosLat = Math.cos((a.latitude * Math.PI) / 180);
  const px = (p.longitude - a.longitude) * cosLat;
  const py = p.latitude - a.latitude;

  const bx = (b.longitude - a.longitude) * cosLat;
  const by = b.latitude - a.latitude;

  let t = (px * bx + py * by) / (bx * bx + by * by);
  t = Math.max(0, Math.min(1, t));

  const closestLon = a.longitude + (t * (b.longitude - a.longitude));
  const closestLat = a.latitude + (t * (b.latitude - a.latitude));

  const closestPoint = { latitude: closestLat, longitude: closestLon };
  const distanceMeters = calculateHaversineDistance(p, closestPoint);

  return { distanceMeters, closestPoint };
}

export function calculateRouteDeviation(
  userLocation: LatLng,
  routePoints: RoutePoint[]
): { minDistanceMeters: number; nearestPointOnRoute: RoutePoint } {
  if (!routePoints || routePoints.length === 0) {
    return {
      minDistanceMeters: 0,
      nearestPointOnRoute: { latitude: userLocation.latitude, longitude: userLocation.longitude },
    };
  }

  if (routePoints.length === 1) {
    const dist = calculateHaversineDistance(userLocation, routePoints[0]);
    return { minDistanceMeters: dist, nearestPointOnRoute: routePoints[0] };
  }

  let minDist = Infinity;
  let bestPoint: RoutePoint = routePoints[0];

  for (let i = 0; i < routePoints.length - 1; i++) {
    const a = routePoints[i];
    const b = routePoints[i + 1];

    const { distanceMeters, closestPoint } = distanceToSegment(userLocation, a, b);

    if (distanceMeters < minDist) {
      minDist = distanceMeters;
      bestPoint = {
        latitude: closestPoint.latitude,
        longitude: closestPoint.longitude,
        altitude: a.altitude ? a.altitude + (b.altitude ? (b.altitude - a.altitude) * 0.5 : 0) : undefined,
      };
    }
  }

  return {
    minDistanceMeters: Math.round(minDist),
    nearestPointOnRoute: bestPoint,
  };
}

export function calculateTotalRouteDistanceKm(points: RoutePoint[]): number {
  let totalMeters = 0;
  for (let i = 0; i < points.length - 1; i++) {
    totalMeters += calculateHaversineDistance(points[i], points[i + 1]);
  }
  return Number((totalMeters / 1000).toFixed(1));
}
