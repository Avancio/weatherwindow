import { Slider } from "@/components/ui/slider";

interface Props {
  useHighAlt: boolean;
  onChange: (high: boolean) => void;
}

export default function AltitudeSlider({ useHighAlt, onChange }: Props) {
  return (
    <div className="glass-panel p-3">
      <h3 className="font-mono-tactical text-xs font-bold text-cyan mb-2 tracking-wider">ALTITUDE</h3>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(false)}
          className={`font-mono-tactical text-[11px] px-2 py-1 rounded ${!useHighAlt ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
        >
          10 m
        </button>
        <button
          onClick={() => onChange(true)}
          className={`font-mono-tactical text-[11px] px-2 py-1 rounded ${useHighAlt ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
        >
          120 m
        </button>
      </div>
      <p className="font-mono-tactical text-[10px] text-muted-foreground mt-1">
        {useHighAlt ? "High-altitude wind data (120m)" : "Surface-level wind data (10m)"}
      </p>
    </div>
  );
}
