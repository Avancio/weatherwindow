import { useState } from "react";
import { Radar, ExternalLink, Search, Loader2 } from "lucide-react";
import type { OsintReport } from "@/lib/api/liveData";
import { Input } from "@/components/ui/input";

interface OsintPanelProps {
  reports: OsintReport[];
  loading: boolean;
  onSearch: (query: string) => void;
}

export function OsintPanel({ reports, loading, onSearch }: OsintPanelProps) {
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    if (query.trim()) onSearch(query.trim());
  };

  return (
    <div className="glass-panel p-3 space-y-2">
      <h3 className="text-xs font-mono-tactical text-cyan flex items-center gap-1.5">
        <Radar className="h-3.5 w-3.5" />
        LIVE OSINT FEED
      </h3>

      <div className="flex gap-1">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="drone attack Kharkiv…"
          className="h-7 text-[10px] font-mono-tactical bg-muted/30 border-border/50"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="h-7 px-2 rounded bg-cyan/10 text-cyan text-[10px] font-mono-tactical hover:bg-cyan/20 transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
        </button>
      </div>

      <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
        {reports.length === 0 && !loading && (
          <div className="text-[10px] text-muted-foreground font-mono-tactical py-2 text-center">
            Search for threat intelligence reports
          </div>
        )}
        {loading && reports.length === 0 && (
          <div className="text-[10px] text-muted-foreground font-mono-tactical py-2 text-center flex items-center justify-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Scanning OSINT sources…
          </div>
        )}
        {reports.map((r) => (
          <div
            key={r.id}
            className="bg-muted/20 rounded p-2 border border-border/30 space-y-1"
          >
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-[10px] font-mono-tactical text-foreground leading-tight line-clamp-2">
                {r.title}
              </h4>
              {r.url && (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-cyan hover:text-cyan/80"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <p className="text-[9px] text-muted-foreground font-mono-tactical line-clamp-3 leading-relaxed">
              {r.summary?.replace(/[#*\[\]]/g, "").slice(0, 200)}
            </p>
            <div className="text-[8px] text-muted-foreground/60 font-mono-tactical">
              {r.source} • {new Date(r.fetched_at).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
