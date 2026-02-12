import type { CERResult } from "@/core/types";
import { formatCurrency } from "@/core/costModel";

interface CerGaugeProps {
  cer: CERResult | null;
}

export function CerGauge({ cer }: CerGaugeProps) {
  const efficiency = cer?.efficiency ?? 0;
  const clampedEff = Math.max(0, Math.min(100, efficiency));
  const rotation = -90 + (clampedEff / 100) * 180;

  const getColor = (val: number) => {
    if (val >= 70) return "hsl(142, 71%, 45%)";
    if (val >= 40) return "hsl(38, 92%, 50%)";
    return "hsl(0, 72%, 51%)";
  };

  return (
    <div className="glass-panel p-4">
      <div className="text-xs text-muted-foreground font-mono-tactical mb-2 uppercase tracking-wider">
        Cost-Exchange Ratio
      </div>
      <div className="flex items-center gap-4">
        {/* Gauge */}
        <div className="relative w-24 h-14 overflow-hidden">
          <svg viewBox="0 0 100 55" className="w-full h-full">
            {/* Background arc */}
            <path
              d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              stroke="hsl(222, 30%, 18%)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* Colored arc */}
            <path
              d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              stroke={getColor(clampedEff)}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${clampedEff * 1.26} 126`}
            />
            {/* Needle */}
            <line
              x1="50" y1="50"
              x2="50" y2="15"
              stroke={getColor(clampedEff)}
              strokeWidth="2"
              strokeLinecap="round"
              transform={`rotate(${rotation}, 50, 50)`}
            />
            <circle cx="50" cy="50" r="3" fill={getColor(clampedEff)} />
          </svg>
        </div>

        <div className="flex-1">
          <div className="font-mono-tactical text-2xl font-bold" style={{ color: getColor(clampedEff) }}>
            {cer ? cer.cer.toFixed(2) : "—"}
          </div>
          <div className="text-xs text-muted-foreground">
            {cer ? `${clampedEff.toFixed(0)}% efficient` : "No data"}
          </div>
          {cer && (
            <div className="text-xs text-muted-foreground mt-1">
              Spent {formatCurrency(cer.defenseCost)} vs {formatCurrency(cer.threatValue)} destroyed
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
