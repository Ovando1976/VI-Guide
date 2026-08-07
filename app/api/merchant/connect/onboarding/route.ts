import { NextRequest, NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import {
  createMarketplaceOnboardingLink,
  createMarketplaceRecipientAccount,
  marketplaceTransferCapabilityStatus,
  retrieveMarketplaceRecipientAccount,
  StripeMarketplaceConnectError,
} from "@/lib/payments/stripe-connect-marketplace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(["merchant"]);
    if (!hasFirebaseAdminConfiguration() || !process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Merchant payouts are not configured on the server." },
        { status: 503 },
      );
    }
    if (!session.email) {
      return NextResponse.json(
        { error: "Your merchant account needs an email address before payout setup." },
        { status: 400 },
      );
    }
    if (!session.listingIds?.length) {
      return NextResponse.json(
        { error: "A VI Guide listing must be assigned before payout setup." },
        { status: 409 },
      );
    }

    const db = getAdminDb();
    const profileRef = db.collection("merchantPaymentProfiles").doc(session.uid);
    const snapshot = await profileRef.get();
    const profile = snapshot.data() ?? {};
    let accountId = clean(profile.stripeAccountId, 220);
    let account;

    if (accountId) {
      account = await retrieveMarketplaceRecipientAccount(accountId);
    } else {
      account = await createMarketplaceRecipientAccount({
        merchantUid: session.uid,
        email: session.email,
        displayName: session.name || session.email,
      });
      accountId = account.id;
    }

    const transferStatus = marketplaceTransferCapabilityStatus(account);
    const now = new Date().toISOString();
    await profileRef.set(
      {
        merchantUid: session.uid,
        email: session.email,
        displayName: session.name ?? null,
        listingIds: session.listingIds,
        stripeAccountId: accountId,
        stripeDashboard: account.dashboard ?? "express",
        stripeLivemode: account.livemode ?? null,
        transferStatus,
        payoutState: transferStatus === "active" ? "ready" : "onboarding",
        createdAt: profile.createdAt ?? now,
        lastStripeSyncAt: now,
        updatedAt: now,
      },
      { merge: true },
    );

    if (transferStatus === "active") {
      return NextResponse.json({
        ready: true,
        transferStatus,
        redirectUrl: `${request.nextUrl.origin}/merchant/payouts?connect=ready`,
      });
    }

    const onboarding = await createMarketplaceOnboardingLink({
      accountId,
      origin: request.nextUrl.origin,
    });

    return NextResponse.json({
      ready: false,
      transferStatus,
      onboardingUrl: onboarding.url,
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
    console.error("merchant connect onboarding error", error);
    return NextResponse.json(
      { error: "Unable to start Stripe payout setup." },
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
