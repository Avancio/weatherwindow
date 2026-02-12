import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { useState } from "react";

const items = [
  {
    color: "#22c55e",
    label: "LOW",
    lines: [
      "Environmental conditions likely reduce small UAV performance",
      "High wind / significant precipitation",
      "Reduced aerial exposure risk",
    ],
  },
  {
    color: "#eab308",
    label: "MODERATE",
    lines: [
      "Environmental conditions may constrain some UAV classes",
      "Marginal winds / light precipitation",
      "Mixed operational feasibility",
    ],
  },
  {
    color: "#ef4444",
    label: "HIGH",
    lines: [
      "Environmental conditions favorable for UAV operations",
      "Low wind / clear conditions",
      "Elevated aerial exposure risk",
    ],
  },
];

export default function WeatherLegend() {
  const [open, setOpen] = useState(false);

  return (
    <div className="glass-panel p-3">
      <h3 className="font-mono-tactical text-xs font-bold text-cyan mb-2 tracking-wider">
        UAS ACTIVITY
      </h3>
      <div className="flex items-center gap-4 mb-1.5">
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: it.color }}
            />
            <span
              className="font-mono-tactical text-[11px] font-bold"
              style={{ color: it.color }}
            >
              {it.label}
            </span>
          </div>
        ))}
      </div>
      <div className="font-body text-[10px] text-muted-foreground leading-snug mb-1">
        Based on wind + precipitation constraints
      </div>

      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex items-center gap-1 font-mono-tactical text-[10px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
          <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
          Details
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 space-y-2 border-t border-border pt-2">
            {items.map((it) => (
              <div key={it.label}>
                <div
                  className="font-mono-tactical text-[10px] font-bold"
                  style={{ color: it.color }}
                >
                  {it.label}
                </div>
                {it.lines.map((line) => (
                  <div
                    key={line}
                    className="font-body text-[10px] text-muted-foreground leading-snug"
                  >
                    {line}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
