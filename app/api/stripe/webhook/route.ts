import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getAdminDb } from "@/lib/firebase-admin";
import { getStripe } from "@/lib/stripe";

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

        await adminDb.collection("stripe_webhook_events").add({
          type: event.type,
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
          createdAt: new Date().toISOString(),
        });

        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        await adminDb.collection("stripe_webhook_events").add({
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
          createdAt: new Date().toISOString(),
        });

        break;
      }

      default: {
        await adminDb.collection("stripe_webhook_events").add({
          type: event.type,
          createdAt: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process webhook.";
    return new NextResponse(message, { status: 500 });
  }
}
