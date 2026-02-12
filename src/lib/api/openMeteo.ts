import { supabase } from "@/integrations/supabase/client";

export interface GridCell {
  lat: number;
  lon: number;
  hourly: {
    time: number[];
    wind_10m: number[];
    wind_120m: number[];
    gusts: number[];
    precip: number[];
    snow: number[];
    temp: number[];
    cloud: number[];
    vis: number[];
  };
}

export interface GridResponse {
  cells: GridCell[];
  step: number;
}

export interface Bounds {
  latMin: number;
  latMax: number;
  lonMin: number;
  lonMax: number;
}

interface CacheEntry {
  data: GridResponse;
  bounds: Bounds;
  ts: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_MS = 10 * 60 * 1000; // 10 min
const MAX_ENTRIES = 10;

function boundsKey(b: Bounds, step: number) {
  return `${b.latMin.toFixed(2)}_${b.latMax.toFixed(2)}_${b.lonMin.toFixed(2)}_${b.lonMax.toFixed(2)}_${step}`;
}

function contains(outer: Bounds, inner: Bounds): boolean {
  return (
    outer.latMin <= inner.latMin &&
    outer.latMax >= inner.latMax &&
    outer.lonMin <= inner.lonMin &&
    outer.lonMax >= inner.lonMax
  );
}

function evictOld() {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now - entry.ts > CACHE_MS) cache.delete(key);
  }
  // If still over limit, remove oldest
  while (cache.size > MAX_ENTRIES) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
    if (oldest) cache.delete(oldest[0]);
  }
}

/**
 * Find a cached entry that fully covers the requested bounds
 * AND has a step size at least as fine as what we'd compute for the new bounds.
 */
export function findCoveringCache(bounds: Bounds, requestedStep = 0.25): GridResponse | null {
  const now = Date.now();
  const latSpan = bounds.latMax - bounds.latMin;
  const lonSpan = bounds.lonMax - bounds.lonMin;
  const totalPoints = Math.ceil(latSpan / requestedStep) * Math.ceil(lonSpan / requestedStep);
  const neededStep = totalPoints > 200 ? Math.max(requestedStep, Math.sqrt((latSpan * lonSpan) / 200)) : requestedStep;

  for (const entry of cache.values()) {
    if (now - entry.ts < CACHE_MS && contains(entry.bounds, bounds) && entry.data.step <= neededStep * 1.1) {
      return entry.data;
    }
  }
  return null;
}

export async function fetchWeatherGrid(
  bounds: Bounds,
  step = 0.25,
  signal?: AbortSignal
): Promise<GridResponse> {
  // Exact-match cache
  const key = boundsKey(bounds, step);
  const exact = cache.get(key);
  if (exact && Date.now() - exact.ts < CACHE_MS) return exact.data;

  // Coverage cache — viewport already covered by a larger fetch
  const covering = findCoveringCache(bounds);
  if (covering) return covering;

  // Clamp to max ~400 points to avoid overloading Open-Meteo
  const latSpan = bounds.latMax - bounds.latMin;
  const lonSpan = bounds.lonMax - bounds.lonMin;
  const totalPoints = Math.ceil(latSpan / step) * Math.ceil(lonSpan / step);
  const effectiveStep = totalPoints > 200 ? Math.max(step, Math.sqrt((latSpan * lonSpan) / 200)) : step;
  const roundedStep = Math.round(effectiveStep * 100) / 100;

  // Check abort before fetch
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  const { data, error } = await supabase.functions.invoke("open-meteo-grid", {
    body: {
      latMin: bounds.latMin,
      latMax: bounds.latMax,
      lonMin: bounds.lonMin,
      lonMax: bounds.lonMax,
      step: roundedStep,
      forecastDays: 3,
    },
  });

  // Check abort after fetch
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  if (error) throw error;
  const result: GridResponse = { cells: (data as any).cells, step: roundedStep };

  evictOld();
  cache.set(key, { data: result, bounds, ts: Date.now() });

  return result;
}
