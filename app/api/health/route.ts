import { NextResponse } from "next/server";

import { hasFirebaseAdminConfiguration } from "@/lib/firebase-admin";
import { notificationConfigurationStatus } from "@/lib/notifications/notification-configuration";

export const dynamic = "force-dynamic";

export async function GET() {
  const firebaseAdminConfigured = hasFirebaseAdminConfiguration();
  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
  const stripeWebhookConfigured = Boolean(process.env.STRIPE_WEBHOOK_SECRET);
  const stripeCommerceWebhookConfigured = Boolean(
    process.env.STRIPE_COMMERCE_WEBHOOK_SECRET,
  );
  const mobilityBookingReady =
    firebaseAdminConfigured && stripeConfigured && stripeWebhookConfigured;
  const commerceBookingReady =
    firebaseAdminConfigured &&
    stripeConfigured &&
    stripeCommerceWebhookConfigured;
  const notificationReady = notificationConfigurationStatus({
    firebaseAdminConfigured,
    resendApiKey: process.env.RESEND_API_KEY,
    emailFrom: process.env.VI_GUIDE_EMAIL_FROM,
    operationsEmails: process.env.VI_GUIDE_OPERATIONS_EMAILS,
    cronSecret: process.env.CRON_SECRET,
    appUrl: process.env.VI_GUIDE_APP_URL,
  }).ready;

  return NextResponse.json(
    {
      ok: true,
      service: "vi-guide",
      release: {
        // Preserve the original public contract for mobility booking readiness.
        bookingReady: mobilityBookingReady,
        mobilityBookingReady,
        commerceBookingReady,
        notificationReady,
        commerceOperationsReady: commerceBookingReady && notificationReady,
        firebaseAdminConfigured,
        stripeConfigured,
        stripeWebhookConfigured,
        stripeCommerceWebhookConfigured,
      },
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
