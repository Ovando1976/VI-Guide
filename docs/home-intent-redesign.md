# Homepage customer-intent redesign

The homepage now introduces four traveler situations before the existing discovery/status layer: Here now, Arriving soon, Cruise passenger, and Planning a trip. Each entry hands off to Concierge with a situation-specific prompt and emits the shared `intent_selected` acquisition event.

This branch is rebuilt cleanly from `main` after the acquisition foundation merge, avoiding the overlapping history from the original stacked branch.
