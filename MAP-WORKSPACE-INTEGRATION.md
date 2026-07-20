# Map workspace module integration

## Integrated modules

- Estates: always-on geography, selection, profiles, pickup, and destination.
- Places: map lens, searchable directory, map focus, details, and trip saving.
- Beaches: map lens, searchable directory, map focus, details, and trip saving.
- Stays: map lens, searchable directory, map focus, details, and trip saving.
- Historic sites: map lens, searchable directory, map focus, details, and trip saving.
- My trip: shared `vi-guide-trip-v1` storage and direct planner access.
- Mobility: contextual island handoff plus the existing route composer.
- Concierge: opens in place without dropping the current map query or selection.

## UX improvements

- Added a responsive connected-module dock with live per-island counts.
- Added the previously missing active-module search control.
- Added actionable directory cards with detail, focus, and save controls.
- Kept unpositioned records visible while disabling only their map-focus action.
- Preserved the canonical Territory state boundary and existing detail routes.

## Validation

- `npx tsc --noEmit` — passed.
- `npm run lint` — passed with no warnings or errors.
- Architecture inspector — 192 modules, 227 edges, zero violations, zero errors.
- `npm run build` — passed; all 39 static pages generated.
- Production smoke tests — `/map` returned 200 and `/api/health` returned 200.

## Install

Extract the release archive from the VI Guide repository root, then run:

```bash
tar -xzf vi-guide-map-workspace-integration.tar.gz -C .
npx tsc --noEmit
npm run lint
npm run build
```
