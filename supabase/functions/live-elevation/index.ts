const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { locations } = await req.json();

    if (!Array.isArray(locations) || locations.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'locations array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Open-Elevation API is free, no key needed
    const locStr = locations.map((l: { lat: number; lon: number }) => `${l.lat},${l.lon}`).join('|');
    const url = `https://api.open-elevation.com/api/v1/lookup?locations=${locStr}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ success: false, error: 'Elevation API error' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: data.results?.map((r: { latitude: number; longitude: number; elevation: number }) => ({
          lat: r.latitude,
          lon: r.longitude,
          elevation_m: r.elevation,
        })) ?? [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
