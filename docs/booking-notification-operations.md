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

`STRIPE_WEBHOOK_SECRET` remains separately required for the existing ride-payment webhook.

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
4. Send a test-mode booking through the full lifecycle before enabling broad merchant onboarding.

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

- `release.mobilityBookingReady` is `true`.
- `release.commerceBookingReady` is `true`.
- `release.notificationReady` is `true`.
- `release.stripeCommerceWebhookConfigured` is `true`.
- `release.notification.missing` is empty.

The endpoint reports only configuration booleans and counts. It does not expose secret values or recipient addresses.

### Admin control room

Open `/admin/notifications` as an administrator.

Confirm that:

- the configuration panel reports transactional email as configured;
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

## Safety rules

- Never create a new outbox document to retry an existing event.
- Never modify a delivered record to force another email.
- Use the audited retry action instead of editing Firestore manually.
- Financial reconciliation creates only missing deterministic records.
- Financial reconciliation does not backfill ordinary request, review, confirmation, completion, cancellation, or decline emails.
- Captured payments marked `review_required` do not send traveler or merchant payment-confirmation emails.
- Do not merge or deploy notification changes until the exact branch head passes contracts, TypeScript, lint, and a production-equivalent Next.js build.

## Incident response

### Provider not configured

The record remains pending with `email_provider_not_configured`. Configure Resend and the sender identity, then use the audited retry control.

### Recipient unresolved

Traveler records require a valid booking email. Merchant records resolve enabled merchant accounts containing the booking listing ID. Operations records use `VI_GUIDE_OPERATIONS_EMAILS`.

Correct the underlying recipient source, then retry the record.

### Expired processing lease

An expired processing record becomes retryable. A new worker receives a different lease token. The stale worker cannot overwrite the newer attempt.

### Repeated provider failure

After the maximum automatic attempts, the record becomes failed. Review `lastError`, correct the provider or data issue, and use the admin retry action. Every manual retry is audited.

### Missing Stripe financial email

Use **Reconcile payments** in `/admin/notifications`. This scans recent commerce bookings for verified payment and refund states and creates only absent deterministic outbox records.
