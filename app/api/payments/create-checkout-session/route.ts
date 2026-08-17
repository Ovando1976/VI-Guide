import type { DocumentData, Firestore, Transaction } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { cruiseReturnBufferEvidence } from "@/lib/analytics/cruise-return-buffer";
import { recordServerJourneyEvent } from "@/lib/analytics/server-journey-event";
import type { VIIsland } from "@/lib/analytics/vi-event";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import {
  buildCommerceCheckoutIdempotencyKey,
  isValidCommerceDeposit,
  normalizeCommerceEmail,
} from "@/lib/payments/commerce-checkout-integrity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "Stripe checkout is not configured on the server." },
      { status: 503 },
    );
  }
  if (!hasFirebaseAdminConfiguration()) {
    return NextResponse.json(
      { error: "Booking payments are not configured on the server." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { bookingId?: unknown; email?: unknown }
    | null;
  const bookingId = clean(body?.bookingId, 160);
  const email = normalizeCommerceEmail(clean(body?.email, 220));

  if (!bookingId || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json(
      { error: "A booking and matching email are required." },
      { status: 400 },
    );
  }

  const db = getAdminDb();
  const bookingRef = db.collection("commerceBookings").doc(bookingId);
  const snapshot = await bookingRef.get();
  if (!snapshot.exists) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const booking = snapshot.data() ?? {};
  if (normalizeCommerceEmail(booking.email) !== email) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const amountCents = Number(booking.depositAmountCents ?? 0);
  if (
    String(booking.status ?? "") !== "payment_required" ||
    !isValidCommerceDeposit(amountCents)
  ) {
    return NextResponse.json(
      { error: "This booking is not currently awaiting a valid payment." },
      { status: 409 },
    );
  }

  const initialCruiseBuffer = cruiseReturnBufferEvidence(booking);
  if (initialCruiseBuffer && !initialCruiseBuffer.returnBufferMet) {
    return NextResponse.json(
      {
        error:
          "Cruise-day checkout is blocked until the verified return-to-ship buffer is restored.",
      },
      { status: 409 },
    );
  }

  const bookingReference = String(booking.reference ?? bookingId);
  const requestVersion = clean(
    booking.merchantRespondedAt ?? booking.updatedAt,
    120,
  );
  const idempotencyKey = buildCommerceCheckoutIdempotencyKey({
    bookingId,
    amountCents,
    requestVersion,
  });

  const origin = request.nextUrl.origin;
  const stripe = new Stripe(secretKey);
  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      client_reference_id: bookingId,
      customer_email: email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: {
              name: `${String(booking.listingName ?? "USVI Explorer booking")} deposit`,
              description: `Booking ${bookingReference}`,
            },
          },
        },
      ],
      metadata: {
        bookingId,
        bookingReference,
      },
      payment_intent_data: {
        metadata: {
          bookingId,
          bookingReference,
        },
      },
      success_url: `${origin}/bookings?payment=success&reference=${encodeURIComponent(
        bookingReference,
      )}`,
      cancel_url: `${origin}/bookings?payment=cancelled&reference=${encodeURIComponent(
        bookingReference,
      )}`,
    },
    { idempotencyKey },
  );

  if (!session.url) {
    await expireCheckoutSession(stripe, session.id);
    return NextResponse.json(
      { error: "Stripe did not return a checkout destination." },
      { status: 502 },
    );
  }

  try {
    await db.runTransaction(async (transaction) => {
      const currentSnapshot = await transaction.get(bookingRef);
      const current = currentSnapshot.data() ?? {};
      const currentAmount = Number(current.depositAmountCents ?? 0);
      const currentCruiseBuffer = cruiseReturnBufferEvidence(current);

      if (
        !currentSnapshot.exists ||
        normalizeCommerceEmail(current.email) !== email ||
        String(current.status ?? "") !== "payment_required" ||
        currentAmount !== amountCents ||
        Boolean(currentCruiseBuffer) !== Boolean(initialCruiseBuffer) ||
        (currentCruiseBuffer && !currentCruiseBuffer.returnBufferMet)
      ) {
        throw new CheckoutStateChangedError();
      }

      const updatedAt = new Date().toISOString();
      transaction.update(bookingRef, {
        checkoutSessionId: session.id,
        paymentHref: session.url,
        paymentStatus: "pending",
        checkoutCreatedAt: updatedAt,
        updatedAt,
      });

      if (currentCruiseBuffer) {
        recordCruiseCheckoutEvidence(transaction, db, {
          bookingId,
          checkoutSessionId: session.id,
          occurredAt: updatedAt,
          booking: current,
          buffer: currentCruiseBuffer,
        });
      }
    });
  } catch (error) {
    if (error instanceof CheckoutStateChangedError) {
      await expireCheckoutSession(stripe, session.id);
      return NextResponse.json(
        { error: "The booking changed before checkout was created. Refresh and try again." },
        { status: 409 },
      );
    }
    throw error;
  }

  return NextResponse.json({
    checkoutUrl: session.url,
    checkoutSessionId: session.id,
  });
}

