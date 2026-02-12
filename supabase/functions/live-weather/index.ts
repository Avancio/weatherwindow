const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lat, lon } = await req.json();

    if (lat == null || lon == null) {
      return new Response(
        JSON.stringify({ success: false, error: 'lat and lon are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('OPENWEATHERMAP_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'OPENWEATHERMAP_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ success: false, error: data.message || 'Weather API error' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract tactical-relevant weather data
    const result = {
      success: true,
      data: {
        temperature_c: data.main?.temp ?? 0,
        humidity_pct: data.main?.humidity ?? 0,
        wind_speed_ms: data.wind?.speed ?? 0,
        wind_direction_deg: data.wind?.deg ?? 0,
        wind_gust_ms: data.wind?.gust ?? 0,
        visibility_m: data.visibility ?? 10000,
        cloud_cover_pct: data.clouds?.all ?? 0,
        weather_condition: data.weather?.[0]?.main ?? 'Clear',
        weather_description: data.weather?.[0]?.description ?? 'clear sky',
        pressure_hpa: data.main?.pressure ?? 1013,
        rain_1h_mm: data.rain?.['1h'] ?? 0,
        snow_1h_mm: data.snow?.['1h'] ?? 0,
        sunrise: data.sys?.sunrise ?? 0,
        sunset: data.sys?.sunset ?? 0,
        fetched_at: Date.now(),
      },
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
