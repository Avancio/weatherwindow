import type { AssetInstance, ThreatInstance, CERResult } from "./types";

/** Calculate Cost-Exchange Ratio from simulation results */
export function calculateCER(
  assets: AssetInstance[],
  threatsDestroyed: ThreatInstance[],
  assetsDestroyed: AssetInstance[],
  infrastructureDamage: number
): CERResult {
  // Defense cost = system costs of destroyed assets + ammo expended
  const ammoCost = assets.reduce(
    (sum, a) => sum + a.ammoExpended * a.definition.cost_per_shot, 0
  );
  const destroyedAssetCost = assetsDestroyed.reduce(
    (sum, a) => sum + a.definition.cost_system, 0
  );
  const defenseCost = ammoCost + destroyedAssetCost;

  // Threat value = cost of destroyed threats
  const threatValue = threatsDestroyed.reduce(
    (sum, t) => sum + t.definition.cost_usd, 0
  );

  // Economic damage penalty (weighted heavily)
  const economicDamage = infrastructureDamage * 1000;

  // CER: lower is better. <1 means you're winning the cost war
  const cer = threatValue > 0 ? defenseCost / threatValue : Infinity;

  // Naive cost: what it would cost using only Patriots for everything
  const naiveCost = threatsDestroyed.length * 1000000; // $1M per patriot shot

  // Efficiency: 0-100%
  const efficiency = Math.max(0, Math.min(100, (1 - cer) * 100));

  return {
    cer,
    defenseCost,
    threatValue,
    economicDamage,
    efficiency,
    naiveCost,
    optimizedCost: defenseCost,
    savings: Math.max(0, naiveCost - defenseCost),
  };
}

/** Format currency for display */
export function formatCurrency(amount: number): string {
  if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`;
  if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
  if (amount >= 1e3) return `$${(amount / 1e3).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
}
