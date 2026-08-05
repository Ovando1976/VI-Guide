# VI Guide commerce accounting operations

## Purpose

The commerce ledger records Stripe-verified payment captures and refund events as deterministic accounting entries. It provides an internal source of truth for:

- gross customer funds captured;
- the configured VI Guide platform-fee reserve;
- the remaining merchant settlement obligation;
- exact full-refund reversals;
- payments or refunds that require financial review.

This ledger does **not** transfer money, send merchant payouts, create Stripe connected accounts, recognize accounting revenue, or replace bank and Stripe reconciliation.

## Required configuration

### Stripe commerce webhook

`STRIPE_COMMERCE_WEBHOOK_SECRET` must contain the signing secret for the webhook endpoint that delivers commerce Checkout Session and refund events.

### Platform-fee policy

`VI_GUIDE_COMMERCE_PLATFORM_FEE_BPS` is an optional whole-number basis-point rate from `0` through `10000`.

Examples:

| Value | Rate |
| --- | ---: |
| `250` | 2.5% |
| `1000` | 10% |
| `1250` | 12.5% |

Leave the value blank until the commercial fee has been approved. A blank, malformed, negative, fractional, or greater-than-10000 value is treated as **unconfigured** and records a zero platform-fee reserve. VI Guide never invents a fee.

The rate is snapshotted onto each verified capture. Changing the environment variable affects future captures only; existing ledger entries retain their original allocation.

## Entry behavior

### Verified capture

A verified `checkout.session.completed` event creates one deterministic capture entry keyed by the Stripe PaymentIntent.

The entry records:

- gross captured amount;
- platform-fee reserve;
- merchant settlement obligation;
- booking and listing references;
- Checkout Session, PaymentIntent, and Stripe event identifiers;
- fee rate and policy source;
- occurrence and creation timestamps.

Capture entries are created once. Later webhook delivery or reconciliation may link the booking to the existing entry, but cannot rewrite the stored allocation.

### Capture requiring review

A captured payment outside the expected booking lifecycle, an invalid stored allocation, or incomplete accounting evidence creates or preserves a `review_required` state. Its gross amount is held in `unallocatedAmountCents`; it is excluded from platform-fee and merchant-settlement balances until reviewed.

### Refund

A refund entry is keyed by the Stripe refund ID.

- A verified full refund reverses the exact original gross, platform-fee, and merchant-settlement allocation.
- A processing refund has no balance effect.
- A failed refund has no balance effect and remains visible for review.
- A partial refund, mismatched capture, multiple refund objects, or unverifiable accounting evidence has no allocated balance effect and is marked for review.

Refund status updates may update the same deterministic refund entry, but preserve its original creation timestamp.

## Administrator control room

Open `/admin/commerce-ledger` as an administrator.

The page shows:

- gross captured and verified refund totals;
- net payment balance;
- platform-fee reserve;
- merchant settlement obligation;
- unallocated review amount;
- missing historical capture entries;
- per-business settlement balances;
- recent immutable ledger activity.

Dispatchers and merchants cannot access the ledger API or page.

## Settlement statement exports

Administrators can download either the complete ledger or a listing-scoped merchant statement from `/admin/commerce-ledger`.

CSV statements include:

- booking, ledger, Stripe event, PaymentIntent, Checkout Session, and refund references;
- capture and refund status;
- gross, platform-fee, merchant-settlement, and unallocated amounts in integer cents;
- fee basis points and policy source;
- deterministic statement totals.

Exports never include traveler names, email addresses, phone numbers, notes, or other contact data. Text cells are protected against spreadsheet-formula injection, exports are delivered with `no-store`, and only administrators can access the endpoint.

## Reconciliation

The **Reconcile ledger** action scans recent financial bookings and creates only missing deterministic entries.

Reconciliation:

- never contacts Stripe;
- never issues a charge or refund;
- never sends a payout;
- never overwrites an existing ledger entry;
- uses a zero, unconfigured fee for historical bookings without a stored fee snapshot;
- records the administrator and reconciliation counts in `commerceLedgerReconciliationAudit`.

A concurrent webhook may safely win the race to create an entry. In that case reconciliation fails closed rather than overwriting the webhook record; refresh and run it again.

## Release checklist

1. Confirm `STRIPE_COMMERCE_WEBHOOK_SECRET` belongs to the production commerce webhook endpoint.
2. Leave `VI_GUIDE_COMMERCE_PLATFORM_FEE_BPS` blank unless the approved fee is known.
3. Run all API contract tests.
4. Run repository TypeScript, lint, route-generation, and Next.js build validation.
5. Open `/admin/commerce-ledger` and confirm the policy status.
6. Reconcile historical bookings once.
7. Export the complete CSV and one listing-scoped statement; compare totals to the control room.
8. Review every unallocated or `review_required` entry before relying on settlement totals.
9. Compare totals against Stripe before any future merchant payout workflow is enabled.
