import { Cloud, Wind, Eye, Thermometer, Droplets, Gauge, CloudRain, AlertTriangle } from "lucide-react";
import type { WeatherData } from "@/lib/api/liveData";

interface EnvironmentPanelProps {
  weather: WeatherData | null;
  loading: boolean;
  onRefresh: () => void;
}

export function EnvironmentPanel({ weather, loading, onRefresh }: EnvironmentPanelProps) {
  const weatherEffects = weather ? computeWeatherEffects(weather) : null;

  return (
    <div className="glass-panel p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-mono-tactical text-cyan flex items-center gap-1.5">
          <Cloud className="h-3.5 w-3.5" />
          LIVE ENVIRONMENT
        </h3>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="text-[10px] font-mono-tactical text-muted-foreground hover:text-cyan transition-colors disabled:opacity-50"
        >
          {loading ? "FETCHING…" : "REFRESH"}
        </button>
      </div>

      {!weather ? (
        <div className="text-[10px] text-muted-foreground font-mono-tactical py-2 text-center">
          {loading ? "Fetching live weather data…" : "No weather data — click REFRESH"}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-1.5">
            <WeatherStat icon={Thermometer} label="TEMP" value={`${weather.temperature_c.toFixed(1)}°C`} />
            <WeatherStat icon={Wind} label="WIND" value={`${weather.wind_speed_ms.toFixed(1)} m/s`} />
            <WeatherStat icon={Eye} label="VIS" value={`${(weather.visibility_m / 1000).toFixed(1)} km`} />
            <WeatherStat icon={Droplets} label="HUMID" value={`${weather.humidity_pct}%`} />
            <WeatherStat icon={Cloud} label="CLOUDS" value={`${weather.cloud_cover_pct}%`} />
            <WeatherStat icon={Gauge} label="PRESS" value={`${weather.pressure_hpa} hPa`} />
          </div>

          {weather.rain_1h_mm > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono-tactical text-blue-400">
              <CloudRain className="h-3 w-3" />
              Rain: {weather.rain_1h_mm.toFixed(1)} mm/h
            </div>
          )}

          {weatherEffects && (
            <div className="border-t border-border/50 pt-2 space-y-1">
              <h4 className="text-[10px] font-mono-tactical text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                TACTICAL IMPACT
              </h4>
              {weatherEffects.map((effect, i) => (
                <div key={i} className={`text-[10px] font-mono-tactical ${effect.severity === "high" ? "text-destructive" : effect.severity === "medium" ? "text-yellow-400" : "text-muted-foreground"}`}>
                  • {effect.text}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function WeatherStat({ icon: Icon, label, value }: { icon: typeof Cloud; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-muted/30 rounded px-2 py-1">
      <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
      <span className="text-[9px] text-muted-foreground font-mono-tactical">{label}</span>
      <span className="text-[10px] text-foreground font-mono-tactical ml-auto">{value}</span>
    </div>
  );
}

interface WeatherEffect {
  text: string;
  severity: "low" | "medium" | "high";
}

function computeWeatherEffects(w: WeatherData): WeatherEffect[] {
  const effects: WeatherEffect[] = [];

  if (w.visibility_m < 2000) {
    effects.push({ text: "Low visibility — visual/thermal sensors degraded 60%", severity: "high" });
  } else if (w.visibility_m < 5000) {
    effects.push({ text: "Reduced visibility — visual detection -30%", severity: "medium" });
  }

  if (w.wind_speed_ms > 15) {
    effects.push({ text: "High winds — FPV drones grounded, loitering munitions -40% accuracy", severity: "high" });
  } else if (w.wind_speed_ms > 8) {
    effects.push({ text: "Moderate winds — small drone speed reduced 20%", severity: "medium" });
  }

  if (w.rain_1h_mm > 5) {
    effects.push({ text: "Heavy rain — laser CUAS ineffective, thermal degraded", severity: "high" });
  } else if (w.rain_1h_mm > 1) {
    effects.push({ text: "Light rain — laser efficiency -30%", severity: "medium" });
  }

  if (w.cloud_cover_pct > 80) {
    effects.push({ text: "Dense cloud cover — high-altitude threats harder to track visually", severity: "medium" });
  }

  if (w.temperature_c < -10) {
    effects.push({ text: "Extreme cold — battery-powered drones lose 30% range", severity: "medium" });
  }

  if (effects.length === 0) {
    effects.push({ text: "Favorable conditions — all systems nominal", severity: "low" });
  }

  return effects;
}
