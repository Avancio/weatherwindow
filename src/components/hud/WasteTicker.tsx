import { formatCurrency } from "@/core/costModel";
import type { CERResult } from "@/core/types";

interface WasteTickerProps {
  cer: CERResult | null;
}

export function WasteTicker({ cer }: WasteTickerProps) {
  const naive = cer?.naiveCost ?? 0;
  const optimized = cer?.optimizedCost ?? 0;
  const savings = cer?.savings ?? 0;

  return (
    <div className="glass-panel p-4">
      <div className="text-xs text-muted-foreground font-mono-tactical mb-3 uppercase tracking-wider">
        Live Waste Ticker
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-muted-foreground mb-1">Naïve Strategy</div>
          <div className="font-mono-tactical text-lg font-bold text-danger">
            {formatCurrency(naive)}
          </div>
          <div className="text-xs text-danger/70">WASTED</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Optimized</div>
          <div className="font-mono-tactical text-lg font-bold text-success">
            {formatCurrency(optimized)}
          </div>
          <div className="text-xs text-success/70">EFFICIENT</div>
        </div>
      </div>
      {savings > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="text-xs text-muted-foreground">Savings</div>
          <div className="font-mono-tactical text-xl font-bold text-cyan animate-pulse-glow">
            {formatCurrency(savings)}
          </div>
        </div>
      )}
    </div>
  );
}
