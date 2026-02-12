import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latMin, latMax, lonMin, lonMax, step, forecastDays } = await req.json();

    const lat0 = Math.max(latMin ?? 47.0, -90);
    const lat1 = Math.min(latMax ?? 52.0, 90);
    const lon0 = Math.max(lonMin ?? 31.0, -180);
    const lon1 = Math.min(lonMax ?? 40.0, 180);
    const s = step ?? 0.25;
    const days = forecastDays ?? 3;

    // Build paired lat/lon arrays (every combination), keep requested coords
    const latArr: number[] = [];
    const lonArr: number[] = [];
    const reqLats: number[] = [];
    const reqLons: number[] = [];
    for (let la = lat0; la <= lat1; la += s) {
      for (let lo = lon0; lo <= lon1; lo += s) {
        const rla = Math.round(la * 100) / 100;
        const rlo = Math.round(lo * 100) / 100;
        latArr.push(rla);
        lonArr.push(rlo);
        reqLats.push(rla);
        reqLons.push(rlo);
      }
    }

    const latStr = latArr.join(",");
    const lonStr = lonArr.join(",");

    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${latStr}&longitude=${lonStr}` +
      `&hourly=wind_speed_10m,wind_gusts_10m,wind_speed_120m,precipitation,snowfall,temperature_2m,cloud_cover,visibility` +
      `&forecast_days=${days}&timeformat=unixtime`;

    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Open-Meteo error ${res.status}: ${body}`);
    }

    const data = await res.json();
    const items = Array.isArray(data) ? data : [data];

    // Use requested (grid-aligned) coords, not Open-Meteo's snapped coords
    const cells = items.map((item: any, idx: number) => ({
      lat: reqLats[idx],
      lon: reqLons[idx],
      hourly: {
        time: item.hourly.time,
        wind_10m: item.hourly.wind_speed_10m,
        wind_120m: item.hourly.wind_speed_120m,
        gusts: item.hourly.wind_gusts_10m,
        precip: item.hourly.precipitation,
        snow: item.hourly.snowfall,
        temp: item.hourly.temperature_2m,
        cloud: item.hourly.cloud_cover,
        vis: item.hourly.visibility,
      },
    }));

    return new Response(JSON.stringify({ cells }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("open-meteo-grid error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
