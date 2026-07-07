import * as admin from "firebase-admin";
import { defineSecret } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";
import Stripe from "stripe";

admin.initializeApp();

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");
const adminEmails = defineSecret("ADMIN_EMAILS");

type VisitorPlan = {
  id: string;
  name: string;
  amount: number;
  days: number;
};

const visitorPlans: Record<string, VisitorPlan> = {
  "day-pass": {
    id: "day-pass",
    name: "Cruise Day Pass",
    amount: 9,
    days: 1,
  },
  "trip-pass": {
    id: "trip-pass",
    name: "Trip Pass",
    amount: 19,
    days: 7,
  },
  "concierge-pass": {
    id: "concierge-pass",
    name: "Concierge Pass",
    amount: 49,
    days: 14,
  },
};

function stripeClient() {
  return new Stripe(stripeSecretKey.value());
}

function corsHeaders(origin?: string) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
  };
}

export const createVisitorCheckoutSession = onRequest(
  {
    cors: true,
    secrets: [stripeSecretKey],
  },
  async (req, res) => {
    const origin = String(req.headers.origin || "");

    if (req.method === "OPTIONS") {
      res.set(corsHeaders(origin)).status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.set(corsHeaders(origin)).status(405).send("Method not allowed");
      return;
    }

    const { uid, planId, successUrl, cancelUrl } = req.body || {};
    const plan = visitorPlans[String(planId || "")];

    if (!uid || typeof uid !== "string") {
      res.set(corsHeaders(origin)).status(400).send("Missing uid");
      return;
    }

    if (!plan) {
      res.set(corsHeaders(origin)).status(400).send("Invalid visitor plan");
      return;
    }

    const session = await stripeClient().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: plan.amount * 100,
            product_data: {
              name: `VI Guide ${plan.name}`,
              description: `${plan.days} day visitor planning access`,
            },
          },
        },
      ],
      success_url:
        typeof successUrl === "string" && successUrl
          ? successUrl
          : `${origin}/visitor-checkout?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        typeof cancelUrl === "string" && cancelUrl
          ? cancelUrl
          : `${origin}/visitor-checkout?payment=cancelled`,
      metadata: {
        uid,
        planId: plan.id,
        planName: plan.name,
        amount: String(plan.amount),
        days: String(plan.days),
      },
    });

    await admin.firestore().collection("checkoutSessions").doc(session.id).set(
      {
        uid,
        planId: plan.id,
        planName: plan.name,
        amount: plan.amount,
        days: plan.days,
        status: "created",
        stripeSessionId: session.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    res.set(corsHeaders(origin)).json({ url: session.url });
  }
);

export const stripeWebhook = onRequest(
  {
    secrets: [stripeSecretKey, stripeWebhookSecret],
  },
  async (req, res) => {
    const signature = req.headers["stripe-signature"];

    if (!signature || typeof signature !== "string") {
      res.status(400).send("Missing Stripe signature");
      return;
    }

    let event: Stripe.Event;

    try {
      event = stripeClient().webhooks.constructEvent(
        req.rawBody,
        signature,
        stripeWebhookSecret.value()
      );
    } catch (error) {
      res.status(400).send(
        error instanceof Error ? error.message : "Webhook signature verification failed"
      );
      return;
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const uid = String(session.metadata?.uid || "");
      const planId = String(session.metadata?.planId || "");
      const planName = String(session.metadata?.planName || "");
      const amount = Number(session.metadata?.amount || 0);
      const days = Number(session.metadata?.days || 1);

      if (uid && planId && planName) {
        const now = new Date();
        const expires = new Date(now);
        expires.setDate(expires.getDate() + days);

        const visitorPass = {
          id: `stripe-${session.id}`,
          planId,
          planName,
          amount,
          paidAt: now.toISOString(),
          expiresAt: expires.toISOString(),
          stripeSessionId: session.id,
          stripeCustomerId:
            typeof session.customer === "string" ? session.customer : "",
          paymentStatus: session.payment_status,
        };

        const db = admin.firestore();

        await db.collection("payments").doc(session.id).set(
          {
            ...visitorPass,
            uid,
            type: "visitor_pass",
            eventType: event.type,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        await db
          .collection("users")
          .doc(uid)
          .collection("visitorPasses")
          .doc("current")
          .set(
            {
              ...visitorPass,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

        await db.collection("checkoutSessions").doc(session.id).set(
          {
            status: "completed",
            paymentStatus: session.payment_status,
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
    }

    res.status(200).json({ received: true });
  }
);


type AppRole = "visitor" | "visitor_paid" | "partner" | "admin";

function parseAdminEmails() {
  return adminEmails
    .value()
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function roleClaims(role: AppRole) {
  return {
    admin: role === "admin",
    partner: role === "partner",
    visitor_paid: role === "visitor_paid",
    role,
  };
}

async function verifyAdminRequest(req: { headers: Record<string, unknown> }) {
  const authHeader = String(req.headers.authorization || "");
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : "";

  if (!token) {
    throw new Error("Missing Authorization bearer token.");
  }

  const decoded = await admin.auth().verifyIdToken(token, true);
  const requesterEmail = String(decoded.email || "").toLowerCase();
  const bootstrapAdmins = parseAdminEmails();

  if (decoded.admin === true || bootstrapAdmins.includes(requesterEmail)) {
    return decoded;
  }

  throw new Error("Admin access required.");
}

export const setUserRole = onRequest(
  {
    cors: true,
    secrets: [adminEmails],
  },
  async (req, res) => {
    const origin = String(req.headers.origin || "");

    if (req.method === "OPTIONS") {
      res.set(corsHeaders(origin)).status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.set(corsHeaders(origin)).status(405).send("Method not allowed");
      return;
    }

    try {
      const requester = await verifyAdminRequest(req);
      const email = String(req.body?.email || "").trim().toLowerCase();
      const role = String(req.body?.role || "").trim() as AppRole;

      if (!email) {
        res.set(corsHeaders(origin)).status(400).send("Missing user email.");
        return;
      }

      if (!["visitor", "visitor_paid", "partner", "admin"].includes(role)) {
        res.set(corsHeaders(origin)).status(400).send("Invalid role.");
        return;
      }

      const user = await admin.auth().getUserByEmail(email);
      const existingClaims = user.customClaims || {};
      const claims = {
        ...existingClaims,
        ...roleClaims(role),
      };

      await admin.auth().setCustomUserClaims(user.uid, claims);

      await admin.firestore().collection("roleAssignments").doc(user.uid).set(
        {
          uid: user.uid,
          email,
          role,
          claims,
          assignedByUid: requester.uid,
          assignedByEmail: requester.email || "",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      res.set(corsHeaders(origin)).json({
        ok: true,
        uid: user.uid,
        email,
        role,
        claims,
      });
    } catch (error) {
      res
        .set(corsHeaders(origin))
        .status(403)
        .send(error instanceof Error ? error.message : "Unable to set role.");
    }
  }
);

export const getMyClaims = onRequest(
  {
    cors: true,
  },
  async (req, res) => {
    const origin = String(req.headers.origin || "");

    if (req.method === "OPTIONS") {
      res.set(corsHeaders(origin)).status(204).send("");
      return;
    }

    try {
      const authHeader = String(req.headers.authorization || "");
      const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice("Bearer ".length)
        : "";

      if (!token) {
        res.set(corsHeaders(origin)).status(401).send("Missing bearer token.");
        return;
      }

      const decoded = await admin.auth().verifyIdToken(token, true);

      res.set(corsHeaders(origin)).json({
        uid: decoded.uid,
        email: decoded.email || "",
        claims: {
          admin: decoded.admin === true,
          partner: decoded.partner === true,
          visitor_paid: decoded.visitor_paid === true,
          role: decoded.role || "",
        },
      });
    } catch (error) {
      res
        .set(corsHeaders(origin))
        .status(401)
        .send(error instanceof Error ? error.message : "Unable to read claims.");
    }
  }
);

