import type {
  Scenario, SimulationState, ThreatInstance, AssetInstance,
  SimulationEvent, Engagement, Threat, DeployedAsset, GroupAllocation,
} from "./types";
import { registry } from "./registry";
import { moveToward, haversineDistance, hasLineOfSight } from "./physics";
import { detectThreat, type EnvironmentModifiers } from "./detection";
import { calculateCER } from "./costModel";

let idCounter = 0;
const uid = () => `e${++idCounter}`;

export function createInitialState(
  scenario: Scenario,
  assetPlacements: Array<DeployedAsset>
): SimulationState {
  idCounter = 0;
  const assets: AssetInstance[] = assetPlacements.map((p) => {
    const def = registry.getAsset(p.type);
    if (!def) throw new Error(`Unknown asset: ${p.type}`);
    return {
      id: uid(),
      definition: def,
      lat: p.lat,
      lon: p.lon,
      ammo: def.ammo_capacity,
      reloading: false,
      reloadTimer: 0,
      engagements: 0,
      ammoExpended: 0,
      status: "active",
      kills: 0,
      group_id: p.group_id,
    };
  });

  // Initialize group allocations tracking
  const groupAllocations = initGroupAllocations(assetPlacements);

  return {
    time: 0,
    threats: [],
    assets,
    engagements: [],
    events: [],
    phase: 0,
    status: "running",
    cer: 0,
    totalDefenseCost: 0,
    totalThreatValue: 0,
    hvaStatus: scenario.hv_assets.map((h) => ({
      type: h.type,
      damaged: false,
      damageValue: 0,
    })),
    groupAllocations,
  };
}

/** Initialize group allocation tracking from deployed assets */
function initGroupAllocations(assetPlacements: Array<DeployedAsset>): GroupAllocation[] {
  const allocationMap = new Map<string, GroupAllocation>();

  for (const placement of assetPlacements) {
    const group = registry.getGroup(placement.group_id);
    if (!group) continue;

    if (!allocationMap.has(placement.group_id)) {
      const deployed = new Map<string, number>();
      const remaining = new Map<string, number>();
      for (const asset of group.assets) {
        deployed.set(asset.type, 0);
        remaining.set(asset.type, asset.count);
      }
      allocationMap.set(placement.group_id, { group_id: placement.group_id, deployed, remaining });
    }

    const alloc = allocationMap.get(placement.group_id)!;
    const currentDeployed = alloc.deployed.get(placement.type) ?? 0;
    const currentRemaining = alloc.remaining.get(placement.type) ?? 0;

    alloc.deployed.set(placement.type, currentDeployed + 1);
    alloc.remaining.set(placement.type, Math.max(0, currentRemaining - 1));
  }

  return Array.from(allocationMap.values());
}

/** Spawn threats for a given phase */
function spawnThreats(
  state: SimulationState,
  scenario: Scenario,
  phaseIndex: number
): void {
  const phase = scenario.phases[phaseIndex];
  if (!phase) return;

  for (const spawn of phase.spawns) {
    const def = registry.getThreat(spawn.type);
    if (!def) continue;
    const delay = spawn.delay ?? 0;

    for (let i = 0; i < spawn.count; i++) {
      const jitter = 0.002 * (Math.random() - 0.5); // ~200m spread
      const targetHVA = scenario.hv_assets[0];
      const threat: ThreatInstance = {
        id: uid(),
        definition: def,
        lat: spawn.lat + jitter,
        lon: spawn.lon + jitter,
        altitude: spawn.altitude ?? (def.altitude_m[0] + Math.random() * (def.altitude_m[1] - def.altitude_m[0])),
        heading: 0,
        speed: def.speed_ms * (0.8 + Math.random() * 0.4), // ±20% jitter
        status: "active",
        health: 1,
        spawnTime: state.time + delay + i * 2,
        targetLat: targetHVA?.lat ?? scenario.sides.blue.base_location.lat,
        targetLon: targetHVA?.lon ?? scenario.sides.blue.base_location.lon,
        trail: [],
      };
      state.threats.push(threat);
      state.events.push({
        time: state.time,
        type: "spawn",
        description: `${formatThreatName(def)} spawned at phase ${phaseIndex + 1}`,
        entityId: threat.id,
      });
    }
  }
}

