# VI Guide Map Workspace V2

## Product improvements

- Moved the account menu into the primary navigation so it no longer floats
  over map status or resembles an unexplained zero badge.
- Replaced six large status cards with one compact, progressive status bar.
- Changed the module dock to horizontal scrolling on phones and a responsive
  grid on larger displays.
- Shows truthful coverage as `mapped · total` for each travel catalog.
- Scoped directory statistics to the active module instead of mixing all
  catalog kinds into one total.
- Reduced the initial directory from 18 records to 12 and uses three columns on
  tablet/desktop widths.
- Added real catalog imagery with a graceful category fallback.
- Made result cards more compact and customer-oriented with rating, location,
  focus, details, and itinerary actions.
- Fixed external result selection so `Focus map` highlights the actual marker,
  opens its map card, and moves the camera to it.
- Added detail-page access directly from the selected marker card.
- Consolidated marker and directory saving into the shared `vi-guide-trip-v1`
  itinerary store.
- Lifted the Concierge trigger above bottom navigation on phones and reduced its
  mobile footprint.
- Corrected the account menu's Territory Map route from `/` to `/map`.

## Validation

- TypeScript: passed.
- ESLint: passed without warnings or errors.
- Architecture inspector: 192 modules, 228 dependency edges, zero violations,
  zero errors.
- Next.js production build: passed; all 39 pages generated.
- Production runtime smoke test: `/map` HTTP 200 and `/api/health` HTTP 200.

## Install

From the VI Guide repository root:

```bash
tar -xzf vi-guide-map-workspace-v2.tar.gz -C .
npx tsc --noEmit
npm run lint
npm run build
```
