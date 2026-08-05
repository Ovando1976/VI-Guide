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
  const notification = notificationConfigurationStatus({
    firebaseAdminConfigured,
    resendApiKey: process.env.RESEND_API_KEY,
    emailFrom: process.env.VI_GUIDE_EMAIL_FROM,
    operationsEmails: process.env.VI_GUIDE_OPERATIONS_EMAILS,
    cronSecret: process.env.CRON_SECRET,
    appUrl: process.env.VI_GUIDE_APP_URL,
  });

  return NextResponse.json(
    {
      ok: true,
      service: "vi-guide",
      release: {
        bookingReady: mobilityBookingReady && commerceBookingReady,
        mobilityBookingReady,
        commerceBookingReady,
        notificationReady: notification.ready,
        firebaseAdminConfigured,
        stripeConfigured,
        stripeWebhookConfigured,
        stripeCommerceWebhookConfigured,
        notification: {
          emailProviderConfigured: notification.emailProviderConfigured,
          senderConfigured: notification.senderConfigured,
          operationsRecipientsConfigured:
            notification.operationsRecipientsConfigured,
          operationsRecipientCount: notification.operationsRecipientCount,
          cronSecretConfigured: notification.cronSecretConfigured,
          appUrlConfigured: notification.appUrlConfigured,
          missing: notification.missing,
        },
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
