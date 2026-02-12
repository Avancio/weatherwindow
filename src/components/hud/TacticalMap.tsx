import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { SimulationState, AssetInstance, ThreatInstance, Scenario, DeployedAsset } from "@/core/types";
import { registry } from "@/core/registry";

const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

const THREAT_COLORS: Record<string, string> = {
  cruise_missile_analog: "#ef4444",
  loitering_munition: "#f97316",
  jet_loitering_munition: "#f97316",
  fpv_drone: "#fb923c",
  air_to_air_loitering: "#f43f5e",
  minelaying_drone: "#a855f7",
  ground_combat_vehicle: "#a855f7",
  unmanned_surface_vessel: "#3b82f6",
  mobile_comms_relay: "#facc15",
};

interface TacticalMapProps {
  state: SimulationState | null;
  center: [number, number];
  zoom: number;
  scenario?: Scenario;
  deployedAssets?: DeployedAsset[];
  placementAssetType?: string | null;
  placementGroupId?: string | null;
  onMapClick?: (lat: number, lon: number) => void;
  onRemoveAsset?: (instanceId: string) => void;
}

export function TacticalMap({
  state,
  center,
  zoom,
  scenario,
  deployedAssets = [],
  placementAssetType,
  placementGroupId,
  onMapClick,
  onRemoveAsset,
}: TacticalMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<L.LayerGroup>(L.layerGroup());
  const [cursorPos, setCursorPos] = useState<L.LatLng | null>(null);

  // Keep onMapClick in a ref so the map click handler always uses the latest version
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: true,
      attributionControl: true,
    });
    L.tileLayer(TILE_URL, {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);
    layersRef.current.addTo(map);
    mapRef.current = map;

    map.on("click", (e: L.LeafletMouseEvent) => {
      onMapClickRef.current?.(e.latlng.lat, e.latlng.lng);
    });

    map.on("mousemove", (e: L.LeafletMouseEvent) => {
      setCursorPos(e.latlng);
    });

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Update markers when state changes
  useEffect(() => {
    const layers = layersRef.current;
    layers.clearLayers();

    // Draw HVAs from scenario
    scenario?.hv_assets.forEach((hva) => {
      L.circleMarker([hva.lat, hva.lon], {
        radius: 12,
        color: "#fbbf24",
        fillColor: "#fbbf24",
        fillOpacity: 0.6,
        weight: 2,
      })
        .bindTooltip(`<div class="font-mono-tactical text-xs">
          <strong style="color: #fbbf24">${hva.type.replace(/_/g, " ").toUpperCase()}</strong><br/>
          Value: $${(hva.value_usd / 1e6).toFixed(0)}M<br/>
          Loss Tolerance: ${(hva.loss_tolerance * 100).toFixed(0)}%
        </div>`, { permanent: false })
        .addTo(layers);
    });

    // Draw deployed assets (pre-simulation placement markers)
    if (!state || state.time === 0) {
      deployedAssets.forEach((da) => {
        const def = registry.getAsset(da.type);
        if (!def) return;
        const color = def.kill_probability > 0 ? "#22c55e" : "#3b82f6";

        // Range ring
        L.circle([da.lat, da.lon], {
          radius: def.range_km * 1000,
          color,
          weight: 1,
          opacity: 0.3,
          fillOpacity: 0.05,
          dashArray: "6 4",
        }).addTo(layers);

        // Asset marker
        L.circleMarker([da.lat, da.lon], {
          radius: 8,
          color,
          fillColor: color,
          fillOpacity: 0.8,
          weight: 2,
        })
          .bindTooltip(`<div class="font-mono-tactical text-xs">
            <strong>${da.type.replace(/_/g, " ").toUpperCase()}</strong><br/>
            Range: ${def.range_km}km<br/>
            Group: ${da.group_id}
          </div>`, { permanent: false })
          .addTo(layers);
      });
    }

    if (!state) return;

    // Draw assets with range rings (simulation running)
    if (state.time > 0) {
      state.assets.forEach((asset) => {
        if (asset.status === "destroyed") return;
        const color = asset.definition.kill_probability > 0 ? "#22c55e" : "#3b82f6";

        L.circle([asset.lat, asset.lon], {
          radius: asset.definition.range_km * 1000,
          color: color,
          weight: 1,
          opacity: 0.3,
          fillOpacity: 0.05,
          dashArray: "6 4",
        }).addTo(layers);

        L.circleMarker([asset.lat, asset.lon], {
          radius: 8,
          color: color,
          fillColor: color,
          fillOpacity: 0.8,
          weight: 2,
        })
          .bindTooltip(formatAssetTooltip(asset), { permanent: false, className: "tactical-tooltip" })
          .addTo(layers);
      });
    }

    // Draw threats with trails
    state.threats.forEach((threat) => {
      if (threat.spawnTime > state.time) return;
      const color = THREAT_COLORS[threat.definition.classification] ?? "#ffffff";

      if (threat.status === "destroyed") {
        L.circleMarker([threat.lat, threat.lon], {
          radius: 4,
          color: "#666",
          fillColor: "#666",
          fillOpacity: 0.5,
          weight: 1,
        }).addTo(layers);
        return;
      }

      if (threat.status === "escaped") return;

      if (threat.trail.length > 1) {
        const trailCoords = threat.trail.map((t) => [t.lat, t.lon] as [number, number]);
        trailCoords.push([threat.lat, threat.lon]);
        L.polyline(trailCoords, {
          color: color,
          weight: 1.5,
          opacity: 0.4,
          dashArray: "3 6",
        }).addTo(layers);
      }

      const icon = L.divIcon({
        className: "",
        html: `<div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:12px solid ${color};filter:drop-shadow(0 0 4px ${color});transform:rotate(${threat.heading}deg)"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });
      L.marker([threat.lat, threat.lon], { icon })
        .bindTooltip(formatThreatTooltip(threat), { permanent: false })
        .addTo(layers);
    });

    // Draw active engagements
    state.engagements
      .filter((e) => e.endTime !== undefined && state.time - e.endTime! < 3)
      .forEach((eng) => {
        const asset = state.assets.find((a) => a.id === eng.assetId);
        const threat = state.threats.find((t) => t.id === eng.threatId);
        if (!asset || !threat) return;
        const color = eng.result === "hit" ? "#facc15" : "#ef4444";
        L.polyline(
          [[asset.lat, asset.lon], [threat.lat, threat.lon]],
          { color, weight: 2, opacity: 0.7, dashArray: "4 4" }
        ).addTo(layers);
      });
  }, [state, scenario, deployedAssets]);

  // Draw placement preview
  useEffect(() => {
    // We only add preview to existing layers — don't clear
    if (!placementAssetType || !placementGroupId || !cursorPos) return;

    const def = registry.getAsset(placementAssetType);
    if (!def) return;

    // Remove old preview layers by iterating
    const layers = layersRef.current;
    const toRemove: L.Layer[] = [];
    layers.eachLayer((l) => {
      if ((l as any)._isPreview) toRemove.push(l);
    });
    toRemove.forEach((l) => layers.removeLayer(l));

    const ring = L.circle([cursorPos.lat, cursorPos.lng], {
      radius: def.range_km * 1000,
      color: "#22c55e",
      weight: 1,
      opacity: 0.5,
      fillOpacity: 0.1,
      dashArray: "6 4",
    } as L.CircleOptions);
    (ring as any)._isPreview = true;
    ring.addTo(layers);

    const marker = L.circleMarker([cursorPos.lat, cursorPos.lng], {
      radius: 8,
      color: "#22c55e",
      fillColor: "#22c55e",
      fillOpacity: 0.5,
      weight: 2,
    } as L.CircleMarkerOptions);
    (marker as any)._isPreview = true;
    marker.addTo(layers);
  }, [placementAssetType, placementGroupId, cursorPos]);

  return (
    <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden" />
  );
}

function formatAssetTooltip(a: AssetInstance): string {
  const name = a.definition.type.replace(/_/g, " ").toUpperCase();
  return `<div class="font-mono-tactical text-xs">
    <strong>${name}</strong><br/>
    Ammo: ${a.ammo}/${a.definition.ammo_capacity}<br/>
    Kills: ${a.kills} | Status: ${a.status}
  </div>`;
}

function formatThreatTooltip(t: ThreatInstance): string {
  const name = t.definition.type.replace(/_/g, " ").toUpperCase();
  return `<div class="font-mono-tactical text-xs">
    <strong>${name}</strong><br/>
    Alt: ${t.altitude.toFixed(0)}m | Spd: ${t.speed.toFixed(0)}m/s<br/>
    Status: ${t.status}
  </div>`;
}
