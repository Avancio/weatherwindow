import { z } from "zod";

// ─── Signature Schema ───
export const SignatureSchema = z.object({
  rcs: z.number().min(0).max(100),
  thermal: z.enum(["none", "low", "medium", "high", "high_confusion"]),
  acoustic_db: z.number().min(0).max(200),
  visual: z.enum(["none", "low", "medium", "high"]),
});

// ─── Jamming Resistance ───
export const JammingResistanceSchema = z.object({
  traditional_ew: z.number().min(0).max(1),
  russian_tobol: z.number().min(0).max(1),
});

// ─── Threat Schema ───
export const ThreatSchema = z.object({
  type: z.string(),
  classification: z.string(),
  domain: z.enum(["air", "ground", "maritime"]),
  speed_ms: z.number().positive(),
  altitude_m: z.tuple([z.number(), z.number()]),
  range_km: z.number().positive(),
  cost_usd: z.number().nonnegative(),
  warhead_kg: z.number().nonnegative(),
  signature: SignatureSchema,
  navigation: z.array(z.string()),
  jamming_resistance: JammingResistanceSchema,
  special_traits: z.array(z.string()),
  behavior_tree: z.string(),
});

// ─── Asset Schema ───
export const AssetSchema = z.object({
  type: z.string(),
  classification: z.string(),
  cost_system: z.number().nonnegative(),
  cost_per_shot: z.number().nonnegative(),
  range_km: z.number().positive(),
  engagement_ceiling: z.tuple([z.number(), z.number()]),
  kill_probability: z.number().min(0).max(1),
  reload_seconds: z.number().nonnegative(),
  ammo_capacity: z.number().nonnegative(),
  rate_of_fire_rpm: z.number().nonnegative(),
  targeting_speed: z.enum(["slow", "medium", "fast"]),
  vulnerabilities: z.array(z.string()),
  detection_capabilities: z.array(z.string()),
});

// ─── Command Node Schema ───
export const CommandNodeSchema = z.object({
  role: z.string(),
  roe_authority: z.enum(["weapon_free", "weapon_tight", "weapon_hold"]),
  tactics: z.string(),
  engagement_delay_seconds: z.number().nonnegative(),
  delegation_rules: z.array(z.string()),
  parent: z.string().optional(),
  coverage_priority: z.string().optional(),
});

export const CommandChainSchema = z.object({
  chain_id: z.string(),
  name: z.string(),
  nodes: z.record(z.string(), CommandNodeSchema),
});

// ─── Mission Schema ───
export const MissionSchema = z.object({
  mission_id: z.string(),
  name: z.string(),
  description: z.string(),
  victory_conditions: z.array(z.string()),
  defeat_conditions: z.array(z.string()),
  time_limit_seconds: z.number().positive(),
  constraints: z.object({
    min_asset_separation_km: z.number(),
    max_budget_usd: z.number(),
    coverage_overlap_penalty: z.number(),
  }),
});

// ─── Scenario Schema ───
export const SpawnSchema = z.object({
  type: z.string(),
  count: z.number().positive(),
  lat: z.number(),
  lon: z.number(),
  delay: z.number().optional(),
  altitude: z.number().optional(),
  behavior: z.string().optional(),
  target: z.string().optional(),
  navigation: z.string().optional(),
  patrol: z.string().optional(),
});

export const PhaseSchema = z.object({
  trigger: z.object({
    time: z.number().optional(),
    condition: z.string().optional(),
  }),
  spawns: z.array(SpawnSchema),
  command_override: z.record(z.string(), z.string()).optional(),
});

export const HVASchema = z.object({
  type: z.string(),
  value_usd: z.number().positive(),
  lat: z.number(),
  lon: z.number(),
  loss_tolerance: z.number().min(0).max(1),
});

// ─── Asset Group Schema ───
export const GroupAssetSchema = z.object({
  type: z.string(),
  count: z.number().int().min(0),
  max_deployable: z.number().int().min(0).optional(), // Max that can be deployed at once
});

