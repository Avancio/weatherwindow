export type DroneType =
  | "orlan10"
  | "zala421_16"
  | "zala421_12"
  | "zala_t20"
  | "lancet3"
  | "eleron10"
  | "supercam_s350"
  | "granat"
  | "geran2";

export type ZoneLevel = "GREEN" | "YELLOW" | "RED";

export interface ZoneClassification {
  level: ZoneLevel;
  reason: string;
}

interface Thresholds {
  windGreen: number;
  windYellow: number;
  gustGreen: number;
  gustYellow: number;
  precipGreen: number;
  precipYellow: number;
  snowGreen: number;
  snowYellow: number;
}

// Wind values: green = ~60% of max, yellow = ~85% of max, above yellow = RED (grounded)
const THRESHOLDS: Record<DroneType, Thresholds> = {
  orlan10: {
    windGreen: 6, windYellow: 10,
    gustGreen: 8, gustYellow: 14,
    precipGreen: 0.5, precipYellow: 1.5,
    snowGreen: 0.3, snowYellow: 1.0,
  },
  zala421_16: {
    windGreen: 9, windYellow: 15,
    gustGreen: 12, gustYellow: 20,
    precipGreen: 0.5, precipYellow: 1.5,
    snowGreen: 0.3, snowYellow: 1.0,
  },
  zala421_12: {
    windGreen: 6, windYellow: 10,
    gustGreen: 8, gustYellow: 14,
    precipGreen: 0.5, precipYellow: 1.5,
    snowGreen: 0.3, snowYellow: 1.0,
  },
  zala_t20: {
    windGreen: 9, windYellow: 15,
    gustGreen: 12, gustYellow: 20,
    precipGreen: 0.5, precipYellow: 1.5,
    snowGreen: 0.3, snowYellow: 1.0,
  },
  lancet3: {
    windGreen: 7, windYellow: 12,
    gustGreen: 10, gustYellow: 16,
    precipGreen: 0.3, precipYellow: 0.8,
    snowGreen: 0.2, snowYellow: 0.6,
  },
  eleron10: {
    windGreen: 7, windYellow: 11,
    gustGreen: 9, gustYellow: 15,
    precipGreen: 0.5, precipYellow: 1.5,
    snowGreen: 0.3, snowYellow: 1.0,
  },
  supercam_s350: {
    windGreen: 9, windYellow: 15,
    gustGreen: 12, gustYellow: 20,
    precipGreen: 0.5, precipYellow: 1.5,
    snowGreen: 0.3, snowYellow: 1.0,
  },
  granat: {
    windGreen: 6, windYellow: 10,
    gustGreen: 8, gustYellow: 14,
    precipGreen: 0.3, precipYellow: 0.8,
    snowGreen: 0.2, snowYellow: 0.6,
  },
  geran2: {
    windGreen: 11, windYellow: 18,
    gustGreen: 15, gustYellow: 24,
    precipGreen: 1.0, precipYellow: 2.0,
    snowGreen: 0.5, snowYellow: 1.5,
  },
};

export const DRONE_LABELS: Record<DroneType, string> = {
  orlan10: "Orlan-10",
  zala421_16: "ZALA 421-16",
  zala421_12: "ZALA 421-12",
  zala_t20: "ZALA T-20",
  lancet3: "Lancet-3",
  eleron10: "Eleron-10",
  supercam_s350: "Supercam S350",
  granat: "Granat-1/2",
  geran2: "Geran-2 (Shahed)",
};

export const ALL_DRONE_TYPES: DroneType[] = [
  "orlan10", "zala421_16", "zala421_12", "zala_t20",
  "lancet3", "eleron10", "supercam_s350", "granat", "geran2",
];

export function classifyZone(
  wind: number,
  gusts: number,
  precip: number,
  snow: number,
  droneType: DroneType
): ZoneClassification {
  const t = THRESHOLDS[droneType];
  const reasons: string[] = [];
  let level: ZoneLevel = "GREEN";

  const promote = (to: ZoneLevel, reason: string) => {
    reasons.push(reason);
    if (to === "RED" || (to === "YELLOW" && level === "GREEN")) level = to;
  };

  if (wind >= t.windYellow) promote("RED", `wind ${wind.toFixed(1)} m/s`);
  else if (wind >= t.windGreen) promote("YELLOW", `wind ${wind.toFixed(1)} m/s`);

  if (gusts >= t.gustYellow) promote("RED", `gusts ${gusts.toFixed(1)} m/s`);
  else if (gusts >= t.gustGreen) promote("YELLOW", `gusts near limit`);

  if (precip >= t.precipYellow) promote("RED", `precip ${precip.toFixed(1)} mm/h`);
  else if (precip >= t.precipGreen) promote("YELLOW", `light precip`);

  if (snow >= t.snowYellow) promote("RED", `snow ${snow.toFixed(1)} cm/h`);
  else if (snow >= t.snowGreen) promote("YELLOW", `light snow`);

  return {
    level,
    reason: reasons.length ? reasons.join(", ") : "conditions clear",
  };
}

export function classifyAllDrones(
  wind: number,
  gusts: number,
  precip: number,
  snow: number
): Record<DroneType, ZoneClassification> {
  const result = {} as Record<DroneType, ZoneClassification>;
  for (const dt of ALL_DRONE_TYPES) {
    result[dt] = classifyZone(wind, gusts, precip, snow, dt);
  }
  return result;
}

/** Returns the wind margin to the yellow (limit) threshold. Positive = within limit, negative = exceeded. */
export function windMargin(wind: number, gusts: number, droneType: DroneType): number {
  const t = THRESHOLDS[droneType];
  // Worst margin across wind and gust
  const windMargin = t.windYellow - wind;
  const gustMargin = t.gustYellow - gusts;
  return Math.min(windMargin, gustMargin);
}

/** Summarize all drones into counts by zone level */
export function summarizeAllDrones(
  allDrones: Record<DroneType, ZoneClassification>
): { red: number; yellow: number; green: number } {
  let red = 0, yellow = 0, green = 0;
  for (const dt of ALL_DRONE_TYPES) {
    const level = allDrones[dt].level;
    if (level === "RED") red++;
    else if (level === "YELLOW") yellow++;
    else green++;
  }
  return { red, yellow, green };
}

export interface WorstCaseResult {
  level: ZoneLevel;
  reason: string;
  drivenBy: DroneType;
}

const LEVEL_PRIORITY: Record<ZoneLevel, number> = { GREEN: 2, YELLOW: 1, RED: 0 };

/** Returns the worst-case zone for ground personnel — the drone most likely to fly. */
export function worstCaseZone(
  wind: number,
  gusts: number,
  precip: number,
  snow: number
): WorstCaseResult {
  const all = classifyAllDrones(wind, gusts, precip, snow);
  let bestDrone: DroneType = ALL_DRONE_TYPES[0];
  let bestPriority = -1;
  let bestMargin = -Infinity;

  for (const dt of ALL_DRONE_TYPES) {
    const p = LEVEL_PRIORITY[all[dt].level];
    const m = windMargin(wind, gusts, dt);
    if (p > bestPriority || (p === bestPriority && m > bestMargin)) {
      bestPriority = p;
      bestMargin = m;
      bestDrone = dt;
    }
  }

  return {
    level: all[bestDrone].level,
    reason: all[bestDrone].reason,
    drivenBy: bestDrone,
  };
}
