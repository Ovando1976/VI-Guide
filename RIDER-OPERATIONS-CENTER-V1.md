# VI Guide rider operations center v1

## Experience

- Active, upcoming, completed, and cancelled rides in one authenticated view.
- Live refresh while the page is visible.
- Official fare, route, pickup instructions, driver, vehicle, and taxi-plate context.
- Sequential progress rail and immutable trip-event timeline.
- Rider cancellation only when the shared booking workflow permits it.
- Concierge help scoped to the selected booking, with confirmation retained.
- Pending official-rate review requests shown separately from bookings.
- Direct entry from the unified trip planner.

## Privacy and accuracy

The API resolves the signed-in user on the server and returns only that rider's
bookings and rate-review requests. Driver and vehicle responses are limited to
public trip-identification fields. No unverified support phone or provisional
fare is presented as official.

## Verify

```sh
npm run mobility:test
npm run typecheck
npm run build
```

Then test `/trips/operations` while signed in as a rider.