export const AssetGroupSchema = z.object({
  group_id: z.string(),
  name: z.string(),
  description: z.string(),
  cost_usd: z.number().nonnegative(), // Total cost to deploy this group
  assets: z.array(GroupAssetSchema),
  icon: z.string().optional(),
  color: z.string().optional(),
});

// ─── Deployed Asset Schema ───
export const DeployedAssetSchema = z.object({
  type: z.string(),
  lat: z.number(),
  lon: z.number(),
  group_id: z.string(),
  instance_id: z.string().optional(), // Track specific instance from group
});

// ─── Scenario Schema ───
export const ScenarioSchema = z.object({
  scenario_id: z.string(),
  name: z.string(),
  description: z.string(),
  sides: z.object({
    blue: z.object({
      command_chain: z.string(),
      mission: z.string(),
      budget_usd: z.number().positive(),
      base_location: z.object({ lat: z.number(), lon: z.number() }),
      available_groups: z.array(z.string()).optional(), // Groups available for this scenario
    }),
    red: z.object({
      command_chain: z.string(),
      doctrine: z.string(),
    }),
  }),
  phases: z.array(PhaseSchema),
  hv_assets: z.array(HVASchema),
});

// ─── Inferred TypeScript Types ───
export type Threat = z.infer<typeof ThreatSchema>;
export type Asset = z.infer<typeof AssetSchema>;
export type GroupAsset = z.infer<typeof GroupAssetSchema>;
export type AssetGroup = z.infer<typeof AssetGroupSchema>;
export type DeployedAsset = z.infer<typeof DeployedAssetSchema>;
export type CommandChain = z.infer<typeof CommandChainSchema>;
export type CommandNode = z.infer<typeof CommandNodeSchema>;
export type Mission = z.infer<typeof MissionSchema>;
export type Scenario = z.infer<typeof ScenarioSchema>;
export type Signature = z.infer<typeof SignatureSchema>;
export type Spawn = z.infer<typeof SpawnSchema>;
export type Phase = z.infer<typeof PhaseSchema>;
export type HVA = z.infer<typeof HVASchema>;

// ─── Runtime Entity Types ───
export interface ThreatInstance {
  id: string;
  definition: Threat;
  lat: number;
  lon: number;
  altitude: number;
  heading: number;
  speed: number;
  status: "active" | "detected" | "engaged" | "destroyed" | "escaped";
  health: number;
  spawnTime: number;
  targetLat: number;
  targetLon: number;
  trail: Array<{ lat: number; lon: number; time: number }>;
}

export interface AssetInstance {
  id: string;
  definition: Asset;
  lat: number;
  lon: number;
  ammo: number;
  reloading: boolean;
  reloadTimer: number;
  engagements: number;
  ammoExpended: number;
  status: "active" | "destroyed" | "reloading" | "jammed";
  kills: number;
  group_id?: string; // Track which group this asset belongs to
}

export interface Engagement {
  id: string;
  assetId: string;
  threatId: string;
  startTime: number;
  endTime?: number;
  result?: "hit" | "miss" | "aborted";
  cost: number;
}

export interface SimulationEvent {
  time: number;
  type: "spawn" | "detect" | "engage" | "kill" | "miss" | "escape" | "damage" | "phase" | "command" | "reload";
  description: string;
  entityId?: string;
  details?: Record<string, unknown>;
}

export interface SimulationState {
  time: number;
  threats: ThreatInstance[];
  assets: AssetInstance[];
  engagements: Engagement[];
  events: SimulationEvent[];
  phase: number;
  status: "running" | "victory" | "defeat" | "timeout";
  cer: number;
  totalDefenseCost: number;
  totalThreatValue: number;
  hvaStatus: Array<{ type: string; damaged: boolean; damageValue: number }>;
  groupAllocations: GroupAllocation[]; // Track deployed assets by group
}

// Track how many assets from each group have been deployed
export interface GroupAllocation {
  group_id: string;
  deployed: Map<string, number>; // asset_type -> count deployed
  remaining: Map<string, number>; // asset_type -> count remaining
}

export interface CERResult {
  cer: number;
  defenseCost: number;
  threatValue: number;
  economicDamage: number;
  efficiency: number;
  naiveCost: number;
  optimizedCost: number;
  savings: number;
}
