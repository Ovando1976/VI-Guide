# Unified Territory Data Model v1

This milestone creates the shared entity contract used by the Living Map, discovery, trip planning, mobility, and Concierge.

## Added

- `types/territory.ts`: canonical `TerritoryEntity` schema.
- `lib/territory/adapters.ts`: adapters for estates, manifest places, and travel-knowledge records.
- `lib/territory/catalog.ts`: one queryable catalog for places, beaches, and historic sites.
- `app/api/territory/route.ts`: read-only API for inspecting/filtering the unified catalog.

## API examples

- `/api/territory?island=stt&positioned=true`
- `/api/territory?island=stt&kinds=beach,historic`
- `/api/territory?q=charlotte`

## Architecture rule

New geographic or operational data should enter the product through a `TerritoryEntity` adapter rather than being passed directly to map or Concierge components.

The existing UI remains compatible. The next milestone will switch the right intelligence panel to consume `TerritoryEntity` directly.
