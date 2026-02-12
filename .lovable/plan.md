

## Add Mini Legend to Drone Breakdown

A small footnote will be added below the drone list in the popup breakdown to explain what the arrows and wind margin values mean.

### What will be added

A single line at the bottom of the expanded "All profiles" section, styled in muted text (matching the existing `#64748b` color), that reads something like:

**"▼ within max wind · ▲ exceeds max wind"**

This gives users an at-a-glance reference for interpreting the arrows without cluttering the layout.

### Technical Details

**File:** `src/components/map/DroneMap.tsx`

A new `div` will be inserted after the `ALL_DRONE_TYPES.map(...)` block inside the expanded breakdown section. It will use `text-[9px]` sizing (slightly smaller than the data rows) with a top border separator and muted styling to keep it unobtrusive.

```tsx
<div className="text-[9px] mt-1.5 pt-1" style={{ color: "#4a5568", borderTop: "1px solid #1e3a5f" }}>
  ▼ within max wind · ▲ exceeds max wind
</div>
```

