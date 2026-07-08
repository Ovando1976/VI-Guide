import { logger } from "firebase-functions";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
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


import { GoogleGenAI, Type } from "@google/genai";

const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");
const GEMINI_MODEL = defineSecret("GEMINI_MODEL");

type IslandCode = "st_thomas" | "st_john" | "st_croix" | "water_island";

function safeIsland(value: unknown): IslandCode {
  if (
    value === "st_thomas" ||
    value === "st_john" ||
    value === "st_croix" ||
    value === "water_island"
  ) {
    return value;
  }

  return "st_thomas";
}

function normalizeText(value: unknown) {
  return String(value || "").trim().slice(0, 4000);
}

async function getCallerContext(idToken?: string) {
  if (!idToken) {
    return {
      uid: "",
      email: "",
      claims: {},
      admin: false,
      partner: false,
      visitorPaid: false,
    };
  }

  const decoded = await getAuth().verifyIdToken(idToken);

  const role = typeof decoded.role === "string" ? decoded.role : "";

  const admin = decoded.admin === true || role === "admin";
  const partner = admin || decoded.partner === true || role === "partner";
  const visitorPaid =
    admin ||
    partner ||
    decoded.visitor_paid === true ||
    role === "visitor_paid";

  return {
    uid: decoded.uid,
    email: decoded.email || "",
    claims: decoded,
    admin,
    partner,
    visitorPaid,
  };
}

async function readVisitorPass(uid: string) {
  if (!uid) return null;

  const snap = await getFirestore()
    .doc(`users/${uid}/visitorPasses/current`)
    .get();

  if (!snap.exists) return null;

  return snap.data();
}

