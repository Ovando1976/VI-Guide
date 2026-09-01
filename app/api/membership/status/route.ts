import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { VI_EVENT_SCHEMA_VERSION } from "@/lib/analytics/vi-event";
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

    const db = getAdminDb();
    const membershipRef = db.collection("travelerMemberships").doc(session.uid);
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

    const stripe = getStripe();
    const subscriptions = await stripe.subscriptions.list({
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

    if (matching.status === "active") {
      await recordLatestVerifiedPayment({
        stripe,
        db,
        userId: session.uid,
        subscription: matching,
      });
    }

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

async function recordLatestVerifiedPayment({
  stripe,
  db,
  userId,
  subscription,
}: {
  stripe: Stripe;
  db: ReturnType<typeof getAdminDb>;
  userId: string;
  subscription: Stripe.Subscription;
}) {
  const invoiceId = expandableId(subscription.latest_invoice);
  if (!invoiceId) return;

  try {
    const invoice = await stripe.invoices.retrieve(invoiceId);
    if (invoice.status !== "paid" || invoice.amount_paid <= 0) return;

    const eventId = `membership_payment_completed_${invoice.id}`;
    const occurredAt = new Date((invoice.status_transitions.paid_at ?? invoice.created) * 1000).toISOString();
    await db.collection("viEvents").doc(eventId).set(
      {
        eventId,
        eventName: "payment_completed",
        schemaVersion: VI_EVENT_SCHEMA_VERSION,
        origin: "server",
        occurredAt,
        receivedAt: new Date().toISOString(),
        sessionId: `membership_${userId}`,
        userId,
        island: null,
        travelerType: null,
        source: "stripe_subscription_verification",
        itineraryId: null,
        listingId: "traveler-plus",
        providerId: "usvi-explorer",
        bookingId: `membership:${userId}`,
        stripeEventId: null,
        idempotencyKey: invoice.id,
        payload: {
          offer_id: TRAVELER_PLUS_PLAN,
          offer_type: "subscription",
          amount_cents: invoice.amount_paid,
          currency: invoice.currency,
          stripe_invoice_id: invoice.id,
          stripe_subscription_id: subscription.id,
        },
      },
      { merge: false },
    );
  } catch (error) {
    console.error("traveler plus payment analytics error", error);
  }
}

function expandableId(value: string | { id: string } | null | undefined) {
  if (typeof value === "string") return value.trim();
  return value?.id?.trim() ?? "";
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
