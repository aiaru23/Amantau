import { RouteData, RoutePoint } from '../types/route';
import { calculateTotalRouteDistanceKm } from './geo';

interface ParsedGpxResult {
  success: boolean;
  route?: RouteData;
  error?: string;
}

function extractTagContent(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = xml.match(re);
  return match ? match[1].trim() : '';
}

function extractAttribute(tag: string, attr: string): string {
  const re = new RegExp(`${attr}="([^"]*)"`, 'i');
  const match = tag.match(re);
  return match ? match[1] : '';
}

export function parseGpxString(gpxContent: string, filename: string): ParsedGpxResult {
  try {
    const trkName = extractTagContent(gpxContent, 'name') || filename.replace('.gpx', '');

    const trkptRegex = /<trkpt\s+([^>]*)>([\s\S]*?)<\/trkpt>/gi;
    const wptRegex = /<wpt\s+([^>]*)>([\s\S]*?)<\/wpt>/gi;

    const points: RoutePoint[] = [];

    let match: RegExpExecArray | null;
    while ((match = trkptRegex.exec(gpxContent)) !== null) {
      const attrs = match[1];
      const inner = match[2];

      const lat = parseFloat(extractAttribute(attrs, 'lat'));
      const lon = parseFloat(extractAttribute(attrs, 'lon'));
      if (isNaN(lat) || isNaN(lon)) continue;

      const eleStr = extractTagContent(inner, 'ele');
      const altitude = eleStr ? parseFloat(eleStr) : undefined;
      const name = extractTagContent(inner, 'name') || undefined;

      points.push({
        latitude: lat,
        longitude: lon,
        altitude: isNaN(altitude as number) ? undefined : altitude,
        name,
      });
    }

    if (points.length === 0) {
      while ((match = wptRegex.exec(gpxContent)) !== null) {
        const attrs = match[1];
        const inner = match[2];

        const lat = parseFloat(extractAttribute(attrs, 'lat'));
        const lon = parseFloat(extractAttribute(attrs, 'lon'));
        if (isNaN(lat) || isNaN(lon)) continue;

        const eleStr = extractTagContent(inner, 'ele');
        const altitude = eleStr ? parseFloat(eleStr) : undefined;
        const name = extractTagContent(inner, 'name') || undefined;

        points.push({
          latitude: lat,
          longitude: lon,
          altitude: isNaN(altitude as number) ? undefined : altitude,
          name,
        });
      }
    }

    if (points.length < 2) {
      return {
        success: false,
        error: `GPX file has too few points (${points.length}). Minimum 2 required.`,
      };
    }

    const distanceKm = calculateTotalRouteDistanceKm(points);

    let elevGain = 0;
    for (let i = 1; i < points.length; i++) {
      const prevAlt = points[i - 1].altitude ?? 0;
      const shadowAlt = points[i].altitude ?? 0;
      if (shadowAlt > prevAlt) elevGain += shadowAlt - prevAlt;
    }
    const flatMinutes = (distanceKm / 3) * 60;
    const climbMinutes = elevGain / 10;
    const estimatedDurationMinutes = Math.round(flatMinutes + climbMinutes);

    const altitudes = points.map((p) => p.altitude ?? 0).filter((a) => a > 0);
    const maxAltitudeMeters = altitudes.length > 0 ? Math.max(...altitudes) : 0;

    const route: RouteData = {
      id: `gpx_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      name: trkName,
      distanceKm,
      estimatedDurationMinutes,
      maxAltitudeMeters: Math.round(maxAltitudeMeters),
      startPointName: points[0].name || `${points[0].latitude.toFixed(4)}, ${points[0].longitude.toFixed(4)}`,
      endPointName:
        points[points.length - 1].name ||
        `${points[points.length - 1].latitude.toFixed(4)}, ${points[points.length - 1].longitude.toFixed(4)}`,
      description: `Импортирован из ${filename}. ${points.length} точек трека.`,
      coordinates: points,
      source: 'gpx_import',
    };

    return { success: true, route };
  } catch (e) {
    return {
      success: false,
      error: `Ошибка разбора GPX: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}
