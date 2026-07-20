# Cross-catalog Concierge route evidence

Fort Christian is a historic record, while Caret Bay is a beach record. The
previous Concierge evidence window included only places and beaches, so the
server correctly rejected a route action whose second endpoint was absent.

This fix:

- adds historic records to server-controlled directory evidence;
- recognizes exact endpoint names across places, beaches, and history;
- determines pickup/destination roles from phrases such as `from`, `to`,
  `as pickup`, and `as destination`;
- deterministically inserts one validated `prepare_mobility` action even if the
  language model answers without one;
- continues to open review only—it never books a ride.

```bash
node scripts/install-concierge-route-evidence-fix.mjs
node scripts/install-concierge-route-evidence-fix.mjs --apply
npm run typecheck
npm run build
```
