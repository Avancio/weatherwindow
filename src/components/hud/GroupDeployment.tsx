import { useState, useMemo } from "react";
import { registry } from "@/core/registry";
import type { DeployedAsset, Scenario } from "@/core/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DollarSign,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
} from "lucide-react";

// Shape types for visual representation
type ShapeType = "circle" | "square" | "triangle" | "diamond" | "hexagon";
type ShapeColor = "#22c55e" | "#3b82f6" | "#ef4444" | "#f59e0b" | "#a855f7" | "#06b6d4" | "#eab308" | "#64748b";

const SHAPES: { type: ShapeType; icon: string; name: string }[] = [
  { type: "circle", icon: "●", name: "Circle" },
  { type: "square", icon: "■", name: "Square" },
  { type: "triangle", icon: "▲", name: "Triangle" },
  { type: "diamond", icon: "◆", name: "Diamond" },
  { type: "hexagon", icon: "⬡", name: "Hexagon" },
];

const COLORS: { color: ShapeColor; name: string }[] = [
  { color: "#22c55e", name: "Green" },
  { color: "#3b82f6", name: "Blue" },
  { color: "#ef4444", name: "Red" },
  { color: "#f59e0b", name: "Orange" },
  { color: "#a855f7", name: "Purple" },
  { color: "#06b6d4", name: "Cyan" },
  { color: "#eab308", name: "Yellow" },
  { color: "#64748b", name: "Gray" },
];

interface ForceGroup {
  id: string;
  name: string;
  shape: ShapeType;
  color: ShapeColor;
  subGroups: ForceGroup[];
  assets: DeployedAsset[];
  collapsed?: boolean;
}

interface GroupDeploymentProps {
  scenario: Scenario;
  deployedAssets: DeployedAsset[];
  onDeployAsset: (asset: DeployedAsset) => void;
  onRemoveAsset: (instanceId: string) => void;
  selectedAssetType: string | null;
  onSelectAssetType: (assetType: string | null) => void;
  selectedGroup: string | null;
  onSelectGroup: (groupId: string | null) => void;
  totalSpent: number;
}

