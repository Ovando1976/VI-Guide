# Production mobility tariff gates

## Commission-shaped data workflow

The application treats a tariff endpoint as a published place name, not merely
as a Census estate. A rule may carry every spelling printed or historically
used for an endpoint in `originNames` and `destinationNames`, while optional
estate GEOIDs provide map context. When the traveler selects a named catalog
place, the exact requested label is matched against those tariff aliases.
Nearby-estate substitution is never used to invent an official fare.

Tariffs move through three states:

1. `draft` — a researched transcription that cannot quote or collect payment.
2. `active` — a Commission schedule with source hash and reviewer approval.
3. `retired` — an earlier version retained for booking and audit history.

Use `npm run tariffs:import -- --file=tariff.json` for a dry run. Add `--apply`
to store a draft. Activation additionally requires `--activate`; the importer
retires the previous active schedule for that island in the same transaction.

Use `npm run tariffs:audit -- --file=tariff.json` to validate a local artifact
without Firebase. Omit `--file` to audit Firestore. The audit fails unless
exactly one verified active schedule exists for St. Thomas, St. John, and
St. Croix.

The research trail is stored in
`data/taxi-tariffs/research-manifest.json`. Secondary transcriptions are never
sufficient for activation on their own.

This patch makes taxi pricing fail closed. A route can proceed to payment only when the server resolves exactly one rule from exactly one active Virgin Islands Taxicab Commission tariff.

## Behavior

- Exact named endpoints are preserved in the review UI.
- A named place that differs from its Census estate cannot silently inherit that estate's fare.
- Official quotes expire after 30 minutes and are revalidated before Stripe creates a PaymentIntent.
- Passenger bands support flat-party and per-person schedules; calculations use integer cents.
- Missing, ambiguous, expired, future-dated, or malformed tariff rules create no priced booking.
- The user may confirm the route and create an idempotent `taxiRateReviews` request. That request creates no payment, booking, or dispatch assignment.
- Stripe PaymentIntents are bound to the booking and tariff metadata. The signed webhook verifies rider, booking, intent, currency, and amount before setting `paymentStatus: paid`.
- Existing dispatch eligibility continues to require `paymentStatus: paid`.

## Required release checks

```bash
npm run typecheck
npm run build
npm run tariffs:audit -- --export=reports/active-taxi-tariffs.sanitized.json
```

Do not deploy if the tariff audit reports any error. Review the sanitized export against the current source material held by the Virgin Islands Taxicab Commission. Never place credentials or rider records in that export.

## Operations

There must be exactly one active `taxiTariffs` document for each island (`stt`, `stj`, and `stx`). Each document must retain its issuing authority, version, effective date, HTTPS source URL, and rule identifiers. A manual review is resolved only by publishing or correcting an authorized tariff rule; staff must not type an ad-hoc price into a booking.
