import type { Scenario } from "@/core/types";

export const scenarios: Scenario[] = [
  {
    scenario_id: "vovchansk_pocket_2026",
    name: "Vovchansk Pocket 2026",
    description: "Multi-domain assault on a critical oil refinery. Russian forces employ combined drone swarms, UGVs, and high-altitude cruise missiles in coordinated waves.",
    sides: {
      blue: {
        command_chain: "nato_iads",
        mission: "point_defense",
        budget_usd: 25000000,
        base_location: { lat: 50.29, lon: 36.94 },
        available_groups: [
          "infantry_platoon_aa",
          "spaag_section",
          "medium_sam_battery",
          "heavy_sam_battery",
          "cuas_detachment",
          "combined_iads_platoon",
          "sensor_network",
          "rapid_reaction_team",
        ],
      },
      red: {
        command_chain: "russian_btg",
        doctrine: "deep_strike_economic",
      },
    },
    phases: [
      {
        trigger: { time: 0 },
        spawns: [
          { type: "fpv_kamikaze", count: 8, lat: 50.35, lon: 36.80, behavior: "nap_of_earth", target: "ad_positions" },
          { type: "strike_ugv", count: 2, lat: 50.32, lon: 36.78, behavior: "ground_assault" },
        ],
      },
      {
        trigger: { time: 300 },
        spawns: [
          { type: "geran_2", count: 5, lat: 50.40, lon: 36.60, behavior: "cruise_strike" },
          { type: "fpv_kamikaze", count: 12, lat: 50.33, lon: 36.85, delay: 30, target: "ad_positions" },
        ],
      },
      {
        trigger: { time: 600 },
        spawns: [
          { type: "geran_5", count: 3, lat: 50.50, lon: 36.50, altitude: 6000, navigation: "starlink" },
          { type: "equine_relay_node", count: 1, lat: 50.31, lon: 36.90, patrol: "forest_edge" },
          { type: "molniya_minelayer", count: 2, lat: 50.38, lon: 36.75, behavior: "area_denial" },
        ],
        command_override: { blue: "weapon_free" },
      },
      {
        trigger: { time: 900 },
        spawns: [
          { type: "shahed_238", count: 4, lat: 50.45, lon: 36.55, behavior: "terrain_following" },
          { type: "geran_2_manpads", count: 2, lat: 50.42, lon: 36.65, behavior: "escort_intercept" },
          { type: "usv_magura", count: 1, lat: 50.20, lon: 36.70, behavior: "maritime_strike" },
        ],
      },
    ],
    hv_assets: [
      { type: "oil_refinery", value_usd: 500000000, lat: 50.29, lon: 36.94, loss_tolerance: 0 },
      { type: "command_post", value_usd: 50000000, lat: 50.285, lon: 36.935, loss_tolerance: 0.2 },
    ],
  },
  {
    scenario_id: "custom_mission",
    name: "Custom Mission",
    description: "User-defined scenario. Configure your own threat waves, defense budget, and objectives.",
    sides: {
      blue: {
        command_chain: "nato_iads",
        mission: "counter_swarm",
        budget_usd: 10000000,
        base_location: { lat: 48.85, lon: 2.35 },
        available_groups: [
          "infantry_platoon_aa",
          "spaag_section",
          "medium_sam_battery",
          "heavy_sam_battery",
          "cuas_detachment",
          "combined_iads_platoon",
          "sensor_network",
          "rapid_reaction_team",
        ],
      },
      red: {
        command_chain: "russian_btg",
        doctrine: "saturation_attack",
      },
    },
    phases: [
      {
        trigger: { time: 0 },
        spawns: [
          { type: "fpv_kamikaze", count: 5, lat: 48.90, lon: 2.25, target: "ad_positions" },
        ],
      },
    ],
    hv_assets: [
      { type: "airfield", value_usd: 200000000, lat: 48.85, lon: 2.35, loss_tolerance: 0.1 },
    ],
  },
];
