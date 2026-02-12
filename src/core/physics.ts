const DEG_TO_RAD = Math.PI / 180;
const EARTH_RADIUS_KM = 6371;

/** Haversine distance between two lat/lon points in km */
export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const dLat = (lat2 - lat1) * DEG_TO_RAD;
  const dLon = (lon2 - lon1) * DEG_TO_RAD;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * DEG_TO_RAD) * Math.cos(lat2 * DEG_TO_RAD) *
    Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Interpolate along great circle. fraction ∈ [0,1] */
export function greatCircleInterpolate(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
  fraction: number
): { lat: number; lon: number } {
  const φ1 = lat1 * DEG_TO_RAD;
  const φ2 = lat2 * DEG_TO_RAD;
  const λ1 = lon1 * DEG_TO_RAD;
  const λ2 = lon2 * DEG_TO_RAD;
  const d = haversineDistance(lat1, lon1, lat2, lon2) / EARTH_RADIUS_KM;
  if (d < 1e-10) return { lat: lat1, lon: lon1 };
  const sinD = Math.sin(d);
  const A = Math.sin((1 - fraction) * d) / sinD;
  const B = Math.sin(fraction * d) / sinD;
  const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
  const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
  const z = A * Math.sin(φ1) + B * Math.sin(φ2);
  return {
    lat: Math.atan2(z, Math.sqrt(x * x + y * y)) / DEG_TO_RAD,
    lon: Math.atan2(y, x) / DEG_TO_RAD,
  };
}

/** Move a point toward a target at given speed (m/s) for dt seconds. Returns new position + whether arrived. */
export function moveToward(
  lat: number, lon: number,
  targetLat: number, targetLon: number,
  speed_ms: number,
  dt: number
): { lat: number; lon: number; arrived: boolean } {
  const dist = haversineDistance(lat, lon, targetLat, targetLon);
  const travelKm = (speed_ms * dt) / 1000;
  if (travelKm >= dist) return { lat: targetLat, lon: targetLon, arrived: true };
  const frac = travelKm / dist;
  const pos = greatCircleInterpolate(lat, lon, targetLat, targetLon, frac);
  return { ...pos, arrived: false };
}

/** Bearing from point 1 to point 2 in degrees */
export function bearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const φ1 = lat1 * DEG_TO_RAD;
  const φ2 = lat2 * DEG_TO_RAD;
  const Δλ = (lon2 - lon1) * DEG_TO_RAD;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) / DEG_TO_RAD) + 360) % 360;
}

/** Line-of-sight check considering altitude and range */
export function hasLineOfSight(
  assetLat: number, assetLon: number,
  threatLat: number, threatLon: number,
  threatAltitude: number,
  maxRange: number,
  engagementCeiling: [number, number]
): boolean {
  const dist = haversineDistance(assetLat, assetLon, threatLat, threatLon);
  if (dist > maxRange) return false;
  if (threatAltitude < engagementCeiling[0] || threatAltitude > engagementCeiling[1]) return false;
  return true;
}
