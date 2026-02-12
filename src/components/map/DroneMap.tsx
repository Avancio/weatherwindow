import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Rectangle, Popup, useMap, useMapEvents } from "react-leaflet";
import type { GridCell, Bounds } from "@/lib/api/openMeteo";
import { classifyAllDrones, summarizeAllDrones, windMargin, worstCaseZone, DRONE_LABELS, ALL_DRONE_TYPES, type DroneType, type ZoneLevel } from "@/core/droneZones";
import { Search } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const VIABILITY_LABELS: Record<ZoneLevel, { label: string; color: string }> = {
  GREEN: { label: "HIGH", color: "#ef4444" },
  YELLOW: { label: "MEDIUM", color: "#eab308" },
  RED: { label: "LOW", color: "#22c55e" },
};

// Inverted: GREEN drone zone = dangerous for people (red), RED drone zone = safe for people (green)
const ZONE_COLORS: Record<ZoneLevel, string> = {
  GREEN: "#ef4444",   // Drones CAN fly → danger for people on ground
  YELLOW: "#eab308",  // Caution stays yellow
  RED: "#22c55e",     // Drones CAN'T fly → safe for people on ground
};

interface DroneMapProps {
  cells: GridCell[];
  hourIndex: number;
  step: number;
  onBoundsChange: (bounds: Bounds) => void;
}

function BoundsWatcher({ onBoundsChange }: { onBoundsChange: (b: Bounds) => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onBoundsChangeRef = useRef(onBoundsChange);
  onBoundsChangeRef.current = onBoundsChange;

  const map = useMap();

  const fireBounds = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const b = map.getBounds();
      onBoundsChangeRef.current({
        latMin: Math.floor(b.getSouth() * 4) / 4,
        latMax: Math.ceil(b.getNorth() * 4) / 4,
        lonMin: Math.floor(b.getWest() * 4) / 4,
        lonMax: Math.ceil(b.getEast() * 4) / 4,
      });
    }, 400);
  }, [map]);

  useMapEvents({
    moveend: fireBounds,
    zoomend: fireBounds,
  });

  // Fire once on mount
  useEffect(() => {
    const b = map.getBounds();
    onBoundsChangeRef.current({
      latMin: Math.floor(b.getSouth() * 4) / 4,
      latMax: Math.ceil(b.getNorth() * 4) / 4,
      lonMin: Math.floor(b.getWest() * 4) / 4,
      lonMax: Math.ceil(b.getEast() * 4) / 4,
    });
  }, [map]);

  return null;
}