function recordCruiseCheckoutEvidence(
  transaction: Transaction,
  db: Firestore,
  input: {
    bookingId: string;
    checkoutSessionId: string;
    occurredAt: string;
    booking: DocumentData;
    buffer: NonNullable<ReturnType<typeof cruiseReturnBufferEvidence>>;
  },
) {
  const listingId = clean(input.booking.listingId, 180);
  const itineraryId = `cruise-booking:${input.bookingId}`;
  const sessionId = `checkout_${input.checkoutSessionId}`;
  const island = analyticsIsland(input.booking.island);
  const commonPayload = {
    return_buffer_met: input.buffer.returnBufferMet,
    returnBufferMinutes: input.buffer.verifiedReturnBufferMinutes,
    requiredReturnBufferMinutes: input.buffer.requiredReturnBufferMinutes,
    allAboardTime: input.buffer.allAboardTime,
    safeReturnDeadline: input.buffer.safeReturnDeadline,
    timingStatus: "buffer_verified",
  };

  recordServerJourneyEvent(transaction, db, {
    eventName: "plan_created",
    eventKey: `${input.bookingId}:cruise-plan`,
    occurredAt: input.occurredAt,
    sessionId,
    travelerType: "cruise",
    island,
    source: "commerce_checkout",
    itineraryId,
    listingId,
    bookingId: input.bookingId,
    payload: {
      ...commonPayload,
      shipName: input.buffer.shipName,
      portId: input.buffer.portId,
    },
  });
  recordServerJourneyEvent(transaction, db, {
    eventName: "plan_item_added",
    eventKey: `${input.bookingId}:shore-excursion`,
    occurredAt: input.occurredAt,
    sessionId,
    travelerType: "cruise",
    island,
    source: "commerce_checkout",
    itineraryId,
    listingId,
    bookingId: input.bookingId,
    payload: {
      ...commonPayload,
      activity: "shore_excursion",
      offerId: clean(input.booking.offerId, 180),
    },
  });
  recordServerJourneyEvent(transaction, db, {
    eventName: "checkout_started",
    eventKey: input.checkoutSessionId,
    occurredAt: input.occurredAt,
    sessionId,
    travelerType: "cruise",
    island,
    source: "commerce_checkout",
    itineraryId,
    listingId,
    bookingId: input.bookingId,
    payload: {
      ...commonPayload,
      checkoutSessionId: input.checkoutSessionId,
      amountCents: Number(input.booking.depositAmountCents ?? 0),
    },
  });
}

function analyticsIsland(value: unknown): VIIsland | undefined {
  switch (String(value ?? "").trim()) {
    case "stt":
      return "st_thomas";
    case "stj":
      return "st_john";
    case "stx":
      return "st_croix";
    default:
      return undefined;
  }
}

class CheckoutStateChangedError extends Error {}

async function expireCheckoutSession(stripe: Stripe, sessionId: string) {
  try {
    await stripe.checkout.sessions.expire(sessionId);
  } catch (error) {
    console.error("unable to expire stale commerce checkout session", error);
  }
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
