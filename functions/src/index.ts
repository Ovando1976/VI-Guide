import { logger } from "firebase-functions";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import * as admin from "firebase-admin";
import { defineSecret } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";
import Stripe from "stripe";

const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");
const OPENAI_MODEL = defineSecret("OPENAI_MODEL");

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
      res
        .status(400)
        .send(
          error instanceof Error
            ? error.message
            : "Webhook signature verification failed"
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

        await db
          .collection("payments")
          .doc(session.id)
          .set(
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
      const email = String(req.body?.email || "")
        .trim()
        .toLowerCase();
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

      await admin
        .firestore()
        .collection("roleAssignments")
        .doc(user.uid)
        .set(
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
        .send(
          error instanceof Error ? error.message : "Unable to read claims."
        );
    }
  }
);

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
  return String(value || "")
    .trim()
    .slice(0, 4000);
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
  maxResults = 8
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

async function saveUserMemory(
  uid: string,
  key: string,
  value: unknown,
  importance = 5
) {
  if (!uid) return { status: "signed_out" };

  const memoryKey = String(key || "memory")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .slice(0, 80);

  await getFirestore().doc(`users/${uid}/memories/${memoryKey}`).set(
    {
      key: memoryKey,
      value,
      importance,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return { status: "remembered", key: memoryKey };
}

type OpenAIResponsePayload = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
  }>;
};

function extractOpenAIText(payload: OpenAIResponsePayload) {
  if (payload.output_text) return payload.output_text;

  const parts: string[] = [];

  for (const item of payload.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === "string") {
        parts.push(content.text);
      }
    }
  }

  return parts.join("\n").trim();
}

async function callOpenAIConcierge(input: {
  systemInstruction: string;
  message: string;
  appContext: unknown;
}) {
  const apiKey = OPENAI_API_KEY.value();
  const model = OPENAI_MODEL.value() || "gpt-5.4-mini";

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "developer",
          content: [
            {
              type: "input_text",
              text: input.systemInstruction,
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `User message:\n${
                input.message
              }\n\nApp context JSON:\n${JSON.stringify(input.appContext).slice(
                0,
                24000
              )}`,
            },
          ],
        },
      ],
      max_output_tokens: 900,
    }),
  });

  const raw = await response.text();

  let payload: OpenAIResponsePayload & {
    error?: { message?: string; type?: string; code?: string };
  } = {};

  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(`OpenAI returned non-JSON response: ${raw.slice(0, 240)}`);
  }

  if (!response.ok) {
    throw new Error(
      payload.error?.message ||
        payload.error?.code ||
        `OpenAI request failed with HTTP ${response.status}`
    );
  }

  return extractOpenAIText(payload);
}

function sanitizeConciergeAnswer(answer: string, allowedAppNames: string[]) {
  const allowed = new Set(
    allowedAppNames.map((name) => name.toLowerCase().trim()).filter(Boolean)
  );

  const guardedReplacements: Array<[string, string]> = [
    ["Island Executive SUV Service", "a private ride"],
    ["Gladys Café", "a nearby food stop"],
    ["Gladys Cafe", "a nearby food stop"],
    ["Frenchtown Dining", "a nearby dining area"],
  ];

  let safe = answer;

  for (const [name, replacement] of guardedReplacements) {
    if (!allowed.has(name.toLowerCase())) {
      safe = safe.replaceAll(name, replacement);
    }
  }

  return safe;
}

type ConciergeIntent =
  | "cruise_day"
  | "beach_day"
  | "ride"
  | "stay"
  | "food"
  | "events"
  | "partner"
  | "operator"
  | "general";

