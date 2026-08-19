# Airport Hub implementation contract

This branch introduces Cyril E. King Airport (STT) as a canonical mobility endpoint without duplicating regulated fare data.

## Invariants

- Customer-facing aliases such as STT, TIST, Cyril E. King Airport, and St. Thomas Airport resolve to the governed `Airport Terminal` tariff endpoint.
- Official fares continue to come only from the single verified active St. Thomas tariff.
- Routing uses a public-terminal frontage anchor and Airport Road / VI Route 302 context rather than the aerodrome centroid.
- Unknown mobility endpoints continue to fail closed.
- The airport endpoint is exposed with the mobility choices returned by `/api/estates` so the existing booking UI can select it.

## Follow-up before enabling airport bookings

The booking-create API must resolve canonical mobility hubs the same way as the quote API before the St. Thomas booking pilot is activated. Until then, fare quoting can be validated independently while booking remains gated by pilot readiness.
