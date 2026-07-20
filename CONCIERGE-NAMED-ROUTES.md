# Concierge named-route repair

The Concierge can now convert a request such as “Caret Bay to Fort Christian”
into one reviewable action that:

1. validates both names against server-supplied directory evidence;
2. resolves each catalog location to its nearest mapped estate route endpoint;
3. sets pickup and destination together;
4. opens Mobility with both endpoint GEOIDs already populated.

This avoids the previous stale-context problem where Open mobility was created
before separate endpoint actions had updated the map state.

The release also renders simple `**bold**` Concierge output as bold text instead
of exposing Markdown punctuation and includes the prior v2 TypeScript fixes.

```bash
node scripts/install-concierge-named-route-fix.mjs
node scripts/install-concierge-named-route-fix.mjs --apply
npm run typecheck
npm run build
```

Acceptance prompt:

`Keep Fort Christian as the destination. Set Caret Bay as pickup and open transportation review.`

Expected result: one Caret Bay → Fort Christian action opens a populated
Mobility review. It must not claim a ride was booked.
