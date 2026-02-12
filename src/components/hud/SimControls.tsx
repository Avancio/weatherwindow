import { Play, Pause, SkipForward, RotateCcw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SimControlsProps {
  isRunning: boolean;
  speed: number;
  time: number;
  status: string;
  onToggle: () => void;
  onStep: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onOptimize: () => void;
}

export function SimControls({
  isRunning, speed, time, status,
  onToggle, onStep, onReset, onSpeedChange, onOptimize,
}: SimControlsProps) {
  const speeds = [1, 5, 10, 50];

  return (
    <div className="flex items-center justify-center">
      <div className="glass-panel-strong p-3 rounded-lg">
        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          <Button
            size="icon"
            variant="outline"
            className="h-9 w-9 border-border bg-background/50 backdrop-blur-sm"
            onClick={onToggle}
            disabled={status !== "running"}
          >
            {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </Button>

          {/* Step */}
          <Button
            size="icon"
            variant="outline"
            className="h-9 w-9 border-border bg-background/50 backdrop-blur-sm"
            onClick={onStep}
            disabled={isRunning || status !== "running"}
          >
            <SkipForward className="h-4 w-4" />
          </Button>

          {/* Reset */}
          <Button
            size="icon"
            variant="outline"
            className="h-9 w-9 border-border bg-background/50 backdrop-blur-sm"
            onClick={onReset}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          {/* Separator */}
          <div className="w-px h-6 bg-border" />

          {/* Time display */}
          <div className="font-mono-tactical text-sm text-cyan font-bold min-w-[60px]">
            T+{time}s
          </div>

          {/* Status badge */}
          <div className={`text-xs font-mono-tactical px-2 py-1 rounded ${
            status === "running" ? "bg-primary/20 text-cyan"
            : status === "victory" ? "bg-green-500/20 text-success"
            : status === "defeat" ? "bg-red-500/20 text-danger"
            : "bg-muted text-muted-foreground"
          }`}>
            {status.toUpperCase()}
          </div>

          {/* Separator */}
          <div className="w-px h-6 bg-border" />

          {/* Speed selector */}
          <div className="flex items-center gap-1">
            {speeds.map((s) => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={`px-2 py-1 text-xs font-mono-tactical rounded transition-colors ${
                  speed === s
                    ? "bg-primary/20 text-cyan border border-primary/40"
                    : "text-muted-foreground hover:text-foreground bg-background/30"
                }`}
              >
                {s}×
              </button>
            ))}
          </div>

          {/* Optimize button */}
          <Button
            size="sm"
            className="bg-primary/20 text-cyan border border-primary/40 hover:bg-primary/30 font-mono-tactical text-xs"
            onClick={onOptimize}
          >
            <Zap className="h-3 w-3 mr-1" /> OPTIMIZE
          </Button>
        </div>
      </div>
    </div>
  );
}
