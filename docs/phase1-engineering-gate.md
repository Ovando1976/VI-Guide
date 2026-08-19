# Phase 1 Engineering Gate

Production is blocked unless the Phase 1 proof is green in CI.

## Required vertical slice

Explore (`landing_view`) → Concierge (`concierge_started`) → Cruise plan (`plan_created`) → Activity (`plan_item_added`) → Checkout (`checkout_started`) → verified Stripe payment (`payment_completed`).

## Binary invariants

- Financial events are server-originated only.
- Stripe/ledger financial side effects are idempotent and duplicate financial event keys fail the gate.
- Financial events resolve both a provider scope and booking ID.
- Cruise plan, activity, and checkout events explicitly report boolean `return_buffer_met`.
- Unsafe shore-excursion timing remains fail-closed before booking creation.

## Reproducible proof

Run:

```bash
npm run test:phase1-gate
```

The same proof is included in `npm run test:api-contracts`, which is included in `prebuild`.

The admin-only `/admin/analytics` page visualizes the observed funnel and reports the same financial attribution and cruise return-buffer failures. It does not replace CI as the release authority.