function inferConciergeIntent(
  message: string,
  operatorMode = false
): ConciergeIntent {
  const lower = message.toLowerCase();

  if (operatorMode) return "operator";
  if (/\b(cruise|ship|port|havensight|crown bay|shore excursion)\b/.test(lower))
    return "cruise_day";
  if (/\b(beach|snorkel|swim|water|bay)\b/.test(lower)) return "beach_day";
  if (
    /\b(ride|taxi|transport|driver|pickup|dropoff|route|mobility)\b/.test(lower)
  )
    return "ride";
  if (/\b(hotel|stay|villa|charter|accommodation|room|resort)\b/.test(lower))
    return "stay";
  if (/\b(food|eat|restaurant|lunch|dinner|breakfast|drink)\b/.test(lower))
    return "food";
  if (
    /\b(event|events|carnival|festival|music|concert|weekend|tonight|today)\b/.test(
      lower
    )
  )
    return "events";
  if (/\b(partner|business|claim|listing|merchant|lead)\b/.test(lower))
    return "partner";

  return "general";
}

function buildConciergePlan(input: {
  intent: ConciergeIntent;
  islandCode: IslandCode;
  listings: Array<any>;
  premium: boolean;
}) {
  const topListing = input.listings[0];
  const placeName = topListing?.title || "your selected stop";

  if (input.intent === "cruise_day") {
    return [
      {
        time: "Arrival",
        title: "Leave the port with a simple route",
        detail:
          "Choose one beach or scenic stop first, then keep the rest of the day close enough to return with buffer.",
        path: `/map?island=${input.islandCode}`,
      },
      {
        time: "Beach block",
        title: `Make ${placeName} the anchor stop`,
        detail:
          "Spend most of the day at one strong beach instead of rushing between too many locations.",
        path: `/map?island=${input.islandCode}`,
      },
      {
        time: "Food stop",
        title: "Use a nearby food stop",
        detail:
          "Keep lunch close to the beach or on the way back toward port so you do not lose time.",
        path: "/concierge",
      },
      {
        time: "Return",
        title: "Build in the ride buffer",
        detail:
          "Plan pickup early enough to be back near the ship before the final return window.",
        path: "/mobility",
      },
    ];
  }

  if (input.intent === "ride") {
    return [
      {
        time: "Step 1",
        title: "Confirm pickup and destination",
        detail:
          "Use the Mobility page to preview the road route and make the trip easier to dispatch.",
        path: "/mobility",
      },
      {
        time: "Step 2",
        title: "Add trip context",
        detail:
          "Tell the driver if this is airport, cruise, ferry, beach, hotel, or dinner transportation.",
        path: "/mobility",
      },
      {
        time: "Step 3",
        title: "Save the trip plan",
        detail:
          "Use the visitor desk to keep the route, stops, and timing organized.",
        path: "/visitor-desk",
      },
    ];
  }

  if (input.intent === "stay") {
    return [
      {
        time: "Search",
        title: "Compare stay types",
        detail:
          "Look at hotels, villas, resorts, and charter-style options based on your island plan.",
        path: "/hotels",
      },
      {
        time: "Match",
        title: "Match the stay to the trip",
        detail:
          "Choose lodging based on beach access, restaurant access, transportation, and arrival point.",
        path: "/hotels",
      },
      {
        time: "Request",
        title: "Send a booking inquiry",
        detail:
          "Use the listing or partner flow when you are ready for a real booking handoff.",
        path: "/hotels",
      },
    ];
  }

  if (input.intent === "events") {
    return [
      {
        time: "Discover",
        title: "Check what is happening",
        detail:
          "Look for published events, culture, food, music, and local activity windows.",
        path: "/events",
      },
      {
        time: "Plan",
        title: "Place events around the route",
        detail:
          "Add one event after beach, dinner, or downtown time instead of overloading the day.",
        path: "/visitor-desk",
      },
    ];
  }

  return [
    {
      time: "Start",
      title: "Pick your anchor",
      detail: `Start with ${placeName}, then build food and transportation around it.`,
      path: `/map?island=${input.islandCode}`,
    },
    {
      time: "Move",
      title: "Preview the route",
      detail:
        "Use Mobility to understand the pickup, destination, and driving path.",
      path: "/mobility",
    },
    {
      time: "Organize",
      title: input.premium
        ? "Save it in Visitor Desk"
        : "Unlock the visitor pass",
      detail: input.premium
        ? "Keep the plan, route, booking handoffs, and notes together."
        : "Unlock premium planning tools when you want the organized trip desk.",
      path: input.premium ? "/visitor-desk" : "/visitor-checkout",
    },
  ];
}

