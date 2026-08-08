# VI Guide acquisition foundation

## Funnel events
`landing_view` → `intent_selected` → product intent (`concierge_started` / `ride_started` / `offer_viewed`) → `quote_generated` / `offer_requested` → `auth_started` → `account_created` → `checkout_started` → `purchase_completed` → `trip_created`.

## Attribution
Capture first-touch source, medium, campaign, partner, placement, landing path, and referrer. `/go/[code]` is the controlled entry point for physical QR placements and partner links.

## Financial truth
Client conversion events measure funnel behavior only. Stripe/server booking records remain authoritative for captured payments, refunds, disputes, and merchant settlement.

## Privacy and resilience
Acquisition tracking must never block travel flows. Event properties are deliberately scalar and bounded; arbitrary nested client payloads are not persisted.
