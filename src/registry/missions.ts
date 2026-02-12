import type { Mission } from "@/core/types";

export const missions: Mission[] = [
  {
    mission_id: "point_defense",
    name: "Point Defense",
    description: "Defend a fixed high-value asset against incoming threats. Minimize cost while ensuring zero damage to the protected target.",
    victory_conditions: ["hva_survival_100%", "all_threats_neutralized"],
    defeat_conditions: ["hva_destroyed", "budget_exceeded"],
    time_limit_seconds: 1800,
    constraints: {
      min_asset_separation_km: 2,
      max_budget_usd: 25000000,
      coverage_overlap_penalty: 0.1,
    },
  },
  {
    mission_id: "counter_swarm",
    name: "Counter-Swarm Operations",
    description: "Defend against waves of low-cost FPV drones and loitering munitions. Optimize for cost-exchange ratio — every dollar counts.",
    victory_conditions: ["threats_neutralized>80%", "cer_below_5"],
    defeat_conditions: ["assets_destroyed>50%", "hva_damaged"],
    time_limit_seconds: 3600,
    constraints: {
      min_asset_separation_km: 1.5,
      max_budget_usd: 10000000,
      coverage_overlap_penalty: 0.05,
    },
  },
];
