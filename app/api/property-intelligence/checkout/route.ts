import { NextRequest, NextResponse } from "next/server";

import { VI_EVENT_SCHEMA_VERSION } from "@/lib/analytics/vi-event";
import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { getAdminDb, hasFirebaseAdminConfiguration } from "@/lib/firebase-admin";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OFFER_ID = "property-intelligence-export-pack";
const PRICE_ID = process.env.STRIPE_PROPERTY_INTELLIGENCE_PRICE_ID?.trim() ?? "";

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.email) {
      return NextResponse.json(
        { error: "Your account needs an email address before checkout." },
        { status: 400 },
      );
    }
    if (!PRICE_ID || !hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Property Intelligence checkout is not configured yet." },
        { status: 503 },
      );
    }

    const stripe = getStripe();
    const db = getAdminDb();
    const entitlementRef = db.collection("propertyIntelligenceEntitlements").doc(session.uid);
    const snapshot = await entitlementRef.get();
    const entitlement = snapshot.data() ?? {};

    if (entitlement.active === true) {
      return NextResponse.json({ code: "ALREADY_ENTITLED", active: true }, { status: 409 });
    }

    const pendingSessionId = clean(entitlement.latestCheckoutSessionId, 220);
    if (pendingSessionId) {
      try {
        const pending = await stripe.checkout.sessions.retrieve(pendingSessionId);
        if (pending.status === "open" && pending.url) {
          return NextResponse.json({ checkoutUrl: pending.url, reused: true });
        }
      } catch {
        // Ignore stale/invalid pending sessions and create a fresh one below.
      }
    }

    const origin = request.nextUrl.origin;
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: session.email,
      client_reference_id: session.uid,
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      allow_promotion_codes: true,
      metadata: {
        viGuideUid: session.uid,
        offerId: OFFER_ID,
        fulfillment: "property_intelligence_export",
      },
      payment_intent_data: {
        metadata: {
          viGuideUid: session.uid,
          offerId: OFFER_ID,
          fulfillment: "property_intelligence_export",
        },
      },
      success_url: `${origin}/property-intelligence?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/property-intelligence?checkout=cancelled`,
    });

    if (!checkout.url) {
      return NextResponse.json({ error: "Stripe did not return a checkout destination." }, { status: 502 });
    }

    const now = new Date().toISOString();
    await entitlementRef.set(
      {
        offerId: OFFER_ID,
        active: false,
        status: "pending",
        email: session.email,
        latestCheckoutSessionId: checkout.id,
        updatedAt: now,
        createdAt: entitlement.createdAt ?? now,
      },
      { merge: true },
    );

    try {
      const eventId = `property_checkout_started_${checkout.id}`;
      await db.collection("viEvents").doc(eventId).set({
        eventId,
        eventName: "checkout_started",
        schemaVersion: VI_EVENT_SCHEMA_VERSION,
        origin: "server",
        occurredAt: now,
        receivedAt: now,
        sessionId: `property_${session.uid}`,
        userId: session.uid,
        island: null,
        travelerType: null,
        source: "property_intelligence_checkout",
        itineraryId: null,
        listingId: "property-intelligence",
        providerId: "usvi-explorer",
        bookingId: null,
        payload: {
          offer_id: OFFER_ID,
          offer_type: "digital_product",
          price_id: PRICE_ID,
          checkout_session_id: checkout.id,
        },
      });
    } catch (error) {
      console.error("property checkout analytics error", error);
    }

    return NextResponse.json({ checkoutUrl: checkout.url });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("property intelligence checkout error", error);
    return NextResponse.json({ error: "Unable to start Property Intelligence checkout." }, { status: 500 });
  }
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}
