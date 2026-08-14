import { NextRequest, NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PORTAL_CONFIG_NAME = "USVI Explorer Traveler Plus";
const PORTAL_CONFIG_METADATA_KEY = "viGuidePortal";
const PORTAL_CONFIG_METADATA_VALUE = "traveler-plus-v1";

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Traveler Plus is not configured on the server." },
        { status: 503 },
      );
    }

    const snapshot = await getAdminDb()
      .collection("travelerMemberships")
      .doc(session.uid)
      .get();
    const customerId = clean(snapshot.data()?.stripeCustomerId, 220);
    if (!customerId) {
      return NextResponse.json(
        { error: "No Traveler Plus billing profile is attached to this account." },
        { status: 409 },
      );
    }

    const stripe = getStripe();
    const configurationId = await ensureTravelerPlusPortalConfiguration(stripe);
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      configuration: configurationId,
      return_url: `${request.nextUrl.origin}/plus`,
    });

    return NextResponse.json({ portalUrl: portal.url });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("traveler plus portal error", error);
    return NextResponse.json(
      { error: "Unable to open Traveler Plus billing management." },
      { status: 500 },
    );
  }
}

async function ensureTravelerPlusPortalConfiguration(
  stripe: ReturnType<typeof getStripe>,
) {
  const configurations = await stripe.billingPortal.configurations.list({
    active: true,
    limit: 20,
  });
  const existing = configurations.data.find(
    (configuration) =>
      configuration.metadata?.[PORTAL_CONFIG_METADATA_KEY] ===
      PORTAL_CONFIG_METADATA_VALUE,
  );
  if (existing) return existing.id;

  const configuration = await stripe.billingPortal.configurations.create(
    {
      name: PORTAL_CONFIG_NAME,
      business_profile: {
        headline: "Manage your USVI Explorer Traveler Plus membership",
      },
      features: {
        customer_update: {
          enabled: true,
          allowed_updates: ["email", "name", "phone"],
        },
        invoice_history: { enabled: true },
        payment_method_update: { enabled: true },
        subscription_cancel: {
          enabled: true,
          mode: "at_period_end",
          cancellation_reason: {
            enabled: true,
            options: [
              "too_expensive",
              "missing_features",
              "switched_service",
              "unused",
              "other",
            ],
          },
        },
      },
      metadata: {
        [PORTAL_CONFIG_METADATA_KEY]: PORTAL_CONFIG_METADATA_VALUE,
      },
    },
    { idempotencyKey: "vi-guide-traveler-plus-portal-v1" },
  );

  return configuration.id;
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
