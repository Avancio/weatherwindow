import type { AssetGroup } from "@/core/types";

export const assetGroups: AssetGroup[] = [
  {
    group_id: "infantry_platoon_aa",
    name: "Infantry Platoon AA",
    description: "Light man-portable air defense team. Highly mobile, limited ammo capacity.",
    cost_usd: 500000,
    assets: [
      { type: "cellular_detector", count: 2 },
      { type: "thermal_sensor", count: 1 },
    ],
    icon: "users",
    color: "#22c55e",
  },
  {
    group_id: "spaag_section",
    name: "SPAAG Section",
    description: "Self-propelled anti-aircraft gun section. Excellent for low-altitude threats and drone swarms.",
    cost_usd: 1500000,
    assets: [
      { type: "gepard", count: 3, max_deployable: 3 },
    ],
    icon: "crosshair",
    color: "#f59e0b",
  },
  {
    group_id: "medium_sam_battery",
    name: "Medium SAM Battery",
    description: "Medium-range surface-to-air missile battery. Good coverage against cruise missiles and aircraft.",
    cost_usd: 6000000,
    assets: [
      { type: "nasams", count: 3, max_deployable: 2 },
      { type: "thermal_sensor", count: 1 },
    ],
    icon: "rocket",
    color: "#3b82f6",
  },
  {
    group_id: "heavy_sam_battery",
    name: "Heavy SAM Battery",
    description: "Long-range high-value air defense. Expensive but capable against high-altitude threats.",
    cost_usd: 15000000,
    assets: [
      { type: "patriot_battery", count: 2, max_deployable: 1 },
      { type: "nasams", count: 2, max_deployable: 2 },
    ],
    icon: "shield",
    color: "#ef4444",
  },
  {
    group_id: "cuas_detachment",
    name: "CUAS Detachment",
    description: "Counter-Unmanned Aircraft System team with laser and sensor capabilities.",
    cost_usd: 2500000,
    assets: [
      { type: "laser_cuas", count: 4, max_deployable: 4 },
      { type: "cellular_detector", count: 2 },
      { type: "thermal_sensor", count: 2 },
    ],
    icon: "zap",
    color: "#a855f7",
  },
  {
    group_id: "combined_iads_platoon",
    name: "Combined IADS Platoon",
    description: "Integrated Air Defense System with layered protection. Balanced mix of sensors and weapons.",
    cost_usd: 8000000,
    assets: [
      { type: "gepard", count: 2 },
      { type: "nasams", count: 2 },
      { type: "laser_cuas", count: 2 },
      { type: "cellular_detector", count: 2 },
      { type: "thermal_sensor", count: 2 },
    ],
    icon: "layers",
    color: "#06b6d4",
  },
  {
    group_id: "sensor_network",
    name: "Sensor Network Only",
    description: "Passive detection and early warning network. No offensive capability.",
    cost_usd: 500000,
    assets: [
      { type: "cellular_detector", count: 4 },
      { type: "thermal_sensor", count: 4 },
    ],
    icon: "radar",
    color: "#64748b",
  },
  {
    group_id: "rapid_reaction_team",
    name: "Rapid Reaction Team",
    description: "Light, mobile defense team for quick deployment. Limited sustainment capability.",
    cost_usd: 1000000,
    assets: [
      { type: "gepard", count: 1 },
      { type: "laser_cuas", count: 2 },
      { type: "cellular_detector", count: 1 },
    ],
    icon: "zap",
    color: "#eab308",
  },
];
