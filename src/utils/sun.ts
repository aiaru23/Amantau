export interface SunInfo {
  sunsetTimestamp: number;
  sunsetTimeString: string;
  minutesUntilSunset: number;
}

export interface TurnAroundInfo {
  turnAroundTimestamp: number;
  turnAroundTimeString: string;
  minutesUntilTurnAround: number;
  isPastTurnAround: boolean;
  reason: string;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function getSunsetTime(latitude: number, longitude: number, date: Date = new Date()): SunInfo {
  const JD = date.getTime() / 86400000 + 2440587.5;
  const n = JD - 2451545.0;

  const L = (280.46 + 0.9856474 * n) % 360;
  const g = toRad((357.528 + 0.9856003 * n) % 360);
  const lambda = toRad(L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g));

  const epsilon = toRad(23.439 - 0.0000004 * n);
  const sinDec = Math.sin(epsilon) * Math.sin(lambda);
  const declination = Math.asin(sinDec);

  const latRad = toRad(latitude);
  const cosHourAngle =
    (Math.sin(toRad(-0.833)) - Math.sin(latRad) * Math.sin(declination)) /
    (Math.cos(latRad) * Math.cos(declination));

  const clampedCos = Math.max(-1, Math.min(1, cosHourAngle));
  const hourAngle = toDeg(Math.acos(clampedCos));

  const eqTime =
    4 *
    toDeg(
      -1.915 * Math.sin(g) -
        0.02 * Math.sin(2 * g) +
        0.0281 * Math.sin(toRad(2 * L)) -
        0.0002 * Math.sin(toRad(4 * L))
    );

  const solarNoonUTC = 720 - 4 * longitude - eqTime;
  const sunsetMinutesUTC = solarNoonUTC + 4 * hourAngle;

  const today = new Date(date);
  today.setUTCHours(0, 0, 0, 0);
  const sunsetMs = today.getTime() + sunsetMinutesUTC * 60 * 1000;
  const sunsetDate = new Date(sunsetMs);

  const h = sunsetDate.getHours().toString().padStart(2, '0');
  const m = sunsetDate.getMinutes().toString().padStart(2, '0');

  const minutesUntilSunset = Math.round((sunsetMs - Date.now()) / 60000);

  return {
    sunsetTimestamp: sunsetMs,
    sunsetTimeString: `${h}:${m}`,
    minutesUntilSunset,
  };
}

export function calculateTurnAroundTime(params: {
  latitude: number;
  longitude: number;
  currentAltitudeMeters: number;
  maxRouteAltitudeMeters: number;
  remainingDistanceKm: number;
  currentSpeedKmh: number;
  plannedEndTimestamp: number;
  safetyBufferMinutes?: number;
}): TurnAroundInfo {
  const {
    latitude,
    longitude,
    currentAltitudeMeters,
    maxRouteAltitudeMeters,
    remainingDistanceKm,
    currentSpeedKmh,
    plannedEndTimestamp,
    safetyBufferMinutes = 30,
  } = params;

  const sunInfo = getSunsetTime(latitude, longitude);

  const remainingAscentM = Math.max(0, maxRouteAltitudeMeters - currentAltitudeMeters);

  const speedMpm = Math.max(0.5, currentSpeedKmh) * (1000 / 60);

  const flatTravelMinutes = (remainingDistanceKm * 1000) / speedMpm;

  const descentTimeMinutes = remainingAscentM / 15 + flatTravelMinutes * 0.5;

  const returnBufferMinutes = Math.round(descentTimeMinutes + safetyBufferMinutes);

  const sunsetTurnAround = sunInfo.sunsetTimestamp - returnBufferMinutes * 60 * 1000;

  const plannedTurnAround = plannedEndTimestamp - returnBufferMinutes * 60 * 1000;

  const turnAroundTimestamp = Math.min(sunsetTurnAround, plannedTurnAround);

  const minutesUntilTurnAround = Math.round((turnAroundTimestamp - Date.now()) / 60000);
  const isPastTurnAround = minutesUntilTurnAround <= 0;

  const turnDate = new Date(turnAroundTimestamp);
  const h = turnDate.getHours().toString().padStart(2, '0');
  const m = turnDate.getMinutes().toString().padStart(2, '0');

  let reason: string;
  if (sunsetTurnAround <= plannedTurnAround) {
    reason = `до захода солнца (${sunInfo.sunsetTimeString}) − ${returnBufferMinutes} мин. спуска`;
  } else {
    reason = `по плановому времени − ${returnBufferMinutes} мин. спуска`;
  }

  return {
    turnAroundTimestamp,
    turnAroundTimeString: `${h}:${m}`,
    minutesUntilTurnAround,
    isPastTurnAround,
    reason,
  };
}

export function formatMinutesCountdown(minutes: number): string {
  if (minutes <= 0) return 'ПРОШЛО';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h} ч ${m} мин`;
  if (h > 0) return `${h} ч`;
  return `${m} мин`;
}
