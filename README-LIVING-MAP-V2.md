# VI Guide — Living Map Visual System v2

This patch continues the map redesign toward the approved all-island concept.

## What changed

- Replaced plain map dots with category-aware icon markers.
- Reduced default estate-boundary clutter; boundaries can now be toggled on.
- Simplified the oversized in-map header and removed duplicate map metrics.
- Made the floating layer panel interactive; selecting a layer changes the active lens.
- Added a compact bottom layer switcher similar to the approved concept.
- Preserved satellite and dark map styles plus the Full Island reset.
- Kept selected estates, pickup, destination, route, place cards, drivers, and demand functional.
- Improved map chrome, marker hover/selection states, and Leaflet controls.

## Install

From the project root:

```bash
tar -xzf archives/vi-guide-living-map-visual-v2.tar.gz
rm -rf .next
npm run dev
```

## Validation checklist

1. The initial view should show the full island with boundaries hidden.
2. Tap Boundaries to reveal estate outlines.
3. Switch layers from the top tabs, left panel, and bottom legend.
4. Select a place marker and verify the action card.
5. Select an estate and verify focused highlighting and intelligence rail updates.
6. Test Satellite / Dark Map and Full Island controls.
