import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

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
const CHECKOUT_INTEGRATION_IDENTIFIER = "vi-guide-traveler-plus-qmzktwra";

const NON_TERMINAL_SUBSCRIPTION_STATUSES = new Set<Stripe.Subscription.Status>([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "incomplete",
  "paused",
]);

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.email) {
      return NextResponse.json(
        { error: "Your account needs an email address before subscribing." },
        { status: 400 },
      );
    }
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Traveler Plus is not configured on the server." },
        { status: 503 },
      );
    }

    const stripe = getStripe();
    const db = getAdminDb();
    const membershipRef = db.collection("travelerMemberships").doc(session.uid);
    const membershipSnapshot = await membershipRef.get();
    const membership = membershipSnapshot.data() ?? {};

    let customerId = clean(membership.stripeCustomerId, 220);
    if (!customerId) {
      const customer = await stripe.customers.create(
        {
          email: session.email,
          name: session.name,
          metadata: {
            viGuideUid: session.uid,
            source: "vi-guide-traveler-plus",
          },
        },
        { idempotencyKey: `vi-guide-customer-${session.uid}` },
      );
      customerId = customer.id;
      const now = new Date().toISOString();
      await membershipRef.set(
        {
          stripeCustomerId: customerId,
          plan: TRAVELER_PLUS_PLAN,
          email: session.email,
          createdAt: membership.createdAt ?? now,
          updatedAt: now,
        },
        { merge: true },
      );
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 20,
    });
    const existing = subscriptions.data.find(
      (subscription) =>
        NON_TERMINAL_SUBSCRIPTION_STATUSES.has(subscription.status) &&
        subscription.items.data.some(
          (item) => item.price.id === TRAVELER_PLUS_PRICE_ID,
        ),
    );

    if (existing) {
      return NextResponse.json(
        {
          error: "Traveler Plus is already attached to this account.",
          code: "ALREADY_SUBSCRIBED",
          subscriptionStatus: existing.status,
        },
        { status: 409 },
      );
    }

    const origin = request.nextUrl.origin;
    const checkoutParams: Stripe.Checkout.SessionCreateParams & {
      integration_identifier: string;
    } = {
      mode: "subscription",
      customer: customerId,
      client_reference_id: session.uid,
      line_items: [{ price: TRAVELER_PLUS_PRICE_ID, quantity: 1 }],
      allow_promotion_codes: true,
      metadata: {
        viGuideUid: session.uid,
        plan: TRAVELER_PLUS_PLAN,
      },
      subscription_data: {
        metadata: {
          viGuideUid: session.uid,
          plan: TRAVELER_PLUS_PLAN,
        },
      },
      success_url: `${origin}/plus?checkout=success`,
      cancel_url: `${origin}/plus?checkout=cancelled`,
      integration_identifier: CHECKOUT_INTEGRATION_IDENTIFIER,
    };

    const checkout = await stripe.checkout.sessions.create(
      checkoutParams,
      { idempotencyKey: `vi-guide-traveler-plus-${session.uid}` },
    );

    if (!checkout.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout destination." },
        { status: 502 },
      );
    }

    await membershipRef.set(
      {
        stripeCustomerId: customerId,
        latestCheckoutSessionId: checkout.id,
        plan: TRAVELER_PLUS_PLAN,
        email: session.email,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    return NextResponse.json({ checkoutUrl: checkout.url });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("traveler plus checkout error", error);
    return NextResponse.json(
      { error: "Unable to start Traveler Plus checkout." },
      { status: 500 },
    );
  }
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
