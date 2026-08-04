import { createHash } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_DEPOSIT_CENTS = 10_000_000;

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
  const email = clean(body?.email, 220).toLowerCase();

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
  if (normalizeEmail(booking.email) !== email) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const amountCents = Number(booking.depositAmountCents ?? 0);
  if (
    String(booking.status ?? "") !== "payment_required" ||
    !Number.isSafeInteger(amountCents) ||
    amountCents <= 0 ||
    amountCents > MAX_DEPOSIT_CENTS
  ) {
    return NextResponse.json(
      { error: "This booking is not currently awaiting a valid payment." },
      { status: 409 },
    );
  }

  const bookingReference = String(booking.reference ?? bookingId);
  const requestVersion = clean(
    booking.merchantRespondedAt ?? booking.updatedAt,
    120,
  );
  const idempotencyKey = createHash("sha256")
    .update(
      [
        "vi-guide-commerce-checkout",
        bookingId,
        String(amountCents),
        requestVersion,
      ].join("|"),
    )
    .digest("hex");

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
              name: `${String(booking.listingName ?? "VI Guide booking")} deposit`,
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

      if (
        !currentSnapshot.exists ||
        normalizeEmail(current.email) !== email ||
        String(current.status ?? "") !== "payment_required" ||
        currentAmount !== amountCents
      ) {
        throw new CheckoutStateChangedError();
      }

      transaction.update(bookingRef, {
        checkoutSessionId: session.id,
        paymentHref: session.url,
        paymentStatus: "pending",
        checkoutCreatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
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

class CheckoutStateChangedError extends Error {}

async function expireCheckoutSession(stripe: Stripe, sessionId: string) {
  try {
    await stripe.checkout.sessions.expire(sessionId);
  } catch (error) {
    console.error("unable to expire stale commerce checkout session", error);
  }
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
