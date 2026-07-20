# Automatic Concierge route preparation

Safe route preparation is now automatic. When a traveler names two catalog
locations, the Concierge resolves and applies both endpoints and opens Mobility.
The traveler confirms only on the official review/booking screen.

Corrections included:

- duplicate catalog records with the same normalized name count once;
- aliases such as `Caret Bay` match `Caret Bay Beach`;
- route names survive follow-up messages such as “confirm the route”;
- evidence retrieval uses recent traveler messages, not only the latest line;
- an approved `prepare_mobility` action executes automatically because it is a
  reversible local navigation change, not a booking or payment;
- dispatch, booking, and payment still require the existing confirmation flow.

```bash
node scripts/install-concierge-autonomous-route.mjs
node scripts/install-concierge-autonomous-route.mjs --apply
npm run typecheck
npm run build
```
