import { NextRequest, NextResponse } from "next/server";

import { VI_EVENT_SCHEMA_VERSION } from "@/lib/analytics/vi-event";
import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { getAdminDb, hasFirebaseAdminConfiguration } from "@/lib/firebase-admin";
import { evaluatePropertyCheckout } from "@/lib/property-intelligence-entitlement";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OFFER_ID = "property-intelligence-export-pack";
const PRICE_ID = process.env.STRIPE_PROPERTY_INTELLIGENCE_PRICE_ID?.trim() ?? "";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json({ error: "Property Intelligence is not configured." }, { status: 503 });
    }

    const db = getAdminDb();
    const entitlementRef = db.collection("propertyIntelligenceEntitlements").doc(session.uid);
    const snapshot = await entitlementRef.get();
    const entitlement = snapshot.data() ?? {};

    if (entitlement.active === true) {
      return NextResponse.json({ entitlement: publicEntitlement(entitlement, true) });
    }

    const requestedSessionId = request.nextUrl.searchParams.get("session_id")?.trim() ?? "";
    const sessionId = requestedSessionId || clean(entitlement.latestCheckoutSessionId, 220);
    if (!sessionId || !PRICE_ID) {
      return NextResponse.json({ entitlement: publicEntitlement(entitlement, false) });
    }

    const stripe = getStripe();
    const checkout = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items.data.price"],
    });

    const uidMatches =
      checkout.client_reference_id === session.uid && checkout.metadata?.viGuideUid === session.uid;
    const offerMatches = checkout.metadata?.offerId === OFFER_ID;
    const purchasedPriceIds = checkout.line_items?.data
      .map((item) => (typeof item.price === "string" ? item.price : item.price?.id ?? ""))
      .filter(Boolean) ?? [];
    const priceMatches = purchasedPriceIds.includes(PRICE_ID);

    if (!uidMatches || !offerMatches || !priceMatches) {
      return NextResponse.json({ entitlement: publicEntitlement(entitlement, false) });
    }

    const checkoutDecision = evaluatePropertyCheckout({
      status: checkout.status,
      paymentStatus: checkout.payment_status,
      amountSubtotal: checkout.amount_subtotal,
      amountTotal: checkout.amount_total,
      amountDiscount: checkout.total_details?.amount_discount ?? 0,
    });
    if (!checkoutDecision.entitled) {
      return NextResponse.json({ entitlement: publicEntitlement(entitlement, false) });
    }
    const amountTotal = checkoutDecision.amountPaidCents;

    const now = new Date().toISOString();
    const nextEntitlement = {
      offerId: OFFER_ID,
      active: true,
      status: "paid",
      email: session.email ?? entitlement.email ?? null,
      latestCheckoutSessionId: checkout.id,
      stripePaymentIntentId: expandableId(checkout.payment_intent) || null,
      amountPaidCents: amountTotal,
      accessReason: checkoutDecision.complimentary ? "fully_discounted_checkout" : "paid_checkout",
      currency: checkout.currency ?? "usd",
      purchasedAt: new Date(checkout.created * 1000).toISOString(),
      updatedAt: now,
      createdAt: entitlement.createdAt ?? now,
    };

    await entitlementRef.set(nextEntitlement, { merge: true });

    if (!checkoutDecision.complimentary) {
      try {
        const eventId = `property_payment_completed_${checkout.id}`;
        await db.collection("viEvents").doc(eventId).set(
          {
            eventId,
            eventName: "payment_completed",
            schemaVersion: VI_EVENT_SCHEMA_VERSION,
            origin: "server",
            occurredAt: new Date(checkout.created * 1000).toISOString(),
            receivedAt: now,
            sessionId: `property_${session.uid}`,
            userId: session.uid,
            island: null,
            travelerType: null,
            source: "stripe_checkout_verification",
            itineraryId: null,
            listingId: "property-intelligence",
            providerId: "usvi-explorer",
            bookingId: `property:${session.uid}`,
            stripeEventId: null,
            idempotencyKey: checkout.id,
            payload: {
              offer_id: OFFER_ID,
              offer_type: "digital_product",
              amount_cents: amountTotal,
              currency: checkout.currency ?? "usd",
              stripe_checkout_session_id: checkout.id,
              stripe_payment_intent_id: expandableId(checkout.payment_intent) || null,
            },
          },
          { merge: false },
        );
      } catch (error) {
        console.error("property payment analytics error", error);
      }
    }

    return NextResponse.json({ entitlement: publicEntitlement(nextEntitlement, true) });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("property entitlement verification error", error);
    return NextResponse.json({ error: "Unable to verify Property Intelligence access." }, { status: 500 });
  }
}

function publicEntitlement(record: Record<string, unknown>, active: boolean) {
  return {
    offerId: OFFER_ID,
    active,
    status: active ? "paid" : clean(record.status, 40) || "none",
    purchasedAt: clean(record.purchasedAt, 80) || null,
  };
}

function expandableId(value: string | { id: string } | null | undefined) {
  if (typeof value === "string") return value.trim();
  return value?.id?.trim() ?? "";
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}
