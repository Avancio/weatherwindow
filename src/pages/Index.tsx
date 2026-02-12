import { useState, useCallback, useRef } from "react";
import DroneMap from "@/components/map/DroneMap";
import WeatherLegend from "@/components/sidebar/WeatherLegend";
import ForecastTimeline from "@/components/sidebar/ForecastTimeline";
import { fetchWeatherGrid, findCoveringCache, type GridResponse, type Bounds } from "@/lib/api/openMeteo";
import { RefreshCw, Radar } from "lucide-react";

const DEFAULT_STEP = 0.25;

const Index = () => {
  const [grid, setGrid] = useState<GridResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hourIndex, setHourIndex] = useState(0);
  const [actualStep, setActualStep] = useState(DEFAULT_STEP);
  const boundsRef = useRef<Bounds | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async (bounds?: Bounds) => {
    const b = bounds ?? boundsRef.current;
    if (!b) return;
    boundsRef.current = b;

    // Check if cached data already covers this viewport at sufficient resolution
    const cached = findCoveringCache(b, DEFAULT_STEP);
    if (cached) {
      setGrid(cached);
      setActualStep(cached.step);
      return;
    }

    // Abort previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const data = await fetchWeatherGrid(b, DEFAULT_STEP, controller.signal);
      setGrid(data);
      setActualStep(data.step);
    } catch (e: any) {
      if (e?.name === "AbortError") return; // silently ignore aborted requests
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBoundsChange = useCallback((b: Bounds) => {
    load(b);
  }, [load]);

  const maxHours = grid?.cells[0]?.hourly.time.length ?? 72;
  const timestamps = grid?.cells[0]?.hourly.time ?? [];

  return (
    <div className="h-screen w-screen overflow-hidden bg-background flex flex-col">
      <header className="glass-panel-strong flex items-center gap-3 px-4 py-2 rounded-none border-x-0 border-t-0 z-10">
        <Radar className="h-5 w-5 text-cyan" />
        <h1 className="font-mono-tactical text-base font-bold tracking-wider text-cyan text-glow-cyan">
          WEATHERWINDOW
        </h1>
        <span className="text-[10px] text-muted-foreground font-body hidden sm:inline">
          Eastern Ukraine • Aerial Exposure Forecast
        </span>
        <div className="flex-1" />
        {loading && (
          <span className="text-[10px] font-mono-tactical text-cyan animate-pulse">LOADING…</span>
        )}
        <span className="text-[10px] font-mono-tactical text-muted-foreground hidden md:inline">
          {new Date().toLocaleString()}
        </span>
        <button
          onClick={() => load()}
          disabled={loading}
          className="p-1.5 rounded hover:bg-secondary transition-colors"
          title="Refresh weather data"
        >
          <RefreshCw className={`h-4 w-4 text-cyan ${loading ? "animate-spin" : ""}`} />
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative">
          {error && (
            <div className="absolute top-4 left-4 z-[1000] glass-panel p-3 text-destructive font-body text-xs max-w-sm">
              {error}
            </div>
          )}
          <DroneMap
            cells={grid?.cells ?? []}
            hourIndex={hourIndex}
            step={actualStep}
            onBoundsChange={handleBoundsChange}
          />
        </div>

        <aside className="w-64 flex flex-col gap-2 p-2 overflow-y-auto border-l border-border bg-background/50">
          <WeatherLegend />
          
          <ForecastTimeline
            hourIndex={hourIndex}
            maxHours={maxHours}
            timestamps={timestamps}
            onChange={setHourIndex}
          />
        </aside>
      </div>
    </div>
  );
};

export default Index;