function buildConciergeActions(input: {
  intent: ConciergeIntent;
  islandCode: IslandCode;
  premium: boolean;
  partner: boolean;
  admin: boolean;
}) {
  const actions = [
    {
      label: "Open map",
      description: "See nearby places and island context.",
      path: `/map?island=${input.islandCode}`,
      kind: "map",
    },
    {
      label: "Plan ride",
      description: "Preview pickup, destination, and route.",
      path: "/mobility",
      kind: "mobility",
    },
  ];

  if (
    input.intent === "stay" ||
    input.intent === "cruise_day" ||
    input.intent === "general"
  ) {
    actions.push({
      label: "Find stays",
      description: "Hotels, villas, charters, and booking inquiries.",
      path: "/hotels",
      kind: "booking",
    });
  }

  if (input.intent === "events") {
    actions.push({
      label: "View events",
      description: "See local events and cultural activity.",
      path: "/events",
      kind: "general",
    });
  }

  if (!input.premium) {
    actions.push({
      label: "Unlock visitor pass",
      description: "Premium trip planning and organized visitor tools.",
      path: "/visitor-checkout",
      kind: "checkout",
    });
  } else {
    actions.push({
      label: "Open visitor desk",
      description: "Save and organize this plan.",
      path: "/visitor-desk",
      kind: "general",
    });
  }

  if (input.partner) {
    actions.push({
      label: "Partner desk",
      description: "Manage listing, leads, and business workflow.",
      path: "/partner-desk",
      kind: "partner",
    });
  }

  if (input.admin) {
    actions.push({
      label: "Admin desk",
      description: "Review operations, revenue, and partner workflow.",
      path: "/admin-desk",
      kind: "admin",
    });
  }

  return actions.slice(0, 5);
}

