import type { AssetInstance } from "@/core/types";

interface AssetInventoryProps {
  assets: AssetInstance[];
}

export function AssetInventory({ assets }: AssetInventoryProps) {
  return (
    <div className="glass-panel p-4">
      <div className="text-xs text-muted-foreground font-mono-tactical mb-3 uppercase tracking-wider">
        Asset Inventory
      </div>
      <div className="space-y-2">
        {assets.map((asset) => {
          const ammoPercent = asset.definition.ammo_capacity > 0
            ? (asset.ammo / asset.definition.ammo_capacity) * 100 : 100;
          const isSensor = asset.definition.kill_probability === 0;

          return (
            <div key={asset.id} className="flex items-center gap-2 text-xs font-mono-tactical">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  backgroundColor:
                    asset.status === "destroyed" ? "hsl(0, 72%, 51%)"
                    : asset.status === "reloading" ? "hsl(38, 92%, 50%)"
                    : isSensor ? "hsl(217, 91%, 60%)"
                    : "hsl(142, 71%, 45%)",
                }}
              />
              <div className="flex-1 truncate text-secondary-foreground">
                {asset.definition.type.replace(/_/g, " ").toUpperCase()}
              </div>
              {!isSensor && (
                <div className="w-16">
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${ammoPercent}%`,
                        backgroundColor:
                          ammoPercent > 50 ? "hsl(142, 71%, 45%)"
                          : ammoPercent > 20 ? "hsl(38, 92%, 50%)"
                          : "hsl(0, 72%, 51%)",
                      }}
                    />
                  </div>
                </div>
              )}
              <div className="w-12 text-right text-muted-foreground">
                {isSensor ? "PSV" : `${asset.ammo}/${asset.definition.ammo_capacity}`}
              </div>
              <div className="w-6 text-right text-success">
                {asset.kills > 0 ? asset.kills : ""}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
