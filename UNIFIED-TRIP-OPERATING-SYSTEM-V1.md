# VI Guide unified trip operating system v1

This patch extends the existing canonical trip store without changing its item
storage format, preserving compatibility with Map, Explore, detail pages, and
the Concierge.

## Included

- Persistent start date, traveler count, luggage, and ride preference.
- Automatic transportation legs between itinerary stops.
- Same-island legs open prefilled mobility review.
- St. Thomas/St. John legs open AI-assisted ferry-transfer planning.
- St. Croix cross-island legs open AI-assisted flight-transfer planning.
- Missing coordinates are surfaced instead of silently guessed.
- A readiness summary shows taxi legs and unresolved transfers.
- The Concierge receives the complete trip profile in its itinerary-review prompt.

## Safety boundary

Trip planning remains available for every catalog entry. Mobility review still
uses the existing official/provisional/unresolved tariff gates. This patch does
not promote tariffs, invent prices, or bypass confirmation and payment controls.

## Verification

```sh
npm run mobility:test
npm run typecheck
npm run build
```