function CellPopup({
  cell, i, wind, gusts, precip, snow, worstCase, allDrones, timeStr,
}: {
  cell: GridCell;
  i: number;
  wind: number;
  gusts: number;
  precip: number;
  snow: number;
  worstCase: { level: ZoneLevel; reason: string; drivenBy: DroneType };
  allDrones: Record<DroneType, { level: ZoneLevel; reason: string }>;
  timeStr: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const h = cell.hourly;
  const viability = VIABILITY_LABELS[worstCase.level];
  const summary = summarizeAllDrones(allDrones);
  const margin = windMargin(wind, gusts, worstCase.drivenBy);

  return (
    <div className="font-mono-tactical text-xs leading-relaxed" style={{ color: "#e0f2fe", background: "#0a1628", padding: "8px 10px", borderRadius: 6, minWidth: 200, maxWidth: 320 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <span className="font-bold" style={{ color: "#22d3ee" }}>
          {cell.lat.toFixed(2)}°N, {cell.lon.toFixed(2)}°E
        </span>
        <span style={{ color: "#94a3b8" }}>{timeStr}</span>
      </div>

      {/* UAS viability */}
      <div className="flex items-center gap-1.5 mb-2">
        <span style={{ color: "#94a3b8" }}>UAS Activity:</span>
        <span className="font-bold" style={{ color: viability.color }}>{viability.label}</span>
      </div>

      {/* Weather essentials */}
      <div className="grid grid-cols-3 gap-x-3 gap-y-0.5 mb-2" style={{ color: "#cbd5e1" }}>
        <span>Wind {wind.toFixed(1)} m/s</span>
        <span>Gust {gusts.toFixed(1)} m/s</span>
        <span>Precip {precip.toFixed(1)} mm/h</span>
        <span>Snow {snow.toFixed(1)} cm/h</span>
        <span>Temp {(h.temp[i] ?? 0).toFixed(0)}°C</span>
        <span>Vis {((h.vis[i] ?? 0) / 1000).toFixed(0)} km</span>
      </div>

      {/* Worst-case profile verdict */}

      {/* Summary counts */}
      <div className="flex gap-2 text-[10px] mb-1">
        <span style={{ color: "#ef4444" }}>● {summary.green} High</span>
        <span style={{ color: "#eab308" }}>● {summary.yellow} Moderate</span>
        <span style={{ color: "#22c55e" }}>● {summary.red} Low</span>
      </div>

      {/* Expandable breakdown */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-[10px] hover:underline w-full text-left"
        style={{ color: "#64748b" }}
      >
        {expanded ? "▾ Hide breakdown" : "▸ All profiles"}
      </button>
      {expanded && (
        <div className="mt-1 space-y-0.5">
          <div className="flex items-center justify-between text-[10px] mb-1" style={{ color: "#64748b", borderBottom: "1px solid #1e3a5f", paddingBottom: 3 }}>
            <span>Drone</span>
            <span>Wind margin</span>
          </div>
          {ALL_DRONE_TYPES.map((dt) => {
            const m = windMargin(wind, gusts, dt);
            const label = m >= 0 ? "▼" : "▲";
            return (
              <div key={dt} className="flex items-center justify-between text-[10px]">
                <span style={{ color: "#cbd5e1" }}>{DRONE_LABELS[dt]}</span>
                <span style={{ color: m >= 0 ? "#ef4444" : "#64748b" }}>
                  {label} {Math.abs(m).toFixed(1)} m/s
                </span>
              </div>
            );
          })}
          <div className="text-[9px] mt-1.5 pt-1" style={{ color: "#4a5568", borderTop: "1px solid #1e3a5f" }}>
            ▼ below max wind · ▲ exceeds max wind
          </div>
        </div>
      )}
    </div>
  );
}

function GridOverlay({ cells, hourIndex, step }: Omit<DroneMapProps, "onBoundsChange">) {
  const half = step / 2;

  return (
    <>
      {cells.map((cell) => {
        const h = cell.hourly;
        const i = Math.min(hourIndex, h.time.length - 1);
        const wind10 = h.wind_10m[i];
        const wind120 = h.wind_120m[i] ?? wind10;
        const wind = Math.min(wind10, wind120);
        const gusts = h.gusts[i];
        const precip = h.precip[i];
        const snow = h.snow[i];

        const worst = worstCaseZone(wind, gusts, precip, snow);
        const allDrones = classifyAllDrones(wind, gusts, precip, snow);

        const bounds: [[number, number], [number, number]] = [
          [cell.lat - half, cell.lon - half],
          [cell.lat + half, cell.lon + half],
        ];

        const ts = h.time[i];
        const timeStr = ts ? new Date(ts * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

        return (
          <Rectangle
            key={`${cell.lat}-${cell.lon}`}
            bounds={bounds}
            pathOptions={{
              color: ZONE_COLORS[worst.level],
              fillColor: ZONE_COLORS[worst.level],
              fillOpacity: 0.15,
              weight: 0.5,
              opacity: 0.3,
            }}
            eventHandlers={{
              mouseover: (e) => {
                e.target.setStyle({ fillOpacity: 0.25, weight: 1 });
              },
              mouseout: (e) => {
                e.target.setStyle({ fillOpacity: 0.15, weight: 0.5 });
              },
            }}
          >
            <Popup>
              <CellPopup
                cell={cell}
                i={i}
                wind={wind}
                gusts={gusts}
                precip={precip}
                snow={snow}
                worstCase={worst}
                allDrones={allDrones}
                timeStr={timeStr}
              />
            </Popup>
          </Rectangle>
        );
      })}
    </>
  );
}

function SearchControl() {
  const map = useMap();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{ display_name: string; lat: string; lon: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`
        );
        const data = await res.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch {
        // silently fail
      }
    }, 300);
  }, []);

  const flyTo = useCallback((lat: string, lon: string, name: string) => {
    map.flyTo([parseFloat(lat), parseFloat(lon)], 9, { duration: 1.5 });
    setQuery(name.split(",")[0]);
    setSuggestions([]);
    setShowSuggestions(false);
  }, [map]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="absolute top-3 right-3 z-[1000]" ref={containerRef}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (suggestions.length > 0) {
            flyTo(suggestions[0].lat, suggestions[0].lon, suggestions[0].display_name);
          }
        }}
        className="flex items-center gap-1 glass-panel px-2 py-1.5"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            fetchSuggestions(e.target.value);
          }}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder="Search location…"
          className="bg-transparent font-mono-tactical text-[11px] text-foreground placeholder:text-muted-foreground outline-none w-36"
        />
        <button type="submit" className="text-cyan hover:opacity-80">
          <Search className="h-3.5 w-3.5" />
        </button>
      </form>
      {showSuggestions && (
        <div className="glass-panel mt-1 max-h-48 overflow-y-auto">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => flyTo(s.lat, s.lon, s.display_name)}
              className="w-full text-left px-2 py-1.5 font-mono-tactical text-[10px] text-foreground hover:bg-secondary/60 transition-colors border-b border-border/50 last:border-0 truncate"
            >
              {s.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ZoomPositioner() {
  const map = useMap();
  useEffect(() => {
    map.zoomControl.setPosition("bottomright");
  }, [map]);
  return null;
}

export default function DroneMap({ onBoundsChange, ...props }: DroneMapProps) {
  const center: [number, number] = [48.46, 35.04];

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={7}
        minZoom={5}
        className="h-full w-full"
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        <ZoomPositioner />
        <BoundsWatcher onBoundsChange={onBoundsChange} />
        <GridOverlay {...props} />
        <SearchControl />
      </MapContainer>
    </div>
  );
}