export const aiConcierge = onRequest(
  {
    region: "us-central1",
    cors: true,
    secrets: [OPENAI_API_KEY, OPENAI_MODEL],
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
        compactListing
      );
      const places = (await searchCollection("places", islandCode, 10)).map(
        compactListing
      );
      const events = (await searchCollection("events", islandCode, 8)).map(
        compactEvent
      );

      const searchableListings = [...beaches, ...places];

      const allowedAppNames = Array.from(
        new Set(
          [
            ...searchableListings.map((item) => item.title),
            ...events.map((item) => item.title),
          ]
            .map((value) => String(value || "").trim())
            .filter(Boolean)
        )
      );

      const systemInstruction = `
You are VI Guide AI, a production AI concierge for the U.S. Virgin Islands.

Core job:
- Help visitors plan island days, beaches, stays, restaurants, events, and transportation.
- Help paid visitors with more organized trip planning and booking handoffs.
- Help partners understand listing, lead, booking, and business workflow.
- Help admins/operators with territory intelligence only when operatorMode is true.

Rules:
- Be specific, practical, concise, and local.
- Do not invent official prices, ferry times, laws, schedules, or guarantees.
- Do not name a specific business, driver, guide, hotel, restaurant, attraction, or service unless the exact name appears in allowedAppNames.
- For transportation, say "taxi", "private ride", "mobility request", or "driver pickup" unless a specific provider exists in allowedAppNames.
- For food, say "nearby food stop", "beach vendor", or "nearby dining area" unless the exact restaurant exists in allowedAppNames.
- Prefer the app data provided in context.
- If the user asks for booking, ride, stay, charter, tour, or partner action, suggest the right app route.
- If premium is false, still help, but invite the user to unlock the visitor pass for premium tools.
- If operatorMode is false, do not reveal admin-only routes or internal tooling.

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
        allowedAppNames,
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

      const rawAnswer = await callOpenAIConcierge({
        systemInstruction,
        message,
        appContext,
      });

      const answer = sanitizeConciergeAnswer(rawAnswer, allowedAppNames);

      const q = message.toLowerCase();
      const words = q.split(/\s+/).filter((word) => word.length > 3);

      const relevantListings = searchableListings
        .filter((item: any) => {
          const haystack =
            `${item.title} ${item.category} ${item.description} ${item.address} ${item.areaSlug}`.toLowerCase();
          return words.some((word) => haystack.includes(word));
        })
        .slice(0, 5);

      const wantsEvents =
        /\b(event|events|carnival|festival|music|concert|show|tonight|today|weekend|this week)\b/.test(
          q
        );

      const relevantEvents = wantsEvents
        ? events
            .filter((item: any) => {
              const haystack =
                `${item.title} ${item.description} ${item.venue}`.toLowerCase();
              return words.some((word) => haystack.includes(word));
            })
            .slice(0, 5)
        : [];

      const intent = inferConciergeIntent(message, operatorMode);

      const plan = buildConciergePlan({
        intent,
        islandCode,
        listings: relevantListings,
        premium,
      });

      const actions = buildConciergeActions({
        intent,
        islandCode,
        premium,
        partner: caller.partner,
        admin: caller.admin,
      });

      res.json({
        answer:
          answer ||
          "I can help you plan your island day, find places, compare beaches, arrange transportation, or start a booking request.",
        listings: relevantListings,
        events: relevantEvents,
        plan,
        actions,
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
        provider: "openai",
      });
    } catch (error) {
      logger.error("aiConcierge failed", error);

      const body = req.body || {};
      const islandCode = safeIsland(body.islandCode);
      const message = normalizeText(body.message);
      const lower = message.toLowerCase();

      let answer =
        "VI Guide AI is in Local Intelligence Mode right now because the external AI provider is unavailable. I can still help you move through the app: choose a beach or place, preview transportation in Mobility, open Hotels for stays or charters, or use Visitor Desk to organize the trip.";

      if (lower.includes("beach")) {
        answer =
          "VI Guide AI is in Local Intelligence Mode right now. For a simple St. Thomas beach day, start with a beach stop like Sapphire, Magens, Brewers, or Hull Bay, then use Mobility for the ride preview and the Map to add nearby food or activities.";
      } else if (lower.includes("cruise")) {
        answer =
          "VI Guide AI is in Local Intelligence Mode right now. For a cruise day, keep the plan simple: arrive, choose one beach or scenic stop, add one food stop, then return with enough buffer. Open Mobility for the ride preview, Map for nearby places, and Visitor Desk to organize the day.";
      } else if (
        lower.includes("hotel") ||
        lower.includes("stay") ||
        lower.includes("villa")
      ) {
        answer =
          "VI Guide AI is in Local Intelligence Mode right now. For stays, open Hotels to compare hotels, villas, charters, and partner listings. Use the partner or booking flow when you are ready to send an inquiry.";
      } else if (
        lower.includes("ride") ||
        lower.includes("taxi") ||
        lower.includes("transport")
      ) {
        answer =
          "VI Guide AI is in Local Intelligence Mode right now. For transportation, open Mobility to preview the route, choose pickup and destination context, and continue into the ride request flow.";
      }

      const fallbackIntent = inferConciergeIntent(message, false);
      const fallbackPlan = buildConciergePlan({
        intent: fallbackIntent,
        islandCode,
        listings: [],
        premium: false,
      });
      const fallbackActions = buildConciergeActions({
        intent: fallbackIntent,
        islandCode,
        premium: false,
        partner: false,
        admin: false,
      });

      res.status(200).json({
        answer,
        listings: [],
        events: [],
        plan: fallbackPlan,
        actions: fallbackActions,
        access: {
          admin: false,
          partner: false,
          premium: false,
          operatorMode: false,
        },
        suggestedRoutes: {
          visitorDesk: "/visitor-desk",
          checkout: "/visitor-checkout",
          mobility: "/mobility",
          hotels: "/hotels",
          map: `/map?island=${islandCode}`,
          concierge: "/concierge",
        },
        provider: "local-fallback",
        debug: {
          fallback: true,
          reason: "OPENAI_GATEWAY_ERROR",
          userMessage: message.slice(0, 160),
          errorMessage:
            error instanceof Error
              ? error.message.slice(0, 260)
              : "Unknown runtime error",
        },
      });
    }
  }
);