/** Advance simulation by 1 second */
export function stepSimulation(
  state: SimulationState,
  scenario: Scenario,
  envMods?: EnvironmentModifiers
): SimulationState {
  if (state.status !== "running") return state;

  const next = structuredClone(state);
  next.time += 1;

  // Check phase triggers
  for (let i = next.phase; i < scenario.phases.length; i++) {
    const phase = scenario.phases[i];
    if (phase.trigger.time !== undefined && next.time >= phase.trigger.time && i >= next.phase) {
      spawnThreats(next, scenario, i);
      next.phase = i + 1;
      next.events.push({
        time: next.time,
        type: "phase",
        description: `Phase ${i + 1} triggered`,
      });
    }
  }

  // Move threats
  for (const threat of next.threats) {
    if (threat.status !== "active" && threat.status !== "detected") continue;
    if (threat.spawnTime > next.time) continue; // Not yet spawned

    const result = moveToward(
      threat.lat, threat.lon,
      threat.targetLat, threat.targetLon,
      threat.speed, 1
    );
    threat.trail.push({ lat: threat.lat, lon: threat.lon, time: next.time });
    if (threat.trail.length > 60) threat.trail.shift();
    threat.lat = result.lat;
    threat.lon = result.lon;

    // Check if threat reached target (HVA damage)
    if (result.arrived) {
      threat.status = "escaped";
      const hva = scenario.hv_assets.find(
        (h) => haversineDistance(threat.lat, threat.lon, h.lat, h.lon) < 0.5
      );
      if (hva) {
        const hvaState = next.hvaStatus.find((h) => h.type === hva.type);
        if (hvaState) {
          hvaState.damaged = true;
          hvaState.damageValue += hva.value_usd * 0.2;
        }
        next.events.push({
          time: next.time,
          type: "damage",
          description: `${formatThreatName(threat.definition)} struck ${hva.type}! $${(hva.value_usd * 0.2 / 1e6).toFixed(0)}M damage`,
          entityId: threat.id,
        });
      }
    }
  }

  // Detection pass
  for (const asset of next.assets) {
    if (asset.status !== "active") continue;
    for (const threat of next.threats) {
      if (threat.status !== "active" || threat.spawnTime > next.time) continue;
      const detection = detectThreat(asset.definition, threat, asset.lat, asset.lon, envMods);
      if (detection.detected && threat.status === "active") {
        threat.status = "detected";
        next.events.push({
          time: next.time,
          type: "detect",
          description: `${asset.definition.type} detected ${formatThreatName(threat.definition)} via ${detection.method} (${(detection.probability * 100).toFixed(0)}% conf)`,
          entityId: threat.id,
        });
      }
    }
  }

  // Engagement pass
  for (const asset of next.assets) {
    if (asset.status !== "active" || asset.definition.kill_probability === 0) continue;
    if (asset.reloading) {
      asset.reloadTimer -= 1;
      if (asset.reloadTimer <= 0) {
        asset.reloading = false;
        asset.ammo = asset.definition.ammo_capacity;
        next.events.push({
          time: next.time,
          type: "reload",
          description: `${asset.definition.type} reloaded`,
          entityId: asset.id,
        });
      }
      continue;
    }
    if (asset.ammo <= 0) {
      asset.reloading = true;
      asset.reloadTimer = asset.definition.reload_seconds;
      continue;
    }

    // Find nearest detected threat in range
    let bestThreat: ThreatInstance | null = null;
    let bestDist = Infinity;
    for (const threat of next.threats) {
      if (threat.status !== "detected" || threat.spawnTime > next.time) continue;
      if (!hasLineOfSight(
        asset.lat, asset.lon,
        threat.lat, threat.lon,
        threat.altitude,
        asset.definition.range_km,
        asset.definition.engagement_ceiling as [number, number]
      )) continue;
      const d = haversineDistance(asset.lat, asset.lon, threat.lat, threat.lon);
      if (d < bestDist) {
        bestDist = d;
        bestThreat = threat;
      }
    }

    if (bestThreat) {
      // Engage
      asset.ammo -= 1;
      asset.ammoExpended += 1;
      asset.engagements += 1;

      const killProb = asset.definition.kill_probability *
        (1 - bestThreat.speed / 200 * 0.3); // Fast targets harder to hit
      const hit = Math.random() < killProb;

      if (hit) {
        bestThreat.status = "destroyed";
        bestThreat.health = 0;
        asset.kills += 1;
        next.events.push({
          time: next.time,
          type: "kill",
          description: `${asset.definition.type} destroyed ${formatThreatName(bestThreat.definition)} at ${bestDist.toFixed(1)}km — $${asset.definition.cost_per_shot}/shot`,
          entityId: bestThreat.id,
          details: { assetId: asset.id, cost: asset.definition.cost_per_shot },
        });
      } else {
        next.events.push({
          time: next.time,
          type: "miss",
          description: `${asset.definition.type} missed ${formatThreatName(bestThreat.definition)} at ${bestDist.toFixed(1)}km`,
          entityId: bestThreat.id,
        });
      }

      // Create engagement record
      next.engagements.push({
        id: uid(),
        assetId: asset.id,
        threatId: bestThreat.id,
        startTime: next.time,
        endTime: next.time,
        result: hit ? "hit" : "miss",
        cost: asset.definition.cost_per_shot,
      });
    }
  }

  // Calculate CER
  const destroyed = next.threats.filter((t) => t.status === "destroyed");
  const assetsDestroyed = next.assets.filter((a) => a.status === "destroyed");
  const infraDamage = next.hvaStatus.reduce((s, h) => s + h.damageValue, 0);
  const cer = calculateCER(next.assets, destroyed, assetsDestroyed, infraDamage);
  next.cer = cer.cer;
  next.totalDefenseCost = cer.defenseCost;
  next.totalThreatValue = cer.threatValue;

  // Check victory/defeat
  const mission = registry.getMission(scenario.sides.blue.mission);
  const activeThreats = next.threats.filter(
    (t) => t.status === "active" || t.status === "detected"
  );
  const allPhasesTriggered = next.phase >= scenario.phases.length;
  const allSpawned = next.threats.every((t) => t.spawnTime <= next.time);

  if (allPhasesTriggered && allSpawned && activeThreats.length === 0) {
    next.status = "victory";
  }
  if (next.hvaStatus.some((h) => h.damaged && h.damageValue > 0)) {
    // Check loss tolerance
    const criticalDamage = scenario.hv_assets.some((hva, i) => {
      const status = next.hvaStatus[i];
      return status && status.damageValue > hva.value_usd * hva.loss_tolerance;
    });
    if (criticalDamage) next.status = "defeat";
  }
  if (mission && next.time >= mission.time_limit_seconds) {
    next.status = next.status === "running" ? "timeout" : next.status;
  }

  return next;
}

function formatThreatName(def: Threat): string {
  return def.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
