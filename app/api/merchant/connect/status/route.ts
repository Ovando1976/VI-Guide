import { NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import {
  marketplaceTransferCapabilityStatus,
  retrieveMarketplaceRecipientAccount,
  StripeMarketplaceConnectError,
} from "@/lib/payments/stripe-connect-marketplace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireSession(["merchant"]);
    if (!hasFirebaseAdminConfiguration() || !process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Merchant payouts are not configured on the server." },
        { status: 503 },
      );
    }

    const profileRef = getAdminDb()
      .collection("merchantPaymentProfiles")
      .doc(session.uid);
    const snapshot = await profileRef.get();
    const profile = snapshot.data() ?? {};
    const accountId = clean(profile.stripeAccountId, 220);

    if (!accountId) {
      return NextResponse.json({
        payout: {
          state: "not_started",
          transferStatus: "unknown",
          accountId: null,
          dashboard: null,
          listingIds: session.listingIds ?? [],
        },
      });
    }

    const account = await retrieveMarketplaceRecipientAccount(accountId);
    const transferStatus = marketplaceTransferCapabilityStatus(account);
    const state = transferStatus === "active" ? "ready" : "onboarding";
    const now = new Date().toISOString();

    await profileRef.set(
      {
        merchantUid: session.uid,
        email: session.email ?? null,
        listingIds: session.listingIds ?? [],
        stripeAccountId: account.id,
        transferStatus,
        payoutState: state,
        stripeDashboard: account.dashboard ?? null,
        stripeLivemode: account.livemode ?? null,
        lastStripeSyncAt: now,
        updatedAt: now,
      },
      { merge: true },
    );

    return NextResponse.json({
      payout: {
        state,
        transferStatus,
        accountId: account.id,
        dashboard: account.dashboard ?? null,
        livemode: account.livemode ?? null,
        listingIds: session.listingIds ?? [],
      },
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    if (error instanceof StripeMarketplaceConnectError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: normalizeStatus(error.statusCode) },
      );
    }
    console.error("merchant connect status error", error);
    return NextResponse.json(
      { error: "Unable to load merchant payout status." },
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