async function searchCollection(
  collectionName: string,
  islandCode: IslandCode,
  maxResults = 8,
) {
  const db = getFirestore();

  const snap = await db
    .collection(collectionName)
    .where("islandCode", "==", islandCode)
    .limit(maxResults)
    .get();

  return snap.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

function compactListing(item: FirebaseFirestore.DocumentData) {
  return {
    id: item.id || "",
    title: item.title || item.name || "",
    slug: item.slug || "",
    islandCode: item.islandCode || "",
    category: item.category || item.type || "",
    description: String(item.description || "").slice(0, 500),
    address: item.address || "",
    areaSlug: item.areaSlug || "",
    coverImage: item.coverImage || item.image || "",
    lat: item.lat || item.latitude || null,
    lng: item.lng || item.longitude || null,
  };
}

function compactEvent(item: FirebaseFirestore.DocumentData) {
  return {
    id: item.id || "",
    title: item.title || "",
    islandCode: item.islandCode || "",
    description: String(item.description || "").slice(0, 500),
    coverImage: item.coverImage || "",
    startAt: item.startAt || "",
    venue: item.venue || "",
  };
}

async function readUserMemories(uid: string) {
  if (!uid) return [];

  const snap = await getFirestore()
    .collection(`users/${uid}/memories`)
    .orderBy("importance", "desc")
    .limit(12)
    .get()
    .catch(() => null);

  if (!snap) return [];

  return snap.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

async function saveUserMemory(uid: string, key: string, value: unknown, importance = 5) {
  if (!uid) return { status: "signed_out" };

  const memoryKey = String(key || "memory")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .slice(0, 80);

  await getFirestore()
    .doc(`users/${uid}/memories/${memoryKey}`)
    .set(
      {
        key: memoryKey,
        value,
        importance,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

  return { status: "remembered", key: memoryKey };
}

export const aiConcierge = onRequest(
  {
    region: "us-central1",
    cors: true,
    secrets: [GEMINI_API_KEY, GEMINI_MODEL],
    timeoutSeconds: 60,
    memory: "512MiB",
  },
  async (req, res) => {
    try {
      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }

      if (req.method !== "POST") {
        res.status(405).json({ error: "POST required" });
        return;
      }

      const authHeader = String(req.headers.authorization || "");
      const idToken = authHeader.startsWith("Bearer ")
        ? authHeader.slice("Bearer ".length)
        : "";

      const caller = await getCallerContext(idToken).catch(() => ({
        uid: "",
        email: "",
        claims: {},
        admin: false,
        partner: false,
        visitorPaid: false,
      }));

      const body = req.body || {};
      const message = normalizeText(body.message);
      const islandCode = safeIsland(body.islandCode);
      const agentId = String(body.agentId || "concierge");
      const contextListing = body.contextListing || null;
      const userLocation = body.userLocation || null;

      if (!message) {
        res.status(400).json({ error: "Message is required." });
        return;
      }

      const visitorPass = await readVisitorPass(caller.uid);
      const memories = await readUserMemories(caller.uid);

      const hasCloudPass =
        visitorPass &&
        typeof visitorPass.expiresAt === "string" &&
        new Date(visitorPass.expiresAt).getTime() > Date.now();

      const premium = caller.visitorPaid || Boolean(hasCloudPass);
      const operatorMode = agentId === "operator" && caller.admin;

      const beaches = (await searchCollection("beaches", islandCode, 10)).map(
        compactListing,
      );
      const places = (await searchCollection("places", islandCode, 10)).map(
        compactListing,
      );
      const events = (await searchCollection("events", islandCode, 8)).map(
        compactEvent,
      );

      const searchableListings = [...beaches, ...places];

      const ai = new GoogleGenAI({
        apiKey: GEMINI_API_KEY.value(),
      });

      const systemInstruction = `
You are VI Guide AI, a production AI concierge for the U.S. Virgin Islands.

Core job:
- Help visitors plan island days, routes, beaches, stays, restaurants, events, and transportation.
- Help paid visitors with more organized trip planning and booking handoffs.
- Help partners understand listing, lead, booking, and business workflow.
- Help admins/operators with higher-level territory intelligence only when operatorMode is true.

Rules:
- Be specific, practical, and local.
- Do not invent listings, prices, schedules, or legal/official rules.
- Prefer the app data provided in context.
- If the user asks for a booking, ride, stay, charter, tour, or partner action, return a clear next step and suggest the right app route.
- If premium is false, still be helpful, but invite the user to unlock the visitor pass for premium trip tools.
- If operatorMode is false, do not expose admin-only language, hidden routes, rules, or internal tooling.
- Keep responses concise and action-oriented.

Access:
- admin: ${caller.admin}
- partner: ${caller.partner}
- premium visitor: ${premium}
- operatorMode: ${operatorMode}
- islandCode: ${islandCode}
`;

      const appContext = {
        islandCode,
        user: {
          uid: caller.uid,
          email: caller.email,
          admin: caller.admin,
          partner: caller.partner,
          premium,
          operatorMode,
        },
        contextListing,
        userLocation,
        memories,
        visitorPass,
        listings: searchableListings,
        events,
        routes: {
          visitorDesk: "/visitor-desk",
          visitorCheckout: "/visitor-checkout",
          map: "/map",
          mobility: "/mobility",
          hotels: "/hotels",
          concierge: "/concierge",
          partnerDesk: "/partner-desk",
          account: "/account",
          adminDesk: caller.admin ? "/admin-desk" : undefined,
        },
      };

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL.value() || "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `
User message:
${message}

App context JSON:
${JSON.stringify(appContext).slice(0, 24000)}
`,
              },
            ],
          },
        ],
        config: {
          systemInstruction,
          tools: [
            {
              functionDeclarations: [
                {
                  name: "rememberUserPreference",
                  description:
                    "Save a durable user preference, such as favorite island, lodging style, travel group, budget, mobility needs, or food preference.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      key: {
                        type: Type.STRING,
                        description: "Memory key.",
                      },
                      value: {
                        type: Type.STRING,
                        description: "Memory value.",
                      },
                      importance: {
                        type: Type.NUMBER,
                        description: "Importance from 1 to 10.",
                      },
                    },
                    required: ["key", "value"],
                  },
                },
              ],
            },
          ],
        },
      });

      let answer = response.text || "";

      if (response.functionCalls?.length) {
        for (const call of response.functionCalls) {
          if (call.name === "rememberUserPreference") {
            const args = call.args as {
              key?: string;
              value?: unknown;
              importance?: number;
            };

            await saveUserMemory(
              caller.uid,
              args.key || "preference",
              args.value || "",
              args.importance || 5,
            );
          }
        }

        const second = await ai.models.generateContent({
          model: GEMINI_MODEL.value() || "gemini-2.5-flash",
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `
The user's request was:
${message}

You saved any requested memory. Now answer the user naturally using this app context:
${JSON.stringify(appContext).slice(0, 24000)}
`,
                },
              ],
            },
          ],
          config: {
            systemInstruction,
          },
        });

        answer = second.text || answer;
      }

      const q = message.toLowerCase();

      const relevantListings = searchableListings
        .filter((item: any) => {
          const haystack = `${item.title} ${item.category} ${item.description} ${item.address} ${item.areaSlug}`.toLowerCase();
          return q
            .split(/\s+/)
            .filter((word) => word.length > 3)
            .some((word) => haystack.includes(word));
        })
        .slice(0, 5);

      const relevantEvents = events
        .filter((item: any) => {
          const haystack = `${item.title} ${item.description} ${item.venue}`.toLowerCase();
          return q
            .split(/\s+/)
            .filter((word) => word.length > 3)
            .some((word) => haystack.includes(word));
        })
        .slice(0, 5);

      res.json({
        answer:
          answer ||
          "I can help you plan your island day, find places, compare beaches, arrange transportation, or start a booking request.",
        listings: relevantListings,
        events: relevantEvents,
        access: {
          admin: caller.admin,
          partner: caller.partner,
          premium,
          operatorMode,
        },
        suggestedRoutes: {
          visitorDesk: "/visitor-desk",
          checkout: premium ? null : "/visitor-checkout",
          mobility: "/mobility",
          hotels: "/hotels",
          map: `/map?island=${islandCode}`,
        },
      });
    } catch (error) {
      logger.error("aiConcierge failed", error);
      res.status(500).json({
        error: "AI concierge failed.",
        message:
          "The concierge could not complete the request. Please try again.",
      });
    }
  },
);
