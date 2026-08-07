import { NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TRAVELER_PLUS_PRICE_ID =
  process.env.STRIPE_TRAVELER_PLUS_ANNUAL_PRICE_ID?.trim() ||
  "price_1U1t8mD9Qpu2bgHTkuO1ip28";
const TRAVELER_PLUS_PLAN = "traveler-plus-annual";

export async function GET() {
  try {
    const session = await requireSession();
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Traveler Plus is not configured on the server." },
        { status: 503 },
      );
    }

    const membershipRef = getAdminDb()
      .collection("travelerMemberships")
      .doc(session.uid);
    const snapshot = await membershipRef.get();
    const membership = snapshot.data() ?? {};
    const customerId = clean(membership.stripeCustomerId, 220);

    if (!customerId) {
      return NextResponse.json({
        membership: {
          plan: TRAVELER_PLUS_PLAN,
          active: false,
          status: "none",
          cancelAtPeriodEnd: false,
        },
      });
    }

    const subscriptions = await getStripe().subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 20,
    });
    const matching = subscriptions.data
      .filter((subscription) =>
        subscription.items.data.some(
          (item) => item.price.id === TRAVELER_PLUS_PRICE_ID,
        ),
      )
      .sort((left, right) => right.created - left.created)[0];

    if (!matching) {
      return NextResponse.json({
        membership: {
          plan: TRAVELER_PLUS_PLAN,
          active: false,
          status: "none",
          cancelAtPeriodEnd: false,
        },
      });
    }

    const active = matching.status === "active" || matching.status === "trialing";
    const now = new Date().toISOString();
    await membershipRef.set(
      {
        stripeCustomerId: customerId,
        stripeSubscriptionId: matching.id,
        plan: TRAVELER_PLUS_PLAN,
        status: matching.status,
        active,
        cancelAtPeriodEnd: matching.cancel_at_period_end,
        updatedAt: now,
      },
      { merge: true },
    );

    return NextResponse.json({
      membership: {
        plan: TRAVELER_PLUS_PLAN,
        active,
        status: matching.status,
        cancelAtPeriodEnd: matching.cancel_at_period_end,
      },
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("traveler plus status error", error);
    return NextResponse.json(
      { error: "Unable to load Traveler Plus status." },
      { status: 500 },
    );
  }
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
