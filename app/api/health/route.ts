import { NextResponse } from "next/server";
import { hasFirebaseAdminConfiguration } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const firebaseAdminConfigured = hasFirebaseAdminConfiguration();
  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
  const stripeWebhookConfigured = Boolean(process.env.STRIPE_WEBHOOK_SECRET);
  const bookingReady =
    firebaseAdminConfigured && stripeConfigured && stripeWebhookConfigured;

  return NextResponse.json(
    {
      ok: true,
      service: "vi-guide",
      release: {
        bookingReady,
        firebaseAdminConfigured,
        stripeConfigured,
        stripeWebhookConfigured,
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
