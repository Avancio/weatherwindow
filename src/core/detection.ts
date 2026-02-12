import type { Asset, ThreatInstance } from "./types";
import { haversineDistance } from "./physics";
import type { WeatherData } from "@/lib/api/liveData";

export interface EnvironmentModifiers {
  visibilityFactor: number;   // 0-1, multiplier for visual/thermal detection
  windFactor: number;          // 0-1, multiplier for small drone speed/accuracy
  radarDegradation: number;    // 0-1, multiplier for radar effectiveness
  laserEfficiency: number;     // 0-1, multiplier for directed energy
  droneRangeFactor: number;    // 0-1, battery-powered drone range multiplier
}

/** Compute environment modifiers from live weather */
export function computeEnvironmentModifiers(weather: WeatherData | null): EnvironmentModifiers {
  if (!weather) {
    return { visibilityFactor: 1, windFactor: 1, radarDegradation: 1, laserEfficiency: 1, droneRangeFactor: 1 };
  }

  // Visibility affects visual and thermal sensors
  let visibilityFactor = 1;
  if (weather.visibility_m < 1000) visibilityFactor = 0.3;
  else if (weather.visibility_m < 2000) visibilityFactor = 0.5;
  else if (weather.visibility_m < 5000) visibilityFactor = 0.7;
  else if (weather.visibility_m < 8000) visibilityFactor = 0.85;

  // Wind affects small drones
  let windFactor = 1;
  if (weather.wind_speed_ms > 20) windFactor = 0.3;
  else if (weather.wind_speed_ms > 15) windFactor = 0.5;
  else if (weather.wind_speed_ms > 10) windFactor = 0.7;
  else if (weather.wind_speed_ms > 6) windFactor = 0.85;

  // Rain/precipitation affects radar and laser
  let radarDegradation = 1;
  let laserEfficiency = 1;
  if (weather.rain_1h_mm > 10) {
    radarDegradation = 0.7;
    laserEfficiency = 0.2;
  } else if (weather.rain_1h_mm > 5) {
    radarDegradation = 0.85;
    laserEfficiency = 0.4;
  } else if (weather.rain_1h_mm > 1) {
    radarDegradation = 0.95;
    laserEfficiency = 0.7;
  }

  // Cold reduces battery drone range
  let droneRangeFactor = 1;
  if (weather.temperature_c < -20) droneRangeFactor = 0.5;
  else if (weather.temperature_c < -10) droneRangeFactor = 0.7;
  else if (weather.temperature_c < 0) droneRangeFactor = 0.85;

  return { visibilityFactor, windFactor, radarDegradation, laserEfficiency, droneRangeFactor };
}

/** Calculate detection probability based on sensor type, threat signature, and environment */
export function detectThreat(
  asset: Asset,
  threat: ThreatInstance,
  assetLat: number,
  assetLon: number,
  envMods?: EnvironmentModifiers
): { detected: boolean; method: string; probability: number } {
  const dist = haversineDistance(assetLat, assetLon, threat.lat, threat.lon);
  if (dist > asset.range_km) return { detected: false, method: "none", probability: 0 };

  const mods = envMods ?? { visibilityFactor: 1, windFactor: 1, radarDegradation: 1, laserEfficiency: 1, droneRangeFactor: 1 };

  let bestProb = 0;
  let bestMethod = "none";
  const rangeFactor = 1 - (dist / asset.range_km) * 0.5;

  for (const cap of asset.detection_capabilities) {
    let prob = 0;

    switch (cap) {
      case "radar":
        prob = Math.min(0.95, threat.definition.signature.rcs * 2 * rangeFactor);
        if (threat.altitude < 100) prob *= 0.4;
        prob *= mods.radarDegradation; // Weather affects radar
        break;

      case "thermal":
        prob = getThermalProbability(threat.definition.signature.thermal, rangeFactor);
        if (threat.definition.signature.thermal === "high_confusion") prob *= 0.3;
        prob *= mods.visibilityFactor; // Weather affects thermal
        break;

      case "cellular_imei":
        if (threat.definition.navigation.includes("LTE_4G")) {
          prob = 0.9 * rangeFactor;
        } else {
          prob = 0;
        }
        break;

      case "visual":
        prob = getVisualProbability(threat.definition.signature.visual, rangeFactor);
        if (threat.altitude > 2000) prob *= 0.3;
        prob *= mods.visibilityFactor; // Weather affects visual heavily
        break;
    }

    if (prob > bestProb) {
      bestProb = prob;
      bestMethod = cap;
    }
  }

  const detected = Math.random() < bestProb;
  return { detected, method: bestMethod, probability: bestProb };
}

function getThermalProbability(thermal: string, rangeFactor: number): number {
  switch (thermal) {
    case "high": return 0.9 * rangeFactor;
    case "medium": return 0.6 * rangeFactor;
    case "low": return 0.3 * rangeFactor;
    default: return 0;
  }
}

function getVisualProbability(visual: string, rangeFactor: number): number {
  switch (visual) {
    case "high": return 0.8 * rangeFactor;
    case "medium": return 0.5 * rangeFactor;
    case "low": return 0.2 * rangeFactor;
    default: return 0;
  }
}
