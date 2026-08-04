import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";

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
  if (String(booking.email ?? "").trim().toLowerCase() !== email) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const amountCents = Number(booking.depositAmountCents ?? 0);
  if (String(booking.status ?? "") !== "payment_required" || amountCents <= 0) {
    return NextResponse.json(
      { error: "This booking is not currently awaiting payment." },
      { status: 409 },
    );
  }

  const origin = request.nextUrl.origin;
  const stripe = new Stripe(secretKey);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(amountCents),
          product_data: {
            name: `${String(booking.listingName ?? "VI Guide booking")} deposit`,
            description: `Booking ${String(booking.reference ?? bookingId)}`,
          },
        },
      },
    ],
    metadata: {
      bookingId,
      bookingReference: String(booking.reference ?? bookingId),
    },
    payment_intent_data: {
      metadata: {
        bookingId,
        bookingReference: String(booking.reference ?? bookingId),
      },
    },
    success_url: `${origin}/bookings?payment=success&reference=${encodeURIComponent(
      String(booking.reference ?? bookingId),
    )}`,
    cancel_url: `${origin}/bookings?payment=cancelled&reference=${encodeURIComponent(
      String(booking.reference ?? bookingId),
    )}`,
  });

  await bookingRef.update({
    checkoutSessionId: session.id,
    paymentHref: session.url ?? null,
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({
    checkoutUrl: session.url,
    checkoutSessionId: session.id,
  });
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
