import type { SimulationEvent } from "@/core/types";
import { useRef, useEffect } from "react";

interface EventLogProps {
  events: SimulationEvent[];
}

const EVENT_COLORS: Record<string, string> = {
  spawn: "text-warning",
  detect: "text-cyan",
  engage: "text-cyan",
  kill: "text-success",
  miss: "text-danger",
  escape: "text-danger",
  damage: "text-danger",
  phase: "text-warning",
  command: "text-purple-400",
  reload: "text-muted-foreground",
};

export function EventLog({ events }: EventLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events.length]);

  const recentEvents = events.slice(-50);

  return (
    <div className="glass-panel p-4 flex flex-col h-full">
      <div className="text-xs text-muted-foreground font-mono-tactical mb-2 uppercase tracking-wider">
        Explainability Log
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1 min-h-0">
        {recentEvents.length === 0 ? (
          <div className="text-xs text-muted-foreground italic">Awaiting simulation start...</div>
        ) : (
          recentEvents.map((event, i) => (
            <div key={i} className="text-xs font-mono-tactical leading-relaxed">
              <span className="text-muted-foreground">T+{event.time}s</span>{" "}
              <span className={EVENT_COLORS[event.type] ?? "text-foreground"}>
                [{event.type.toUpperCase()}]
              </span>{" "}
              <span className="text-secondary-foreground">{event.description}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