export function GroupDeployment({
  scenario,
  deployedAssets,
  onDeployAsset,
  onRemoveAsset,
  selectedAssetType,
  onSelectAssetType,
  selectedGroup,
  onSelectGroup,
  totalSpent,
}: GroupDeploymentProps) {
  const allAssets = registry.getAllAssets();
  const [forceGroups, setForceGroups] = useState<ForceGroup[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Calculate budget
  const budgetRemaining = scenario.sides.blue.budget_usd - totalSpent;
  const budgetPercent = Math.min(100, (totalSpent / scenario.sides.blue.budget_usd) * 100);

  // Group assets by type with counts
  const assetsByType = useMemo(() => {
    const map = new Map<string, DeployedAsset[]>();
    for (const asset of deployedAssets) {
      if (!map.has(asset.type)) map.set(asset.type, []);
      map.get(asset.type)!.push(asset);
    }
    return map;
  }, [deployedAssets]);

  // Add new force group
  const addForceGroup = (parentId?: string) => {
    const newGroup: ForceGroup = {
      id: `group-${Date.now()}`,
      name: `Group ${forceGroups.length + 1}`,
      shape: "circle",
      color: "#22c55e",
      subGroups: [],
      assets: [],
    };

    if (parentId) {
      setForceGroups((prev) => addToParent(prev, parentId, newGroup));
      setExpandedGroups((prev) => new Set([...prev, parentId]));
    } else {
      setForceGroups((prev) => [...prev, newGroup]);
    }
  };

  // Remove force group
  const removeForceGroup = (groupId: string) => {
    setForceGroups((prev) => removeFromTree(prev, groupId));
  };

  // Update group properties
  const updateGroup = (groupId: string, updates: Partial<ForceGroup>) => {
    setForceGroups((prev) => updateInTree(prev, groupId, updates));
  };

  // Add asset to group — also notify parent
  const addAssetToGroup = (groupId: string, assetType: string) => {
    const newAsset: DeployedAsset = {
      type: assetType,
      lat: 0,
      lon: 0,
      group_id: groupId,
      instance_id: `${groupId}-${assetType}-${Date.now()}`,
    };

    const updateFn = (groups: ForceGroup[]): ForceGroup[] => {
      return groups.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            assets: [...group.assets, newAsset],
          };
        }
        if (group.subGroups.length > 0) {
          return { ...group, subGroups: updateFn(group.subGroups) };
        }
        return group;
      });
    };
    setForceGroups(updateFn);
    onSelectGroup(groupId);
  };

  // Toggle group collapse
  const toggleCollapse = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  return (
    <div className="glass-panel p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground font-mono-tactical uppercase tracking-wider">
          Force Deployment
        </div>
        <div className="flex items-center gap-1 text-xs font-mono-tactical">
          <DollarSign className="h-3 w-3 text-amber-500" />
          <span className={budgetRemaining < 0 ? "text-red-500" : "text-success"}>
            {formatCurrency(budgetRemaining)}
          </span>
        </div>
      </div>

      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            budgetRemaining < 0 ? "bg-red-500" : totalSpent > 0 ? "bg-cyan" : "bg-muted"
          }`}
          style={{ width: `${budgetPercent}%` }}
        />
      </div>

      {/* Add root group button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => addForceGroup()}
        className="w-full border-dashed border-2"
      >
        <Plus className="h-4 w-4 mr-2" /> Add Force Group
      </Button>

      {/* Force groups tree */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[400px]">
        {forceGroups.map((group) => (
          <GroupItem
            key={group.id}
            group={group}
            level={0}
            expandedGroups={expandedGroups}
            onToggleCollapse={toggleCollapse}
            onAddSubGroup={addForceGroup}
            onRemoveGroup={removeForceGroup}
            onUpdateGroup={updateGroup}
            onAddAssetToGroup={addAssetToGroup}
            selectedAssetType={selectedAssetType}
            onSelectAssetType={onSelectAssetType}
            selectedGroup={selectedGroup}
            onSelectGroup={onSelectGroup}
            allAssets={allAssets}
          />
        ))}
      </div>

      {/* Available assets palette */}
      <div className="border-t border-border pt-3">
        <div className="text-xs text-muted-foreground font-mono-tactical mb-2">
          Asset Palette
        </div>
        <div className="grid grid-cols-2 gap-1">
          {allAssets.map((asset) => {
            const isSelected = selectedAssetType === asset.type;
            return (
              <button
                key={asset.type}
                onClick={() => onSelectAssetType(isSelected ? null : asset.type)}
                className={`text-left p-2 rounded border transition-all ${
                  isSelected
                    ? "bg-primary/20 border-primary/40"
                    : "bg-muted/30 border-border hover:border-primary/40"
                }`}
              >
                <div className="text-[10px] font-mono-tactical truncate">
                  {asset.type.replace(/_/g, " ").toUpperCase()}
                </div>
                <div className="text-[9px] text-muted-foreground">
                  {asset.range_km}km | ${formatCompact(asset.cost_system)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected asset indicator */}
      {selectedAssetType && !selectedGroup && (
        <div className="border-t border-border pt-2">
          <div className="text-[10px] text-cyan font-mono-tactical text-center">
            Click a group to select it, then click the map to place {selectedAssetType.replace(/_/g, " ").toUpperCase()}
          </div>
        </div>
      )}
      {selectedAssetType && selectedGroup && (
        <div className="border-t border-border pt-2">
          <div className="text-[10px] text-accent font-mono-tactical text-center animate-pulse">
            Click the map to place {selectedAssetType.replace(/_/g, " ").toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );
}

// Group tree item component
interface GroupItemProps {
  group: ForceGroup;
  level: number;
  expandedGroups: Set<string>;
  onToggleCollapse: (id: string) => void;
  onAddSubGroup: (parentId: string) => void;
  onRemoveGroup: (id: string) => void;
  onUpdateGroup: (id: string, updates: Partial<ForceGroup>) => void;
  onAddAssetToGroup: (groupId: string, assetType: string) => void;
  selectedAssetType: string | null;
  onSelectAssetType: (type: string | null) => void;
  selectedGroup: string | null;
  onSelectGroup: (groupId: string | null) => void;
  allAssets: any[];
}

function GroupItem({
  group,
  level,
  expandedGroups,
  onToggleCollapse,
  onAddSubGroup,
  onRemoveGroup,
  onUpdateGroup,
  onAddAssetToGroup,
  selectedAssetType,
  onSelectAssetType,
  selectedGroup,
  onSelectGroup,
  allAssets,
}: GroupItemProps) {
  const isExpanded = expandedGroups.has(group.id);
  const hasChildren = group.subGroups.length > 0 || group.assets.length > 0;
  const paddingLeft = level * 16;

  return (
    <div className="relative">
      {/* Group header */}
      <div
        className={`flex items-center gap-2 p-2 rounded border transition-all cursor-pointer ${
          selectedGroup === group.id
            ? "bg-primary/20 border-primary/40"
            : "bg-background/50 hover:bg-background/80"
        }`}
        style={{ marginLeft: `${paddingLeft}px` }}
        onClick={() => onSelectGroup(selectedGroup === group.id ? null : group.id)}
      >
        {/* Collapse/Expand handle */}
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse(group.id);
            }}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
        )}

        {/* Drag handle */}
        <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />

        {/* Shape indicator */}
        <div
          className="w-6 h-6 flex items-center justify-center text-lg"
          style={{ color: group.color }}
        >
          {SHAPES.find((s) => s.type === group.shape)?.icon}
        </div>

        {/* Group name input */}
        <Input
          value={group.name}
          onChange={(e) => onUpdateGroup(group.id, { name: e.target.value })}
          className="h-6 text-xs flex-1 min-w-[80px] bg-transparent border-none p-0 focus-visible:ring-0"
          onClick={(e) => e.stopPropagation()}
        />

        {/* Asset count badge */}
        {group.assets.length > 0 && (
          <Badge variant="secondary" className="text-[9px] px-1 py-0">
            {group.assets.length}
          </Badge>
        )}

        {/* Remove button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemoveGroup(group.id);
          }}
          className="flex-shrink-0 text-muted-foreground hover:text-red-500 transition-colors"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-1 space-y-1">
          {/* Sub-groups */}
          {group.subGroups.map((subGroup) => (
            <GroupItem
              key={subGroup.id}
              group={subGroup}
              level={level + 1}
              expandedGroups={expandedGroups}
              onToggleCollapse={onToggleCollapse}
              onAddSubGroup={onAddSubGroup}
              onRemoveGroup={onRemoveGroup}
              onUpdateGroup={onUpdateGroup}
              onAddAssetToGroup={onAddAssetToGroup}
              selectedAssetType={selectedAssetType}
              onSelectAssetType={onSelectAssetType}
              selectedGroup={selectedGroup}
              onSelectGroup={onSelectGroup}
              allAssets={allAssets}
            />
          ))}

          {/* Add sub-group button */}
          <button
            onClick={() => onAddSubGroup(group.id)}
            className="w-full text-left p-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            style={{ marginLeft: `${paddingLeft + 24}px` }}
          >
            <Plus className="h-3 w-3" /> Add Sub-Group
          </button>

          {/* Deployed assets in this group */}
          {group.assets.map((asset, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 p-1 rounded bg-muted/30 text-[10px]"
              style={{ marginLeft: `${paddingLeft + 24}px` }}
            >
              <div className="w-4 h-4 rounded" style={{ backgroundColor: group.color }} />
              <span className="flex-1 truncate">{asset.type.replace(/_/g, " ")}</span>
              <button
                onClick={() => onRemoveGroup(asset.instance_id ?? `${group.id}-${idx}`)}
                className="text-muted-foreground hover:text-red-500"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}

          {/* Add asset button (when asset type is selected) */}
          {selectedAssetType && (
            <button
              onClick={() => onAddAssetToGroup(group.id, selectedAssetType)}
              className="w-full text-left p-1 text-[10px] text-cyan hover:text-cyan/80 transition-colors"
              style={{ marginLeft: `${paddingLeft + 24}px` }}
            >
              + Add {selectedAssetType.replace(/_/g, " ")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Helper functions for tree manipulation
function addToParent(groups: ForceGroup[], parentId: string, newGroup: ForceGroup): ForceGroup[] {
  return groups.map((group) => {
    if (group.id === parentId) {
      return { ...group, subGroups: [...group.subGroups, newGroup] };
    }
    if (group.subGroups.length > 0) {
      return { ...group, subGroups: addToParent(group.subGroups, parentId, newGroup) };
    }
    return group;
  });
}

function removeFromTree(groups: ForceGroup[], groupId: string): ForceGroup[] {
  return groups
    .filter((g) => g.id !== groupId)
    .map((group) => ({
      ...group,
      subGroups: group.subGroups.length > 0 ? removeFromTree(group.subGroups, groupId) : [],
    }));
}

function updateInTree(groups: ForceGroup[], groupId: string, updates: Partial<ForceGroup>): ForceGroup[] {
  return groups.map((group) => {
    if (group.id === groupId) {
      return { ...group, ...updates };
    }
    if (group.subGroups.length > 0) {
      return { ...group, subGroups: updateInTree(group.subGroups, groupId, updates) };
    }
    return group;
  });
}

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toString();
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
