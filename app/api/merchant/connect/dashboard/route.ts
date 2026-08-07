import { NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import {
  createMarketplaceExpressDashboardLink,
  StripeMarketplaceConnectError,
} from "@/lib/payments/stripe-connect-marketplace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await requireSession(["merchant"]);
    if (!hasFirebaseAdminConfiguration() || !process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Merchant payouts are not configured on the server." },
        { status: 503 },
      );
    }

    const snapshot = await getAdminDb()
      .collection("merchantPaymentProfiles")
      .doc(session.uid)
      .get();
    const accountId = clean(snapshot.data()?.stripeAccountId, 220);
    if (!accountId) {
      return NextResponse.json(
        { error: "Complete Stripe payout setup before opening the payout dashboard." },
        { status: 409 },
      );
    }

    const login = await createMarketplaceExpressDashboardLink(accountId);
    return NextResponse.json({ dashboardUrl: login.url });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    if (error instanceof StripeMarketplaceConnectError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: normalizeStatus(error.statusCode) },
      );
    }
    console.error("merchant connect dashboard error", error);
    return NextResponse.json(
      { error: "Unable to open the Stripe payout dashboard." },
      { status: 500 },
    );
  }
}

function normalizeStatus(value: number) {
  return Number.isInteger(value) && value >= 400 && value <= 599 ? value : 502;
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
