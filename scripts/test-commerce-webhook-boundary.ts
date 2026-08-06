import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import Stripe from "stripe";

const webhookSecret = "whsec_vi_guide_boundary_test";
const stripeSecretKey = "sk_test_vi_guide_boundary_test";
const firebaseProjectId = "vi-guide-webhook-boundary-test";
const created = 1_786_039_200;

process.env.STRIPE_SECRET_KEY = stripeSecretKey;
process.env.STRIPE_COMMERCE_WEBHOOK_SECRET = webhookSecret;
process.env.FIREBASE_PROJECT_ID = firebaseProjectId;

const [{ NextRequest }, { POST }] = await Promise.all([
  import("next/server"),
  import("../app/api/stripe/commerce-webhook/route"),
]);

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2026-03-25.dahlia",
});

function eventPayload(input: {
  id: string;
  type: string;
  dataObject: Record<string, unknown>;
}) {
  return JSON.stringify({
    id: input.id,
    object: "event",
    api_version: "2026-03-25.dahlia",
    created,
    data: { object: input.dataObject },
    livemode: false,
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
    type: input.type,
  });
}

function signedRequest(payload: string) {
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: webhookSecret,
    timestamp: created,
  });

  return new NextRequest(
    "http://localhost/api/stripe/commerce-webhook",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "stripe-signature": signature,
      },
      body: payload,
    },
  );
}

async function responseJson(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

const missingSignaturePayload = eventPayload({
  id: "evt_boundary_missing_signature",
  type: "customer.created",
  dataObject: { id: "cus_boundary", object: "customer" },
});
const missingSignatureResponse = await POST(
  new NextRequest("http://localhost/api/stripe/commerce-webhook", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: missingSignaturePayload,
  }),
);
assert.equal(missingSignatureResponse.status, 503);
assert.deepEqual(await responseJson(missingSignatureResponse), {
  error: "Commerce payment webhook is not configured.",
});

const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  if (String(args[0] ?? "").includes("commerce stripe webhook signature error")) {
    return;
  }
  originalConsoleError(...args);
};

try {
  const invalidSignatureResponse = await POST(
    new NextRequest("http://localhost/api/stripe/commerce-webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "stripe-signature": "t=1786039200,v1=invalid",
      },
      body: missingSignaturePayload,
    }),
  );
  assert.equal(invalidSignatureResponse.status, 400);
  assert.deepEqual(await responseJson(invalidSignatureResponse), {
    error: "Invalid webhook signature.",
  });

  const tamperOriginal = eventPayload({
    id: "evt_boundary_tamper_original",
    type: "checkout.session.completed",
    dataObject: {
      id: "cs_test_boundary_tamper",
      object: "checkout.session",
      metadata: {},
      payment_status: "paid",
    },
  });
  const tamperSignature = stripe.webhooks.generateTestHeaderString({
    payload: tamperOriginal,
    secret: webhookSecret,
    timestamp: created,
  });
  const tamperedResponse = await POST(
    new NextRequest("http://localhost/api/stripe/commerce-webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "stripe-signature": tamperSignature,
      },
      body: tamperOriginal.replace("paid", "unpaid"),
    }),
  );
  assert.equal(tamperedResponse.status, 400);
  assert.deepEqual(await responseJson(tamperedResponse), {
    error: "Invalid webhook signature.",
  });
} finally {
  console.error = originalConsoleError;
}

const ignoredPayload = eventPayload({
  id: "evt_boundary_ignored",
  type: "customer.created",
  dataObject: { id: "cus_boundary_ignored", object: "customer" },
});
const ignoredResponse = await POST(signedRequest(ignoredPayload));
assert.equal(ignoredResponse.status, 200);
assert.deepEqual(await responseJson(ignoredResponse), {
  received: true,
  ignored: true,
});

const completedPayload = eventPayload({
  id: "evt_boundary_checkout_completed",
  type: "checkout.session.completed",
  dataObject: {
    id: "cs_test_boundary_completed",
    object: "checkout.session",
    metadata: {},
    payment_status: "paid",
  },
});
const completedResponse = await POST(signedRequest(completedPayload));
assert.equal(completedResponse.status, 200);
assert.deepEqual(await responseJson(completedResponse), { received: true });

const guardedCompletedPayload = eventPayload({
  id: "evt_boundary_checkout_guarded",
  type: "checkout.session.completed",
  dataObject: {
    id: "cs_test_boundary_guarded",
    object: "checkout.session",
    metadata: { bookingId: "booking_boundary_guarded" },
    payment_status: "unpaid",
  },
});
const guardedCompletedResponse = await POST(
  signedRequest(guardedCompletedPayload),
);
assert.equal(guardedCompletedResponse.status, 200);
assert.deepEqual(await responseJson(guardedCompletedResponse), {
  received: true,
});

const expiredPayload = eventPayload({
  id: "evt_boundary_checkout_expired",
  type: "checkout.session.expired",
  dataObject: {
    id: "cs_test_boundary_expired",
    object: "checkout.session",
    metadata: {},
  },
});
const expiredResponse = await POST(signedRequest(expiredPayload));
assert.equal(expiredResponse.status, 200);
assert.deepEqual(await responseJson(expiredResponse), { received: true });

const forgedRefundPayload = eventPayload({
  id: "evt_boundary_forged_refund",
  type: "refund.created",
  dataObject: {
    id: "re_boundary_forged",
    object: "refund",
    amount: 25_000,
    currency: "usd",
    metadata: { bookingId: "booking_boundary_forged" },
    payment_intent: "pi_boundary_forged",
    status: "succeeded",
  },
});
const forgedRefundResponse = await POST(
  new NextRequest("http://localhost/api/stripe/commerce-webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "stripe-signature": "t=1786039200,v1=forged-refund-signature",
    },
    body: forgedRefundPayload,
  }),
);
assert.equal(forgedRefundResponse.status, 400);
assert.deepEqual(await responseJson(forgedRefundResponse), {
  error: "Invalid webhook signature.",
});

const routeSource = await readFile(
  new URL("../app/api/stripe/commerce-webhook/route.ts", import.meta.url),
  "utf8",
);
for (const eventType of [
  "checkout.session.completed",
  "checkout.session.expired",
  "refund.created",
  "refund.updated",
  "refund.failed",
]) {
  assert.ok(
    routeSource.includes(eventType),
    `Commerce webhook route must explicitly handle ${eventType}.`,
  );
}

console.log(
  JSON.stringify(
    {
      result: "passed",
      boundary: "actual Next.js commerce webhook route",
      validSignedEvents: [
        "ignored event",
        "checkout.session.completed",
        "checkout.session.expired",
      ],
      rejectedRequests: [
        "missing signature",
        "invalid signature",
        "tampered payload",
        "forged refund signature",
      ],
      configuredRefundEvents: [
        "refund.created",
        "refund.updated",
        "refund.failed",
      ],
      externalWrites: 0,
      liveStripeOperations: 0,
    },
    null,
    2,
  ),
);
