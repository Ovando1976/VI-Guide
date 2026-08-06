# Proactive Trip Intelligence

VI Guide evaluates the most recently updated saved journey using deterministic rules before asking a language model to improve it.

## Signals

- stop timing and duration completeness
- schedule overlaps
- transfer and ferry buffers
- itinerary density
- saved accessibility needs and avoided activities
- unconfirmed booking language
- cruise arrival, all-aboard, and protected return windows
- active National Weather Service alerts for the U.S. Virgin Islands

## Boundaries

- Trip health is advisory and depends on the saved itinerary.
- Official weather alerts are not a full weather forecast.
- Directory records do not prove current hours, availability, or booking confirmation.
- The alert adapter fails open when the upstream service is unavailable; the trip page remains usable and identifies the missing live signal.
- AI repairs remain recommendations until the traveler saves or confirms changes.

## Release gate

`scripts/test-proactive-trip-intelligence.ts` verifies overlap, ferry transfer, cruise return, accessibility, booking, weather-date, prompt, and active-trip normalization behavior.
