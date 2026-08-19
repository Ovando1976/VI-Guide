# Phase 1 Release Checklist

- [ ] `npm run test:phase1-gate` passes.
- [ ] `npm run test:api-contracts` passes.
- [ ] Typecheck/build checks pass.
- [ ] No client-originated financial events are observed.
- [ ] No duplicate Stripe/ledger financial side effects are observed.
- [ ] Every financial event has provider and booking attribution.
- [ ] Cruise plan/activity/checkout evidence includes explicit `return_buffer_met`.
- [ ] Production deployment remains blocked until every item above is green.
