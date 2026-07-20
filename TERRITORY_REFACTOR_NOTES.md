# Territory state refactor

## What changed

- Added `hooks/use-territory-state.ts` as the single mutation boundary for Territory OS state.
- Replaced direct `setTerritory(...)` calls in `ExplorerMapScreen` with semantic actions:
  - `changeIsland`
  - `changeLens`
  - `selectEstate`
  - `selectPlace`
  - `clearSelection`
  - `setPickup`
  - `setDestination`
- Added URL hydration and serialization for island, lens, selection, pickup, and destination.
- Preserved unrelated query parameters such as `mode` and `concierge`.
- Added local-storage fallback/persistence for the active island.
- Prevented pickup and destination from resolving to the same estate.
- Preserved stay-mode estate pickup behavior.
- Fixed a duplicated `toEstate` expression found in the supplied screen file.
- Prevented territory query-string updates from resetting the selected ride mode.
- Rejected invalid or out-of-range place coordinates and ratings from shared URLs.
- Bounded URL-hydrated place text to keep malformed links from creating oversized state.
- Cleared stale estate selections, pickups, and destinations after island/history changes.

## Validation performed here

The three changed TypeScript files were parsed using TypeScript 5.9.3's compiler
API and passed syntax diagnostics. Full-project type checking and linting still
need the complete application dependency graph.

Run in the full project after extraction:

```bash
npx tsc --noEmit
npm run lint
grep -n "setTerritory" components/explorer/explorer-map-screen.tsx
```
