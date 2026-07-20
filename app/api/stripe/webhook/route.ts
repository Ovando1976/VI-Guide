import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getAdminDb } from "@/lib/firebase-admin";
import { getStripe } from "@/lib/stripe";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeWebhookSecret) {
    return new NextResponse("Stripe webhook is not configured.", {
      status: 503,
    });
  }

  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return new NextResponse("Missing stripe-signature header.", {
      status: 400,
    });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      stripeWebhookSecret
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Invalid Stripe webhook signature.";
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  try {
    const adminDb = getAdminDb();
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata.bookingId;
        if (!bookingId) throw new Error("Successful payment intent is missing bookingId metadata.");
        const bookingRef = adminDb.collection("bookings").doc(bookingId);
        const eventRef = adminDb.collection("stripe_webhook_events").doc(event.id);
        await adminDb.runTransaction(async (transaction) => {
          const [bookingSnapshot, eventSnapshot] = await Promise.all([
            transaction.get(bookingRef),
            transaction.get(eventRef),
          ]);
          if (eventSnapshot.exists) return;
          if (!bookingSnapshot.exists) throw new Error("Paid booking does not exist.");
          const booking = bookingSnapshot.data();
          const expectedAmount = Math.round(Number(booking?.quotedFare?.total ?? 0) * 100);
          if (booking?.paymentIntentId !== paymentIntent.id ||
              booking?.riderId !== paymentIntent.metadata.riderId ||
              paymentIntent.currency !== "usd" ||
              paymentIntent.amount_received !== expectedAmount) {
            throw new Error("Payment intent does not match the server booking fare snapshot.");
          }
          transaction.update(bookingRef, {
            paymentStatus: "paid",
            amountAuthorized: expectedAmount / 100,
            amountCaptured: paymentIntent.amount_received / 100,
            updatedAt: FieldValue.serverTimestamp(),
          });
          transaction.create(eventRef, {
            type: event.type,
            bookingId,
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount_received,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            createdAt: FieldValue.serverTimestamp(),
          });
        });
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        await adminDb.collection("stripe_webhook_events").doc(event.id).set({
          type: event.type,
          checkoutSessionId: session.id,
          paymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : null,
          customerId:
            typeof session.customer === "string" ? session.customer : null,
          amountTotal: session.amount_total ?? null,
          currency: session.currency ?? null,
          createdAt: FieldValue.serverTimestamp(),
        }, { merge: false });

        break;
      }

      default: {
        await adminDb.collection("stripe_webhook_events").doc(event.id).set({
          type: event.type,
          createdAt: FieldValue.serverTimestamp(),
        }, { merge: false });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process webhook.";
    return new NextResponse(message, { status: 500 });
  }
}
