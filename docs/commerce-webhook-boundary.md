# Commerce webhook boundary verification

## Purpose

`npm run commerce:webhook:boundary` exercises the actual Next.js route at:

`/api/stripe/commerce-webhook`

The test uses Stripe's Node SDK to generate webhook signatures locally. It does not contact Stripe, Firebase, card networks, or payment providers.

## What the test proves

The boundary test verifies that the production route:

- rejects requests without a Stripe signature;
- rejects malformed or forged signatures;
- rejects a payload that was modified after signing;
- accepts a correctly signed ignored event;
- accepts correctly signed `checkout.session.completed` and `checkout.session.expired` events when no database mutation is required;
- preserves the unpaid-checkout guard before any Firestore access;
- explicitly handles `refund.created`, `refund.updated`, and `refund.failed`;
- performs zero external writes and zero live Stripe operations.

The test runs in the permanent `test:api-contracts` release gate, immediately after the deterministic commerce-ledger capture/full-refund rehearsal.

## Separation of responsibilities

The signed boundary test and ledger rehearsal intentionally cover different risks:

1. **Webhook boundary:** raw request body, signature verification, tamper rejection, event recognition, and safe early guards.
2. **Ledger rehearsal:** capture allocation, platform-fee snapshot, merchant obligation, exact full-refund reversal, final balances, and CSV totals.
3. **Stripe sandbox:** Stripe-originated event delivery and Firebase persistence in an isolated Stripe sandbox and non-production data project.

The first two run on every build and never move money. The third remains an operational validation step and must never be performed against live payments merely to test the application.

## Run locally

```bash
npm run commerce:webhook:boundary
```

Expected result:

- `result: passed`;
- `externalWrites: 0`;
- `liveStripeOperations: 0`.

## Stripe sandbox completion checklist

When an authenticated Stripe sandbox and isolated Firebase project are available:

1. configure a sandbox webhook endpoint for the commerce route in the isolated deployment;
2. subscribe it to checkout completion/expiry and refund created/updated/failed events;
3. create one sandbox commerce booking and Checkout Session;
4. complete payment with a Stripe test payment method;
5. confirm the booking, capture ledger entry, and webhook audit record;
6. issue one exact full sandbox refund;
7. confirm the refund ledger entry exactly reverses gross, fee reserve, and merchant obligation;
8. export the CSV and confirm validated totals and zero rejected records;
9. delete the isolated test data after preserving the audit evidence.

Do not substitute a live charge or live refund for this sandbox procedure.
