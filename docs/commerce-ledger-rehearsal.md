# Commerce ledger financial rehearsal

## Goal

Prove the accounting behavior for a verified payment capture followed by an exact full refund without contacting Stripe, Firebase, a bank, or a card network.

## Run the deterministic rehearsal

```bash
npm run commerce:ledger:rehearse
```

The command is also part of `npm run test:api-contracts`, so every release build exercises the same scenario.

The rehearsal verifies all of the following:

- a $250.00 verified capture is accepted;
- a 10% snapshotted platform-fee policy allocates $25.00 to the VI Guide reserve;
- the remaining $225.00 is recorded as the merchant settlement obligation;
- an exact full refund reverses the original allocation rather than recalculating it;
- net gross, platform-fee reserve, merchant settlement, and unallocated balances all finish at zero;
- the listing-scoped CSV contains both deterministic entries;
- the CSV statement total is `validated` with a rejected-record count of zero.

The script uses synthetic Stripe-shaped identifiers only. It cannot charge a card, create a refund, alter Firestore, or move money.

## Stripe sandbox verification

A real Stripe event-delivery rehearsal must run in a Stripe sandbox, never against the connected live account.

1. In the Stripe Dashboard account picker, create or open a dedicated VI Guide sandbox.
2. Create a sandbox webhook endpoint for the isolated preview URL at `/api/stripe/commerce-webhook`.
3. Subscribe the endpoint to:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `refund.created`
   - `refund.updated`
   - `refund.failed`
4. Configure only the preview deployment with the sandbox secret key and sandbox webhook signing secret.
5. Keep `VI_GUIDE_COMMERCE_PLATFORM_FEE_BPS` blank unless an approved rehearsal rate is intentionally being tested.
6. Create one sandbox Checkout payment and complete it with a Stripe test card.
7. Confirm the booking is marked paid and one deterministic capture ledger entry exists.
8. Issue one exact full sandbox refund.
9. Confirm one deterministic refund entry reverses the capture allocation and the listing balance returns to zero.
10. Export the listing-scoped CSV and confirm `validated`, zero rejected records, and zero final balances.

Do not copy sandbox secrets into Production. Do not use a live PaymentIntent for this procedure.

## Production webhook control

The production commerce webhook must remain subscribed to both Checkout and refund events. The code handles all five event types listed above; removing refund subscriptions would prevent Stripe refund events from reaching the ledger even though the application code is prepared to process them.
