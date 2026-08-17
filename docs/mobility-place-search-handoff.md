# Mobility traveler place search handoff

The traveler-facing route controls now have reusable components ready for BookingPanel integration:

- `MobilityPlacePicker`: searches familiar geography names and emits only a mapped official estate GEOID.
- `MobilityRouteFields`: presents Pickup and Destination search plus route swap.
- `MobilityRouteStep`: composes search, route preview, and pickup/drop-off instructions.

## Fail-closed rule

A geography result without a `relatedEstateGeoids` match in the currently available tariff estates is disabled and labeled `fare area needs review`. It must never be passed to `/api/bookings/quote` as a guessed estate.

## BookingPanel replacement

Replace the current Step 01 estate-select/route-preview/instructions block with `MobilityRouteStep`, passing the existing state and callbacks. Quote and booking payloads remain unchanged and continue to send only `originEstateGeoid` and `destinationEstateGeoid`.
