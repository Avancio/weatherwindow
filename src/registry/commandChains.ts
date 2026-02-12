import type { CommandChain } from "@/core/types";

export const commandChains: CommandChain[] = [
  {
    chain_id: "nato_iads",
    name: "NATO Integrated Air Defense",
    nodes: {
      CRC: {
        role: "Control Reporting Center",
        roe_authority: "weapon_free",
        tactics: "centralized_control",
        engagement_delay_seconds: 5,
        delegation_rules: ["threat_count>10:decentralize", "comms_lost:autonomous"],
      },
      SHORAD: {
        role: "Short Range Air Defense",
        roe_authority: "weapon_tight",
        tactics: "autonomous_defense",
        engagement_delay_seconds: 2,
        delegation_rules: ["hva_threatened:weapon_free"],
        parent: "CRC",
        coverage_priority: "low_altitude",
      },
      SENSOR_NET: {
        role: "Distributed Sensor Network",
        roe_authority: "weapon_hold",
        tactics: "detect_and_report",
        engagement_delay_seconds: 0,
        delegation_rules: [],
        parent: "CRC",
        coverage_priority: "all_altitude",
      },
    },
  },
  {
    chain_id: "russian_btg",
    name: "Russian Battalion Tactical Group",
    nodes: {
      BTG_HQ: {
        role: "Battalion HQ",
        roe_authority: "weapon_free",
        tactics: "deep_strike_economic",
        engagement_delay_seconds: 10,
        delegation_rules: ["losses>30%:retreat", "objective_reached:hold"],
      },
      SWARM_LEAD: {
        role: "Swarm Flight Leader",
        roe_authority: "weapon_free",
        tactics: "saturation_attack",
        engagement_delay_seconds: 1,
        delegation_rules: ["target_destroyed:redirect"],
        parent: "BTG_HQ",
        coverage_priority: "hva_priority",
      },
      RECON: {
        role: "Reconnaissance Element",
        roe_authority: "weapon_hold",
        tactics: "observe_and_report",
        engagement_delay_seconds: 0,
        delegation_rules: [],
        parent: "BTG_HQ",
        coverage_priority: "forward_edge",
      },
    },
  },
];
