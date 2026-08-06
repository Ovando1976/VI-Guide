# Booking Notification Operations

This runbook covers the durable commerce-booking email outbox, delivery recovery, and production configuration.

## Required production configuration

Set these as server-only Vercel Production environment variables. Do not prefix secrets with `NEXT_PUBLIC_`.

| Variable | Purpose |
| --- | --- |
| `FIREBASE_PROJECT_ID` | Firebase Admin project identifier. |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin service-account email. |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin private key. |
| `STRIPE_SECRET_KEY` | Stripe server API key. |
| `STRIPE_COMMERCE_WEBHOOK_SECRET` | Signature secret for `/api/stripe/commerce-webhook`. |
| `RESEND_API_KEY` | Resend server API key. |
| `VI_GUIDE_EMAIL_FROM` | Verified sender, such as `VI Guide <bookings@example.com>`. |
| `VI_GUIDE_OPERATIONS_EMAILS` | Comma-separated operations recipients. |
| `VI_GUIDE_APP_URL` | Canonical HTTPS origin used in email links. |
| `CRON_SECRET` | Random secret of at least 16 characters for the recovery route. Use 32 or more characters in production. |

`STRIPE_WEBHOOK_SECRET` remains separately required for the existing ride-payment webhook. Never commit secret values to the repository.

## External setup

### Stripe

The commerce endpoint is:

```text
/api/stripe/commerce-webhook
```

Subscribe it to:

- `checkout.session.completed`
- `checkout.session.expired`
- `refund.created`
- `refund.updated`
- `refund.failed`

Keep the existing ride-payment webhook and its event subscriptions separate.

### Resend

1. Verify the production sending domain.
2. Create a server API key.
3. Configure `VI_GUIDE_EMAIL_FROM` with an address on the verified domain.
4. Confirm the operations recipients can receive messages from the verified sender.
5. Send a test-mode booking through the full lifecycle before enabling broad merchant onboarding.

The application can validate that a sender identity is structurally valid, but it cannot verify DNS ownership or the Resend account state. Complete a real provider test before relying on production mail.

### Vercel Cron

`vercel.json` schedules:

```text
0 13 * * *
```

This runs `/api/cron/notification-outbox` daily at 13:00 UTC, which is 9:00 a.m. in the U.S. Virgin Islands.

When `CRON_SECRET` is configured, the cron request must carry:

```text
Authorization: Bearer <CRON_SECRET>
```

## Readiness checks

### Public health endpoint

Open `/api/health` and verify:

- `release.bookingReady` remains the original mobility-booking readiness signal.
- `release.mobilityBookingReady` is `true`.
- `release.commerceBookingReady` is `true`.
- `release.notificationReady` is `true`.
- `release.commerceOperationsReady` is `true`.
- `release.stripeCommerceWebhookConfigured` is `true`.

The public endpoint exposes only high-level booleans. It does not reveal secret values, recipient addresses, or a list of missing internal services.

### Admin control room

Open `/admin/notifications` as an administrator or dispatcher.

Confirm that:

- the protected configuration panel shows exactly which notification dependencies are ready or missing;
- pending, processing, delivered, failed, and retryable counts load;
- dispatchers can inspect but do not see retry or reconciliation controls;
- administrators can retry an eligible record;
- the audit record appears in `notificationOutboxAudit`;
- a delivered record contains the Resend provider message ID.

## Delivery lifecycle

1. Booking creation or merchant lifecycle changes write deterministic outbox records in the same Firestore transaction.
2. The request attempts immediate delivery.
3. Failed, unresolved, or unconfigured deliveries remain durable with a future `nextAttemptAt`.
4. A worker claims a record with a unique lease token.
5. Only the worker holding the current lease may finalize the record.
6. The daily recovery route reconciles missing verified Stripe payment and refund messages, attempts them, and then drains due retries.
7. Administrators can manually retry eligible records from `/admin/notifications`.

Outbox IDs are deterministic by booking, event, and audience. A retry cannot create a second record for the same logical notification.

## Safety rules

- Never create a new outbox document to retry an existing event.
- Never modify a delivered record to force another email.
- Use the audited retry action instead of editing Firestore manually.
- Financial reconciliation creates only missing deterministic records.
- Financial reconciliation does not backfill ordinary request, review, confirmation, completion, cancellation, or decline emails.
- Captured payments marked `review_required` do not send traveler or merchant payment-confirmation emails.
- Do not merge or deploy notification changes until the exact branch head passes contracts, TypeScript, lint, and a production-equivalent Next.js build.

## Production smoke test

After the exact release commit is `READY` and serving `vi-guide.vercel.app`:

1. Verify the public and protected readiness checks above.
2. Create one controlled test-mode commerce booking.
3. Confirm traveler, merchant, and operations request records are created.
4. Confirm Resend returns provider message IDs and the records become `delivered`.
5. Move the booking through review and payment-required states.
6. Complete one Stripe test-mode payment.
7. Run financial reconciliation and confirm it does not duplicate existing records.
8. Review Vercel runtime logs for notification, cron, Firestore, Resend, or Stripe errors.
9. Remove or clearly identify the test booking after verification.

## Incident response

### Provider not configured

The record remains pending with `email_provider_not_configured`. Configure Resend and the sender identity, then use the audited retry control.

### Recipient unresolved

Traveler records require a valid booking email. Merchant records resolve enabled merchant accounts containing the exact booking listing ID. Operations records use `VI_GUIDE_OPERATIONS_EMAILS`.

Correct the underlying recipient source, then retry the record.

### Expired processing lease

An expired processing record becomes retryable. A new worker receives a different lease token. The stale worker cannot overwrite the newer attempt.

### Repeated provider failure

After the maximum automatic attempts, the record becomes failed. Review `lastError`, correct the provider or data issue, and use the admin retry action. Every manual retry is audited.

### Missing Stripe financial email

Use **Reconcile payments** in `/admin/notifications`. This scans recent commerce bookings for verified payment and refund states and creates only absent deterministic outbox records.

## Rollback boundary

Rolling back the application must not delete `notificationOutbox`, `notificationOutboxAudit`, or `merchantAccounts` data. Durable records can be processed after the application is restored. Disable the scheduled route before changing provider credentials or sender domains during an incident.
