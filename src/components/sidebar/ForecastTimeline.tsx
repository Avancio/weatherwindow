import { useMemo } from "react";
import { Slider } from "@/components/ui/slider";

interface Props {
  hourIndex: number;
  maxHours: number;
  timestamps: number[];
  onChange: (idx: number) => void;
}

export default function ForecastTimeline({ hourIndex, maxHours, timestamps, onChange }: Props) {
  // Group hours by day
  const days = useMemo(() => {
    const map = new Map<string, { label: string; shortLabel: string; startIdx: number; hours: { idx: number; hour: string }[] }>();
    for (let i = 0; i < Math.min(maxHours, timestamps.length); i++) {
      const ts = timestamps[i];
      if (!ts) continue;
      const d = new Date(ts * 1000);
      const dayKey = d.toLocaleDateString([], { month: "short", day: "numeric" });
      const weekday = d.toLocaleDateString([], { weekday: "short" });
      if (!map.has(dayKey)) {
        map.set(dayKey, {
          label: `${weekday} ${dayKey}`,
          shortLabel: dayKey,
          startIdx: i,
          hours: [],
        });
      }
      map.get(dayKey)!.hours.push({
        idx: i,
        hour: d.toLocaleTimeString([], { hour: "2-digit", hour12: false }),
      });
    }
    return Array.from(map.values());
  }, [maxHours, timestamps]);

  // Find which day the current hourIndex belongs to
  const activeDayIdx = useMemo(() => {
    for (let d = days.length - 1; d >= 0; d--) {
      if (hourIndex >= days[d].startIdx) return d;
    }
    return 0;
  }, [hourIndex, days]);

  const activeDay = days[activeDayIdx];

  // Pick a subset of hours to show (every 3h)
  const hourMarks = useMemo(() => {
    if (!activeDay) return [];
    return activeDay.hours.filter((_, i) => i % 3 === 0);
  }, [activeDay]);

  if (days.length === 0) {
    return (
      <div className="glass-panel p-3">
        <h3 className="font-mono-tactical text-xs font-bold text-cyan mb-2 tracking-wider">FORECAST</h3>
        <div className="font-mono-tactical text-[10px] text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-3">
      <h3 className="font-mono-tactical text-xs font-bold text-cyan mb-2 tracking-wider">FORECAST</h3>

      {/* Day selector */}
      <div className="flex flex-wrap gap-1 mb-2">
        {days.map((day, di) => (
          <button
            key={day.label}
            onClick={() => onChange(day.startIdx)}
            className={`font-mono-tactical text-[10px] px-1.5 py-0.5 rounded transition-colors ${
              di === activeDayIdx
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {day.shortLabel}
          </button>
        ))}
      </div>

      {/* Hour slider within selected day */}
      {activeDay && activeDay.hours.length > 1 && (
        <div>
          <Slider
            value={[hourIndex]}
            min={activeDay.hours[0].idx}
            max={activeDay.hours[activeDay.hours.length - 1].idx}
            step={1}
            onValueChange={([v]) => onChange(v)}
            className="mb-1"
          />
          <div className="flex justify-between font-mono-tactical text-[9px] text-muted-foreground">
            <span>{activeDay.hours[0].hour}</span>
            <span>{activeDay.hours[activeDay.hours.length - 1].hour}</span>
          </div>
        </div>
      )}

      {/* Current timestamp label */}
      <div className="font-body text-[10px] text-foreground text-center mt-2 opacity-70">
        {timestamps[hourIndex]
          ? new Date(timestamps[hourIndex] * 1000).toLocaleString([], {
              weekday: "short", month: "short", day: "numeric",
              hour: "2-digit", minute: "2-digit",
            })
          : `+${hourIndex}h`}
      </div>
    </div>
  );
}
