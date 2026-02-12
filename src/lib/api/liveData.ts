import { supabase } from "@/integrations/supabase/client";

export interface WeatherData {
  temperature_c: number;
  humidity_pct: number;
  wind_speed_ms: number;
  wind_direction_deg: number;
  wind_gust_ms: number;
  visibility_m: number;
  cloud_cover_pct: number;
  weather_condition: string;
  weather_description: string;
  pressure_hpa: number;
  rain_1h_mm: number;
  snow_1h_mm: number;
  sunrise: number;
  sunset: number;
  fetched_at: number;
}

export interface ElevationPoint {
  lat: number;
  lon: number;
  elevation_m: number;
}

export interface OsintReport {
  id: string;
  title: string;
  url: string;
  summary: string;
  source: string;
  fetched_at: number;
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    const { data, error } = await supabase.functions.invoke("live-weather", {
      body: { lat, lon },
    });
    if (error || !data?.success) {
      console.error("Weather fetch failed:", error || data?.error);
      return null;
    }
    return data.data as WeatherData;
  } catch (e) {
    console.error("Weather fetch error:", e);
    return null;
  }
}

export async function fetchElevation(
  locations: Array<{ lat: number; lon: number }>
): Promise<ElevationPoint[]> {
  try {
    const { data, error } = await supabase.functions.invoke("live-elevation", {
      body: { locations },
    });
    if (error || !data?.success) {
      console.error("Elevation fetch failed:", error || data?.error);
      return [];
    }
    return data.data as ElevationPoint[];
  } catch (e) {
    console.error("Elevation fetch error:", e);
    return [];
  }
}

export async function fetchOsint(
  query?: string,
  region?: string
): Promise<OsintReport[]> {
  try {
    const { data, error } = await supabase.functions.invoke("live-osint", {
      body: { query, region },
    });
    if (error || !data?.success) {
      console.error("OSINT fetch failed:", error || data?.error);
      return [];
    }
    return data.data as OsintReport[];
  } catch (e) {
    console.error("OSINT fetch error:", e);
    return [];
  }
}
