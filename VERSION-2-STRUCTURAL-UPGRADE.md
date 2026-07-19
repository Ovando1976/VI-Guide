# VI Guide Version 2 — Structural Travel Knowledge Upgrade

## What changed

- Public discovery content no longer requires a Firestore connection.
- Added generated local catalogs under `data/travel-knowledge/` for places, beaches, and historic sites.
- Existing verified accommodation catalog remains local through `lib/accommodations.ts`.
- Added `lib/travel-knowledge.ts` as the single public-content access layer.
- Rebuilt Places, Beaches, Historic, and Stays discovery pages around destinations, recommendations, categories, and search rather than database counters.
- Rebuilt place and beach detail loading to use local travel knowledge.
- Rebuilt historic detail loading to use local travel knowledge.
- Concierge public place and beach evidence now comes from local travel knowledge rather than Firestore.

## Firestore remains appropriate for

- Authentication and profiles
- Favorites and saved trips
- Booking and ride requests
- Reviews and user submissions
- Concierge sessions, messages, and memory
- Driver, vehicle, dispatch, merchant, and admin operations
- Other live or user-specific records

## Validation

- `npx tsc --noEmit` passes.
- `next build` compiles and passes lint/type validation. The hosted validation process timed out while collecting page data, after successful compilation.
