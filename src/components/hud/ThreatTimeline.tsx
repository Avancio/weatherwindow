import type { SimulationState, Scenario } from "@/core/types";

interface ThreatTimelineProps {
  scenario: Scenario;
  currentTime: number;
  state: SimulationState | null;
}

export function ThreatTimeline({ scenario, currentTime, state }: ThreatTimelineProps) {
  const activeThreats = state?.threats.filter(
    (t) => t.status === "active" || t.status === "detected"
  ).length ?? 0;
  const destroyedThreats = state?.threats.filter(
    (t) => t.status === "destroyed"
  ).length ?? 0;
  const totalThreats = state?.threats.length ?? 0;

  return (
    <div className="glass-panel p-4">
      <div className="text-xs text-muted-foreground font-mono-tactical mb-3 uppercase tracking-wider">
        Threat Wave Timeline
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center">
          <div className="font-mono-tactical text-lg font-bold text-warning">{activeThreats}</div>
          <div className="text-xs text-muted-foreground">Active</div>
        </div>
        <div className="text-center">
          <div className="font-mono-tactical text-lg font-bold text-success">{destroyedThreats}</div>
          <div className="text-xs text-muted-foreground">Destroyed</div>
        </div>
        <div className="text-center">
          <div className="font-mono-tactical text-lg font-bold text-secondary-foreground">{totalThreats}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
      </div>

      {/* Phase timeline */}
      <div className="space-y-1.5">
        {scenario.phases.map((phase, i) => {
          const triggerTime = phase.trigger.time ?? 0;
          const triggered = currentTime >= triggerTime;
          const totalSpawns = phase.spawns.reduce((s, sp) => s + sp.count, 0);
          const types = [...new Set(phase.spawns.map((s) => s.type))];
          const countdown = Math.max(0, triggerTime - currentTime);

          return (
            <div
              key={i}
              className={`flex items-center gap-2 text-xs font-mono-tactical p-1.5 rounded ${
                triggered ? "bg-muted/30" : "bg-transparent"
              }`}
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: triggered
                    ? "hsl(142, 71%, 45%)"
                    : "hsl(222, 30%, 30%)",
                }}
              />
              <div className="flex-1 truncate text-secondary-foreground">
                P{i + 1}: {types.join(", ").replace(/_/g, " ")} ×{totalSpawns}
              </div>
              <div className="text-muted-foreground">
                {triggered ? `T+${triggerTime}s` : `-${countdown}s`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
