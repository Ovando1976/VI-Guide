# VI Guide unified planning experience

This release makes the saved trip the shared action layer across discovery,
maps, detail pages, stays, mobility, and Concierge prompts.

## Included

- One-click, duplicate-safe saves with smart day and daypart suggestions
- Persistent 1–14 day trip length
- Day-grouped mobile itinerary with direct Map, Ride, and detail actions
- Quick optimization that keeps island days together
- Warnings for St. Croix transfers, overloaded days, and crowded dayparts
- Add-to-plan actions for places, beaches, historic sites, and stays
- URL Concierge prompts that now open and send automatically
- Backward-compatible normalization of existing `vi-guide-trip-v1` data

## Install

```bash
node scripts/install-planning-integration.mjs
node scripts/install-planning-integration.mjs --apply
npm run typecheck
npm run build
```

## Acceptance checks

1. Add a place from the map, then open My trip.
2. Add a beach/detail page and confirm it appears only once.
3. Change trip length and assign stops to different days.
4. Use Quick optimize and verify St. Croix is not mixed with St. Thomas/St. John.
5. Select Improve with AI and confirm the Concierge opens and sends the itinerary prompt.
6. Test Map and Ride on an itinerary stop.
