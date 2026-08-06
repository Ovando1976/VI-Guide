# Commerce sandbox end-to-end runbook

## Objective

Prove that a Stripe-originated Checkout payment and exact full refund create the expected VI Guide booking, webhook-audit, ledger, and CSV evidence without touching live Stripe data or production Firebase.

This procedure is intentionally separate from production. The repository preflight command must pass before any sandbox network operation begins.

## Non-negotiable isolation rules

- Never use a key beginning with `sk_live_` or `rk_live_`.
- Never point the sandbox app at `vi-guide.vercel.app`.
- Never use the production Firebase project or production service-account credentials.
- Never copy a production webhook signing secret into the sandbox environment.
- Never send sandbox notifications to real travelers or merchants.
- Never use a live card, live PaymentIntent, or live Refund for validation.

## 1. Create isolated resources

Create or select:

1. a Stripe sandbox or Stripe test-mode workspace;
2. a separate Firebase project whose ID explicitly contains `sandbox`, `test`, `demo`, or `emulator`;
3. a local or remote application URL whose hostname explicitly identifies it as a sandbox;
4. test-only notification recipients.

Prefer a restricted Stripe test key (`rk_test_`) scoped only to the resources needed for Checkout Sessions, PaymentIntents, Refunds, Events, and Webhook Endpoints.

The Stripe CLI can be used to create a sandbox and forward test events locally:

```bash
npm install --global @stripe/cli
stripe sandbox create
```

## 2. Configure the sandbox environment

Copy the committed template:

```bash
cp .env.sandbox.example .env.sandbox
```

Populate `.env.sandbox` only with sandbox values. Keep `.env.sandbox` out of version control.

The following values are deliberate cross-checks rather than aliases:

- `FIREBASE_PROJECT_ID`
- `VI_GUIDE_SANDBOX_FIREBASE_PROJECT_ID`

They must match exactly.

Set the real production project ID and application URL only in these comparison fields:

- `VI_GUIDE_PRODUCTION_FIREBASE_PROJECT_ID`
- `VI_GUIDE_PRODUCTION_APP_URL`

Do not place production credentials in the sandbox file.

## 3. Run the fail-closed preflight

```bash
npm run commerce:sandbox:check -- --env .env.sandbox
```

The command must report:

- `result: passed`;
- `stripeMode: test`;
- the expected isolated Firebase project ID;
- a non-production app origin;
- `externalWrites: 0`;
- `stripeOperations: 0`.

Any live Stripe key, production hostname, mismatched Firebase project, missing confirmation phrase, malformed webhook secret, or invalid fee policy blocks the run.

## 4. Start the isolated application and webhook listener

Load `.env.sandbox` through the local environment manager, then start the VI Guide application.

In a separate terminal, forward only the commerce events:

```bash
stripe listen \
  --events checkout.session.completed,checkout.session.expired,refund.created,refund.updated,refund.failed \
  --forward-to localhost:3000/api/stripe/commerce-webhook
```

Copy the listener's `whsec_...` value into `STRIPE_COMMERCE_WEBHOOK_SECRET` for the isolated app and restart the app after changing the environment.

For a remote sandbox deployment, create a sandbox webhook endpoint for:

`https://<sandbox-host>/api/stripe/commerce-webhook`

Subscribe only to:

- `checkout.session.completed`
- `checkout.session.expired`
- `refund.created`
- `refund.updated`
- `refund.failed`

## 5. Create a sandbox commerce booking

Use the normal VI Guide booking flow in the isolated app. The booking must reach `payment_required` with:

- a valid sandbox traveler email;
- a deterministic deposit amount;
- a listing ID and listing name;
- a booking reference;
- an explicit platform-fee policy.

Create Checkout through the normal `/api/payments/create-checkout-session` route. Do not create an unrelated PaymentIntent directly, because the webhook verifies the Checkout Session ID, amount, email, reference, and PaymentIntent provenance against the stored booking.

## 6. Complete the Stripe test payment

Open the Checkout URL and use a Stripe test payment method. Confirm that the isolated Firebase project contains:

### `commerceBookings/<bookingId>`

- `paymentStatus: paid`
- the verified `paymentIntentId`
- the verified `checkoutSessionId`
- `paidAmountCents` equal to the deposit
- `paymentIntegrityStatus: verified`
- the capture-ledger allocation fields

### `stripeWebhookEvents/<eventId>`

- the Checkout event type
- the booking ID
- the Checkout Session ID
- the PaymentIntent ID
- a successful reconciliation outcome

### `commerceLedgerEntries/<captureId>`

- `kind: capture`
- `status: held`
- gross amount equal to the paid deposit
- platform fee equal to the configured basis-point policy
- merchant settlement equal to gross less platform fee
- `unallocatedAmountCents: 0`

## 7. Issue one exact full sandbox refund

Issue a full refund from the Stripe sandbox Dashboard or test-mode API for the verified PaymentIntent. Do not create multiple or partial refunds for this acceptance test.

Confirm that the isolated Firebase project contains:

### `commerceBookings/<bookingId>`

- `status: cancelled`
- `paymentStatus: refunded`
- `refundStatus: succeeded`
- the verified refund ID and amount

### `stripeWebhookEvents/<refundEventId>`

- the refund event type
- the booking ID
- the PaymentIntent ID
- the refund ID
- `fullRefund: true`
- a reconciled accounting outcome

### `commerceLedgerEntries/<refundId>`

- `kind: refund`
- a reversal reference to the capture entry
- gross, platform-fee, and merchant-settlement amounts that exactly reverse the capture
- `unallocatedAmountCents: 0`

## 8. Verify final accounting and CSV evidence

Open the isolated `/admin/commerce-ledger` view and export the CSV.

The acceptance criteria are:

- net gross: `0`;
- platform-fee reserve: `0`;
- merchant settlement obligation: `0`;
- unallocated amount: `0`;
- rejected CSV rows: `0`;
- no production Stripe objects created;
- no production Firebase documents written;
- no real traveler or merchant notified.

## 9. Preserve evidence and remove test data

Preserve only non-secret evidence:

- sandbox account or workspace identifier;
- isolated Firebase project ID;
- deployment identifier;
- Checkout Session, PaymentIntent, Refund, and Stripe event IDs;
- capture and refund ledger entry IDs;
- final validated totals;
- timestamps and operator identity.

Then remove the isolated booking and notification test data according to the test-data retention policy. Never copy signing secrets, API keys, service-account keys, customer emails, or card details into GitHub comments or release records.
