// functions/src/viIntelligence.ts

import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

if (!admin.apps.length) {
  admin.initializeApp();
}

const openAiApiKey = defineSecret("OPENAI_API_KEY");

type IslandCode = "st_thomas" | "st_john" | "st_croix" | "water_island";

type ViIntent =
  | "general_help"
  | "trip_plan"
  | "beach_recommendation"
  | "restaurant_recommendation"
  | "ride_request"
  | "stay_planning"
  | "event_discovery"
  | "booking_lead"
  | "route_planning"
  | "local_history"
  | "operator_insight"
  | "emergency_or_safety";

type ViConfidence = "low" | "medium" | "high";

type ViHistoryMessage = {
  role: "user" | "model" | "system";
  text: string;
  createdAt?: string;
};

type ViIntelligenceRequest = {
  message?: string;
  islandCode?: IslandCode;
  agentId?: string;
  sessionId?: string | null;
  userId?: string | null;
  userProfile?: Record<string, unknown> | null;
  contextListing?: Record<string, unknown> | null;
  userLocation?: { lat: number; lng: number } | null;
  history?: ViHistoryMessage[];
};

type VerifiedUser = {
  uid: string | null;
  email: string | null;
  admin: boolean;
  partner: boolean;
  premium: boolean;
};

type ViListing = {
  id: string;
  title: string;
  coverImage: string | null;
  address: string | null;
  areaSlug: string | null;
  category: string | null;
  path: string | null;
};

type ViEvent = {
  id: string;
  title: string;
  coverImage: string | null;
  startAt: string | null;
  path: string | null;
};

type ViPlanStep = {
  id: string | null;
  time: string | null;
  title: string;
  detail: string;
  locationName: string | null;
  path: string | null;
  estimatedCost: string | null;
  travelTimeMinutes: number | null;
};

type ViActionKind =
  | "map"
  | "mobility"
  | "ride"
  | "booking"
  | "checkout"
  | "partner"
  | "admin"
  | "general"
  | "call"
  | "save"
  | "share"
  | "route"
  | "upgrade"
  | "learn_more";

type ViAction = {
  label: string;
  description: string | null;
  path: string;
  kind: ViActionKind;
  priority: "low" | "medium" | "high";
};

type ViLeadDraft = {
  name: string | null;
  email: string | null;
  phone: string | null;
  partySize: number | null;
  preferredDate: string | null;
  preferredTime: string | null;
  pickupLocation: string | null;
  destination: string | null;
  budget: string | null;
  notes: string | null;
};

type ViMemorySignal = {
  key: string;
  value: string;
  confidence: ViConfidence;
  shouldSave: boolean;
  reason: string | null;
};

type ViRoutes = {
  concierge: string | null;
  explore: string | null;
  beaches: string | null;
  places: string | null;
  events: string | null;
  mobility: string | null;
  checkout: string | null;
};

type ViResponse = {
  answer: string;
  intent: ViIntent;
  confidence: ViConfidence;
  listings: ViListing[];
  events: ViEvent[];
  plan: ViPlanStep[];
  actions: ViAction[];
  leadDraft: ViLeadDraft;
  missingFields: string[];
  memorySignals: ViMemorySignal[];
  provider: string;
  access: {
    admin: boolean;
    partner: boolean;
    premium: boolean;
    operatorMode: boolean;
  };
  suggestedRoutes: ViRoutes;
  debug: {
    agentUsed: string | null;
    toolsUsed: string[];
    reason: string | null;
  };
};

export const viIntelligence = onRequest(
  {
    region: "us-central1",
    cors: true,
    secrets: [openAiApiKey],
    timeoutSeconds: 60,
    memory: "512MiB",
  },
  async (req, res) => {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const startedAt = Date.now();

    try {
      const body = normalizeBody(req.body) as ViIntelligenceRequest;
      const message = normalizeText(body.message);

      if (!message) {
        res.status(400).json({ error: "Missing message" });
        return;
      }

      const islandCode = safeIsland(body.islandCode);
      const agentId = String(body.agentId || "concierge");
      const verifiedUser = await getVerifiedUser(req);

      const access = {
        admin: verifiedUser.admin,
        partner: verifiedUser.partner,
        premium: verifiedUser.premium,
        operatorMode: agentId === "operator" || verifiedUser.admin,
      };

      const appData = await readAppContext({
        uid: verifiedUser.uid || body.userId || "",
        islandCode,
      });

      const contextBundle = buildContextBundle({
        body,
        verifiedUser,
        islandCode,
        agentId,
        access,
        appData,
      });

      let rawAiResult: Record<string, unknown> | null = null;
      let provider = "local-fallback";
      let openAiError: string | null = null;

      try {
        rawAiResult = await callOpenAiConciergeJson({
          message,
          contextBundle,
        });
        provider = "openai";
      } catch (error) {
        openAiError =
          error instanceof Error ? error.message : "Unknown OpenAI error";

        logger.warn("viIntelligence OpenAI fallback used", {
          error: openAiError,
          islandCode,
          agentId,
        });
      }

      const localFallback = buildLocalResponse({
        message,
        islandCode,
        agentId,
        access,
        appData,
        reason: openAiError,
      });

      const normalized = normalizeAiResult(rawAiResult, localFallback, {
        access,
        agentId,
        islandCode,
        provider,
        elapsedMs: Date.now() - startedAt,
        openAiError,
        message,
      });

      res.status(200).json(normalized);
    } catch (error) {
      logger.error("viIntelligence fatal failure", error);

      const body = normalizeBody(req.body) as ViIntelligenceRequest;
      const islandCode = safeIsland(body.islandCode);
      const message = normalizeText(body.message);
      const routes = defaultRoutes(islandCode);

      const fallback = buildLocalResponse({
        message: message || "Help me plan my Virgin Islands visit.",
        islandCode,
        agentId: String(body.agentId || "concierge"),
        access: {
          admin: false,
          partner: false,
          premium: false,
          operatorMode: false,
        },
        appData: {
          listings: [],
          events: [],
          memories: [],
          visitorPass: null,
        },
        reason: error instanceof Error ? error.message : "Unknown fatal error",
      });

      res.status(200).json({
        ...fallback,
        suggestedRoutes: routes,
        debug: {
          agentUsed: "local-fallback",
          toolsUsed: ["local-rules"],
          reason:
            error instanceof Error ? error.message : "Unknown fatal error",
        },
      });
    }
  }
);

function normalizeBody(body: unknown): Record<string, unknown> {
  if (!body) return {};

  if (typeof body === "string") {
    try {
      return JSON.parse(body) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  if (typeof body === "object") {
    return body as Record<string, unknown>;
  }

  return {};
}

function normalizeText(value: unknown) {
  return String(value || "")
    .trim()
    .slice(0, 4000);
}

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

async function getVerifiedUser(req: any): Promise<VerifiedUser> {
  const authHeader = String(req.headers.authorization || "");

  if (!authHeader.startsWith("Bearer ")) {
    return {
      uid: null,
      email: null,
      admin: false,
      partner: false,
      premium: false,
    };
  }

  const token = authHeader.replace("Bearer ", "").trim();

  try {
    const decoded = await admin.auth().verifyIdToken(token);

    const role = typeof decoded.role === "string" ? decoded.role : "";

    const adminAccess = decoded.admin === true || role === "admin";
    const partnerAccess =
      adminAccess || decoded.partner === true || role === "partner";
    const premiumAccess =
      adminAccess ||
      partnerAccess ||
      decoded.premium === true ||
      decoded.visitor_paid === true ||
      role === "visitor_paid";

    return {
      uid: decoded.uid || null,
      email: decoded.email || null,
      admin: adminAccess,
      partner: partnerAccess,
      premium: premiumAccess,
    };
  } catch (error) {
    logger.warn("Invalid auth token for viIntelligence", error);

    return {
      uid: null,
      email: null,
      admin: false,
      partner: false,
      premium: false,
    };
  }
}

async function readAppContext(input: { uid: string; islandCode: IslandCode }) {
  const { uid, islandCode } = input;

  const [beaches, places, events, memories, visitorPass] = await Promise.all([
    searchCollection("beaches", islandCode, 8).catch(() => []),
    searchCollection("places", islandCode, 8).catch(() => []),
    searchCollection("events", islandCode, 6).catch(() => []),
    readUserMemories(uid).catch(() => []),
    readVisitorPass(uid).catch(() => null),
  ]);

  return {
    listings: [...beaches.map(compactListing), ...places.map(compactListing)],
    events: events.map(compactEvent),
    memories,
    visitorPass,
  };
}

async function searchCollection(
  collectionName: string,
  islandCode: IslandCode,
  maxResults: number
) {
  const snap = await getFirestore()
    .collection(collectionName)
    .where("islandCode", "==", islandCode)
    .limit(maxResults)
    .get();

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
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

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

async function readVisitorPass(uid: string) {
  if (!uid) return null;

  const snap = await getFirestore()
    .doc(`users/${uid}/visitorPasses/current`)
    .get();

  return snap.exists ? snap.data() || null : null;
}

function compactListing(item: FirebaseFirestore.DocumentData): ViListing {
  const slug = String(item.slug || item.id || "").trim();
  const category = String(item.category || item.type || "place").trim();

  return {
    id: String(item.id || slug || item.title || "listing"),
    title: String(item.title || item.name || "Island stop"),
    coverImage: stringOrNull(item.coverImage || item.image),
    address: stringOrNull(item.address),
    areaSlug: stringOrNull(item.areaSlug),
    category: stringOrNull(category),
    path:
      stringOrNull(item.path) ||
      (slug ? `/${category === "beach" ? "beaches" : "places"}/${slug}` : null),
  };
}

function compactEvent(item: FirebaseFirestore.DocumentData): ViEvent {
  const slug = String(item.slug || item.id || "").trim();

  return {
    id: String(item.id || slug || item.title || "event"),
    title: String(item.title || "Island event"),
    coverImage: stringOrNull(item.coverImage || item.image),
    startAt: stringOrNull(item.startAt),
    path: stringOrNull(item.path) || (slug ? `/events/${slug}` : "/events"),
  };
}

function stringOrNull(value: unknown): string | null {
  const text = String(value || "").trim();
  return text ? text : null;
}

function buildContextBundle(input: {
  body: ViIntelligenceRequest;
  verifiedUser: VerifiedUser;
  islandCode: IslandCode;
  agentId: string;
  access: ViResponse["access"];
  appData: {
    listings: ViListing[];
    events: ViEvent[];
    memories: unknown[];
    visitorPass: unknown;
  };
}) {
  const { body, verifiedUser, islandCode, agentId, access, appData } = input;

  return {
    app: "VI Guide",
    islandCode,
    islandLabel: islandLabel(islandCode),
    agentId,
    access,
    user: {
      uid: verifiedUser.uid || body.userId || null,
      email: verifiedUser.email || null,
      profile: body.userProfile || null,
      location: body.userLocation || null,
    },
    contextListing: body.contextListing || null,
    sessionId: body.sessionId || null,
    history: Array.isArray(body.history) ? body.history.slice(-10) : [],
    currentDateIso: new Date().toISOString(),
    suggestedRoutes: defaultRoutes(islandCode),
    appData: {
      listings: appData.listings.slice(0, 12),
      events: appData.events.slice(0, 8),
      memories: appData.memories,
      visitorPass: appData.visitorPass,
    },
  };
}

async function callOpenAiConciergeJson(input: {
  message: string;
  contextBundle: Record<string, unknown>;
}): Promise<Record<string, unknown>> {
  const apiKey = openAiApiKey.value();

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(input.message, input.contextBundle);

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
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      max_output_tokens: 1800,
    }),
  });

  const raw = await response.text();

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.status} ${raw}`);
  }

  const payload = raw ? JSON.parse(raw) : {};
  const outputText = extractOpenAIText(payload);

  if (!outputText) {
    throw new Error("OpenAI response had no text output.");
  }

  return parseJsonObjectFromText(outputText);
}

function buildSystemPrompt() {
  return `
You are VI Guide Intelligence, the orchestration brain for a Virgin Islands travel, concierge, mobility, booking, and local discovery app.

Return only one valid JSON object. Do not use markdown. Do not wrap the JSON in code fences.

The JSON object must use this exact shape:
{
  "answer": string,
  "intent": "general_help" | "trip_plan" | "beach_recommendation" | "restaurant_recommendation" | "ride_request" | "stay_planning" | "event_discovery" | "booking_lead" | "route_planning" | "local_history" | "operator_insight" | "emergency_or_safety",
  "confidence": "low" | "medium" | "high",
  "listings": [],
  "events": [],
  "plan": [],
  "actions": [],
  "leadDraft": {
    "name": null,
    "email": null,
    "phone": null,
    "partySize": null,
    "preferredDate": null,
    "preferredTime": null,
    "pickupLocation": null,
    "destination": null,
    "budget": null,
    "notes": null
  },
  "missingFields": [],
  "memorySignals": [],
  "provider": "openai",
  "access": {
    "admin": false,
    "partner": false,
    "premium": false,
    "operatorMode": false
  },
  "suggestedRoutes": {
    "concierge": "/concierge",
    "explore": "/explore",
    "beaches": "/beaches",
    "places": "/places",
    "events": "/events",
    "mobility": "/mobility",
    "checkout": "/visitor-checkout"
  },
  "debug": {
    "agentUsed": null,
    "toolsUsed": ["openai"],
    "reason": null
  }
}

Rules:
- Keep answer, listings, plan, actions, and leadDraft consistent around the same primary recommendation.
- Do not fill preferredDate or preferredTime unless the user explicitly provided a date or time.
- Do not fill pickupLocation or destination unless the user explicitly provided route details.
- Do not name a specific restaurant, bar, hotel, driver, tour provider, or business unless it appears in the supplied app data or context listing.
- Be useful even when app data is limited.
- Prefer app data when available.
- Do not invent confirmed availability, prices, official schedules, phone numbers, reservations, ferry times, laws, or guarantees.
- For ride requests, collect pickup, destination, date/time, party size, and special notes.
- For booking requests, collect name, email or phone, date/time, group size, and notes.
- For day plans, provide a realistic step-by-step sequence.
- If operatorMode is false, do not reveal admin-only routes or internal tooling.
- If operatorMode is true, provide operator intelligence instead of tourist-facing fluff.
- Memory signals should only include stable preferences worth remembering.
`.trim();
}

function buildUserPrompt(
  message: string,
  contextBundle: Record<string, unknown>
) {
  return JSON.stringify(
    {
      task: "Build a normalized VI Guide intelligence response.",
      userMessage: message,
      context: contextBundle,
    },
    null,
    2
  );
}

function extractOpenAIText(payload: any): string {
  if (typeof payload.output_text === "string") {
    return payload.output_text.trim();
  }

  const parts: string[] = [];

  const output = Array.isArray(payload.output) ? payload.output : [];

  for (const item of output) {
    const content = Array.isArray(item.content) ? item.content : [];

    for (const part of content) {
      if (typeof part.text === "string") {
        parts.push(part.text);
      }

      if (typeof part.content === "string") {
        parts.push(part.content);
      }
    }
  }

  return parts.join("\n").trim();
}

function parseJsonObjectFromText(text: string): Record<string, unknown> {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (firstBrace >= 0 && lastBrace > firstBrace) {
      const sliced = cleaned.slice(firstBrace, lastBrace + 1);
      return JSON.parse(sliced) as Record<string, unknown>;
    }

    throw new Error("OpenAI output was not valid JSON.");
  }
}

function normalizeAiResult(
  result: Record<string, unknown> | null,
  fallback: ViResponse,
  meta: {
    access: ViResponse["access"];
    agentId: string;
    islandCode: IslandCode;
    provider: string;
    elapsedMs: number;
    openAiError: string | null;
    message: string;
  }
): ViResponse {
  if (!result) {
    return fallback;
  }

  const routes = defaultRoutes(meta.islandCode);

  const intent = normalizeIntent(result.intent) || fallback.intent;
  const confidence =
    normalizeConfidence(result.confidence) || fallback.confidence;

  const listings = normalizeListings(result.listings, fallback.listings);
  const events = normalizeEvents(result.events, fallback.events);

  const leadDraft = sanitizeLeadDraftAgainstMessage(
    normalizeLeadDraft(result.leadDraft, fallback.leadDraft),
    fallback.leadDraft,
    meta.message
  );

  const syncedFallbackPlan = buildLocalPlan({
    intent,
    islandCode: meta.islandCode,
    topListing: listings[0] || fallback.listings[0] || null,
    premium: meta.access.premium,
  });

  const syncedFallbackActions = buildLocalActions({
    intent,
    islandCode: meta.islandCode,
    premium: meta.access.premium,
    admin: meta.access.admin,
    partner: meta.access.partner,
  });

  const plan = normalizePlan(result.plan, syncedFallbackPlan);
  const actions = normalizeActions(result.actions, syncedFallbackActions);

  const missingFields = inferMissingFields(intent, leadDraft);

  const debugTools = normalizeStringArray(
    isObject(result.debug) ? result.debug.toolsUsed : null,
    []
  );

  return {
    answer:
      asString(result.answer) ||
      fallback.answer ||
      "I can help you plan your Virgin Islands day.",

    intent,
    confidence,

    listings,
    events,
    plan,
    actions,

    leadDraft,
    missingFields,
    memorySignals: normalizeMemorySignals(
      result.memorySignals,
      fallback.memorySignals
    ),

    provider: meta.provider,

    access: {
      ...meta.access,
      ...(isObject(result.access) ? normalizeAccess(result.access) : {}),
    },

    suggestedRoutes: {
      ...routes,
      ...(isObject(result.suggestedRoutes)
        ? normalizeRoutes(result.suggestedRoutes, routes)
        : {}),
    },

    debug: {
      agentUsed:
        asString(isObject(result.debug) ? result.debug.agentUsed : null) ||
        meta.agentId,
      toolsUsed: debugTools.length > 0 ? debugTools : ["openai"],
      reason:
        asString(isObject(result.debug) ? result.debug.reason : null) ||
        `normalized in ${meta.elapsedMs}ms`,
    },
  };
}

function sanitizeLeadDraftAgainstMessage(
  leadDraft: ViLeadDraft,
  fallback: ViLeadDraft,
  message: string
): ViLeadDraft {
  return {
    ...leadDraft,

    preferredDate: messageMentionsDate(message)
      ? leadDraft.preferredDate || fallback.preferredDate
      : fallback.preferredDate,

    preferredTime: messageMentionsTime(message)
      ? leadDraft.preferredTime || fallback.preferredTime
      : fallback.preferredTime,

    pickupLocation: messageMentionsRouteDetail(message)
      ? leadDraft.pickupLocation || fallback.pickupLocation
      : fallback.pickupLocation,

    destination: messageMentionsRouteDetail(message)
      ? leadDraft.destination || fallback.destination
      : fallback.destination,
  };
}

function messageMentionsDate(message: string) {
  return /\b(today|tomorrow|tonight|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec|\d{1,2}[/-]\d{1,2}|\d{4}-\d{2}-\d{2})\b/i.test(
    message
  );
}

function messageMentionsTime(message: string) {
  return /\b(morning|afternoon|evening|night|noon|midnight|\d{1,2}(:\d{2})?\s?(am|pm))\b/i.test(
    message
  );
}

function messageMentionsRouteDetail(message: string) {
  return /\b(from|pickup|pick up|dropoff|drop off|destination|to the|to my|leaving from|going to)\b/i.test(
    message
  );
}

function buildLocalResponse(input: {
  message: string;
  islandCode: IslandCode;
  agentId: string;
  access: ViResponse["access"];
  appData: {
    listings: ViListing[];
    events: ViEvent[];
    memories: unknown[];
    visitorPass: unknown;
  };
  reason: string | null;
}): ViResponse {
  const { message, islandCode, agentId, access, appData, reason } = input;

  const intent = inferIntent(message, access.operatorMode);
  const routes = defaultRoutes(islandCode);
  const rankedListings = rankListings(message, intent, appData.listings);
  const listings = rankedListings.slice(0, 5);
  const events = intent === "event_discovery" ? appData.events.slice(0, 5) : [];

  const topListing = listings[0] || null;
  const leadDraft = buildLeadDraftFromMessage(message);
  const missingFields = inferMissingFields(intent, leadDraft);

  return {
    answer: buildLocalAnswer({
      message,
      islandCode,
      intent,
      topListing,
      openAiReason: reason,
    }),
    intent,
    confidence: listings.length || events.length ? "medium" : "low",
    listings,
    events,
    plan: buildLocalPlan({
      intent,
      islandCode,
      topListing,
      premium: access.premium,
    }),
    actions: buildLocalActions({
      intent,
      islandCode,
      premium: access.premium,
      admin: access.admin,
      partner: access.partner,
    }),
    leadDraft,
    missingFields,
    memorySignals: buildMemorySignalsFromMessage(message),
    provider: reason ? "local-fallback" : "local",
    access,
    suggestedRoutes: routes,
    debug: {
      agentUsed: agentId || "concierge",
      toolsUsed: ["firestore", "local-rules"],
      reason,
    },
  };
}

function inferIntent(message: string, operatorMode = false): ViIntent {
  const lower = message.toLowerCase();

  if (operatorMode) return "operator_insight";

  if (
    /\b(emergency|unsafe|danger|police|hospital|medical|hurt)\b/.test(lower)
  ) {
    return "emergency_or_safety";
  }

  if (
    /\b(cruise|ship|port|havensight|crown bay|shore excursion)\b/.test(lower)
  ) {
    return "trip_plan";
  }

  if (/\b(beach|snorkel|snorkeling|swim|bay|sand|water)\b/.test(lower)) {
    return "beach_recommendation";
  }

  if (
    /\b(ride|taxi|transport|driver|pickup|dropoff|route|mobility)\b/.test(lower)
  ) {
    return "ride_request";
  }

  if (/\b(hotel|stay|villa|room|resort|charter|accommodation)\b/.test(lower)) {
    return "stay_planning";
  }

  if (/\b(food|eat|restaurant|lunch|dinner|breakfast|drink)\b/.test(lower)) {
    return "restaurant_recommendation";
  }

  if (
    /\b(event|events|festival|music|concert|tonight|today|weekend)\b/.test(
      lower
    )
  ) {
    return "event_discovery";
  }

  if (/\b(book|booking|reserve|reservation|inquiry|lead)\b/.test(lower)) {
    return "booking_lead";
  }

  return "general_help";
}

function rankListings(
  message: string,
  intent: ViIntent,
  listings: ViListing[]
) {
  const lower = message.toLowerCase();
  const words = lower.split(/\s+/).filter((word) => word.length > 3);

  return [...listings]
    .map((listing) => {
      const haystack = `${listing.title} ${listing.address || ""} ${
        listing.areaSlug || ""
      } ${listing.category || ""}`.toLowerCase();

      let score = 0;

      for (const word of words) {
        if (haystack.includes(word)) score += 10;
      }

      if (intent === "beach_recommendation") {
        if ((listing.category || "").toLowerCase().includes("beach"))
          score += 30;
        if (haystack.includes("snorkel")) score += 10;
        if (haystack.includes("food")) score += 8;
      }

      if (intent === "restaurant_recommendation") {
        if (haystack.includes("restaurant")) score += 20;
        if (haystack.includes("food")) score += 15;
        if (haystack.includes("bar")) score += 8;
      }

      return { listing, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ listing }) => listing);
}

function buildLocalAnswer(input: {
  message: string;
  islandCode: IslandCode;
  intent: ViIntent;
  topListing: ViListing | null;
  openAiReason: string | null;
}) {
  const islandName = islandLabel(input.islandCode);
  const placeName = input.topListing?.title || "a strong nearby island stop";

  if (input.intent === "beach_recommendation" || input.intent === "trip_plan") {
    return `**Best starting point: ${placeName}.**

Here is a simple ${islandName} plan:

**1. Anchor the day around one main stop**
Start with ${placeName}. That keeps the day realistic and prevents the plan from turning into a rushed island scavenger hunt.

**2. Add food nearby**
Use a nearby food stop, beach vendor, or dining area close to the route. The best concierge move is to keep food close to your beach or return path.

**3. Plan transportation early**
Preview the route in Mobility, then decide whether you need a taxi, private ride, driver pickup, or a simple point-to-point trip.

**4. Keep a return buffer**
For cruise days, airport days, dinner reservations, or ferry timing, build in extra return time.

I can refine this by group size, pickup point, beach vibe, budget, or how much time you have.`;
  }

  if (input.intent === "ride_request" || input.intent === "route_planning") {
    return `**Ride plan**

I can help turn this into a clean transportation request.

I need pickup location, destination, preferred date and time, party size, and any special notes like luggage, child seats, ferry timing, or cruise return time.`;
  }

  if (input.intent === "stay_planning") {
    return `**Stay planning**

Start with island, trip dates, group size, budget, and the kind of stay you want: hotel, villa, resort, charter-style, or something close to beaches and restaurants.

The best stay is the one that matches your actual route, not just the prettiest listing.`;
  }

  if (input.intent === "event_discovery") {
    return `**Event planning**

Start with your main island route, then add events around it. The best flow is daytime activity first, food second, event third.

I can help match events to your island, date, group style, and transportation plan.`;
  }

  if (input.intent === "emergency_or_safety") {
    return `If this is an emergency or immediate safety issue, contact local emergency services or official authorities right now.

For non-emergency planning, I can help you choose safer routes, realistic timing, accessible stops, and simpler transportation.`;
  }

  return `I can help you plan beaches, food, rides, stays, events, local routes, and booking handoffs across the Virgin Islands.

Tell me your island, starting point, group size, date or time window, and what kind of experience you want.`;
}

function buildLocalPlan(input: {
  intent: ViIntent;
  islandCode: IslandCode;
  topListing: ViListing | null;
  premium: boolean;
}): ViPlanStep[] {
  const placeName = input.topListing?.title || "your selected stop";

  if (input.intent === "ride_request" || input.intent === "route_planning") {
    return [
      makePlanStep(
        "step-1",
        "Step 1",
        "Confirm pickup",
        "Choose the pickup location and destination.",
        "/mobility"
      ),
      makePlanStep(
        "step-2",
        "Step 2",
        "Add timing",
        "Add date, pickup time, group size, and notes.",
        "/mobility"
      ),
      makePlanStep(
        "step-3",
        "Step 3",
        "Preview route",
        "Review the route before sending a ride request.",
        "/mobility"
      ),
    ];
  }

  if (input.intent === "stay_planning") {
    return [
      makePlanStep(
        "step-1",
        "Search",
        "Compare stay types",
        "Review hotels, villas, resorts, and charter-style options.",
        "/hotels"
      ),
      makePlanStep(
        "step-2",
        "Match",
        "Match stay to route",
        "Choose based on beaches, food, transportation, and arrival point.",
        "/hotels"
      ),
      makePlanStep(
        "step-3",
        "Request",
        "Start inquiry",
        "Send a booking inquiry when the stay fits the plan.",
        "/hotels"
      ),
    ];
  }

  return [
    makePlanStep(
      "step-1",
      "Start",
      `Anchor at ${placeName}`,
      "Use one strong stop as the center of the plan.",
      input.topListing?.path || `/map?island=${input.islandCode}`
    ),
    makePlanStep(
      "step-2",
      "Food",
      "Add food nearby",
      "Keep food close to the beach, route, or return path.",
      "/places"
    ),
    makePlanStep(
      "step-3",
      "Move",
      "Plan transportation",
      "Preview pickup, destination, route, and timing.",
      "/mobility"
    ),
    makePlanStep(
      "step-4",
      "Save",
      input.premium ? "Save the plan" : "Unlock planning tools",
      input.premium
        ? "Keep the itinerary organized in Visitor Desk."
        : "Use the visitor pass when you want saved itineraries and premium tools.",
      input.premium ? "/visitor-desk" : "/visitor-checkout"
    ),
  ];
}

function makePlanStep(
  id: string,
  time: string,
  title: string,
  detail: string,
  path: string | null
): ViPlanStep {
  return {
    id,
    time,
    title,
    detail,
    locationName: null,
    path,
    estimatedCost: null,
    travelTimeMinutes: null,
  };
}

function buildLocalActions(input: {
  intent: ViIntent;
  islandCode: IslandCode;
  premium: boolean;
  admin: boolean;
  partner: boolean;
}): ViAction[] {
  const actions: ViAction[] = [];

  const add = (
    label: string,
    description: string,
    path: string,
    kind: ViActionKind,
    priority: "low" | "medium" | "high" = "medium"
  ) => {
    actions.push({ label, description, path, kind, priority });
  };

  if (input.intent === "ride_request" || input.intent === "route_planning") {
    add(
      "Preview the ride",
      "Map pickup, destination, and route.",
      "/mobility",
      "mobility",
      "high"
    );
  } else if (input.intent === "stay_planning") {
    add(
      "Compare stays",
      "Review stays that fit this trip.",
      "/hotels",
      "booking",
      "high"
    );
  } else if (input.intent === "event_discovery") {
    add(
      "Check events",
      "See events around this plan.",
      "/events",
      "general",
      "medium"
    );
  } else {
    add(
      "Show on map",
      "See locations and nearby context.",
      `/map?island=${input.islandCode}`,
      "map",
      "high"
    );
    add(
      "Plan pickup",
      "Preview transportation.",
      "/mobility",
      "mobility",
      "medium"
    );
  }

  if (input.premium) {
    add(
      "Save this plan",
      "Keep this itinerary in Visitor Desk.",
      "/visitor-desk",
      "save",
      "medium"
    );
  } else {
    add(
      "Unlock visitor pass",
      "Save plans and premium trip tools.",
      "/visitor-checkout",
      "checkout",
      "low"
    );
  }

  if (input.admin) {
    add(
      "Open admin desk",
      "Review operator workflow.",
      "/admin-desk",
      "admin",
      "low"
    );
  } else if (input.partner) {
    add(
      "Open partner desk",
      "Review partner workflow.",
      "/partner-desk",
      "partner",
      "low"
    );
  }

  return actions.slice(0, 4);
}

function buildLeadDraftFromMessage(message: string): ViLeadDraft {
  const emailMatch = message.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phone = extractPhoneNumber(message);
  const partyMatch = message.match(
    /\b(?:party of|group of|for|we are|there are)\s+(\d{1,2})\b/i
  );

  return {
    name: null,
    email: emailMatch?.[0] || null,
    phone,
    partySize: partyMatch?.[1] ? Number(partyMatch[1]) : null,
    preferredDate: extractDateHint(message),
    preferredTime: extractTimeHint(message),
    pickupLocation: extractPickupHint(message),
    destination: extractDestinationHint(message),
    budget: null,
    notes: message.slice(0, 500) || null,
  };
}

function extractPhoneNumber(message: string): string | null {
  const candidate = message.match(/[0-9][0-9().\s-]{8,}[0-9]/);

  if (!candidate) {
    return null;
  }

  const raw = candidate[0].trim();
  const digits = raw.replace(/\D/g, "");

  if (digits.length === 10) {
    return raw;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return raw;
  }

  return null;
}


function extractDateHint(message: string): string | null {
  const lower = message.toLowerCase();

  const relative = lower.match(/\b(today|tomorrow|tonight)\b/);
  if (relative) return relative[1];

  const iso = message.match(/\b\d{4}-\d{2}-\d{2}\b/);
  if (iso) return iso[0];

  const slashDate = message.match(/\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/);
  if (slashDate) return slashDate[0];

  const weekday = lower.match(
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/
  );
  if (weekday) return weekday[1];

  return null;
}

function extractTimeHint(message: string): string | null {
  const lower = message.toLowerCase();

  const exact = message.match(/\b\d{1,2}(:\d{2})?\s?(am|pm)\b/i);
  if (exact) return exact[0];

  const daypart = lower.match(
    /\b(morning|afternoon|evening|night|noon|midnight)\b/
  );
  if (daypart) return daypart[1];

  return null;
}

function extractPickupHint(message: string): string | null {
  const match = message.match(
    /\b(?:from|pickup at|pick up at|leaving from)\s+(.+?)(?=\s+\bto\b|\.|,|$)/i
  );

  return cleanRouteHint(match?.[1] || null);
}

function extractDestinationHint(message: string): string | null {
  const match = message.match(
    /\b(?:to|going to|dropoff at|drop off at|destination is)\s+(.+?)(?=\s+(?:for|with|tomorrow|today|tonight|morning|afternoon|evening|night|at|on)\b|\.|,|$)/i
  );

  return cleanRouteHint(match?.[1] || null);
}

function cleanRouteHint(value: string | null): string | null {
  if (!value) return null;

  const cleaned = value
    .replace(/\b(for|with)\s+\d+.*$/i, "")
    .replace(/^(the|a|an|my|our)\s+/i, "")
    .trim()
    .slice(0, 120);

  if (!cleaned) return null;

  const lower = cleaned.toLowerCase();

  if (
    lower === "hotel" ||
    lower === "a hotel" ||
    lower === "the hotel" ||
    lower === "my hotel" ||
    lower === "our hotel" ||
    lower === "somewhere" ||
    lower === "there"
  ) {
    return null;
  }

  return cleaned;
}

function inferMissingFields(intent: ViIntent, leadDraft: ViLeadDraft) {
  const missing = new Set<string>();

  if (intent === "ride_request" || intent === "route_planning") {
    if (!leadDraft.pickupLocation) missing.add("pickupLocation");
    if (!leadDraft.destination) missing.add("destination");
    if (!leadDraft.preferredDate) missing.add("preferredDate");
    if (!leadDraft.preferredTime) missing.add("preferredTime");
    if (!leadDraft.partySize) missing.add("partySize");
  }

  if (intent === "booking_lead" || intent === "stay_planning") {
    if (!leadDraft.email && !leadDraft.phone) missing.add("emailOrPhone");
    if (!leadDraft.partySize) missing.add("partySize");
    if (!leadDraft.preferredDate) missing.add("preferredDate");
  }

  // General trip plans should stay helpful without forcing booking fields.
  // Specific rides, stays, and booking leads collect required fields above.

  return Array.from(missing);
}

function buildMemorySignalsFromMessage(message: string): ViMemorySignal[] {
  const lower = message.toLowerCase();
  const signals: ViMemorySignal[] = [];

  const add = (key: string, value: string, confidence: ViConfidence) => {
    signals.push({
      key,
      value,
      confidence,
      shouldSave: true,
      reason: "Stable preference useful for future recommendations.",
    });
  };

  if (/\b(snorkel|snorkeling)\b/.test(lower)) {
    add("likes_snorkeling", "User showed interest in snorkeling.", "medium");
  }

  if (/\b(kids|children|family|child)\b/.test(lower)) {
    add(
      "family_friendly_preference",
      "User may prefer family-friendly recommendations.",
      "medium"
    );
  }

  if (/\b(luxury|high end|premium|private|vip)\b/.test(lower)) {
    add(
      "premium_travel_style",
      "User may prefer premium or private experiences.",
      "medium"
    );
  }

  if (/\b(budget|cheap|affordable|low cost)\b/.test(lower)) {
    add("budget_conscious", "User may prefer affordable options.", "medium");
  }

  if (
    /\b(accessible|wheelchair|mobility issue|limited mobility)\b/.test(lower)
  ) {
    add(
      "accessibility_preference",
      "User may need accessibility-aware recommendations.",
      "high"
    );
  }

  return signals;
}

function normalizeIntent(value: unknown): ViIntent {
  const allowed: ViIntent[] = [
    "general_help",
    "trip_plan",
    "beach_recommendation",
    "restaurant_recommendation",
    "ride_request",
    "stay_planning",
    "event_discovery",
    "booking_lead",
    "route_planning",
    "local_history",
    "operator_insight",
    "emergency_or_safety",
  ];

  return allowed.includes(value as ViIntent)
    ? (value as ViIntent)
    : "general_help";
}

function normalizeConfidence(value: unknown): ViConfidence {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }

  return "medium";
}

function normalizeListings(value: unknown, fallback: ViListing[]): ViListing[] {
  if (!Array.isArray(value)) return fallback;

  return value
    .map((item) => {
      if (!isObject(item)) return null;

      return {
        id: asString(item.id) || "listing",
        title: asString(item.title) || "Island stop",
        coverImage: asNullableString(item.coverImage),
        address: asNullableString(item.address),
        areaSlug: asNullableString(item.areaSlug),
        category: asNullableString(item.category),
        path: asNullableString(item.path),
      };
    })
    .filter(Boolean)
    .slice(0, 6) as ViListing[];
}

function normalizeEvents(value: unknown, fallback: ViEvent[]): ViEvent[] {
  if (!Array.isArray(value)) return fallback;

  return value
    .map((item) => {
      if (!isObject(item)) return null;

      return {
        id: asString(item.id) || "event",
        title: asString(item.title) || "Island event",
        coverImage: asNullableString(item.coverImage),
        startAt: asNullableString(item.startAt),
        path: asNullableString(item.path),
      };
    })
    .filter(Boolean)
    .slice(0, 6) as ViEvent[];
}

function normalizePlan(value: unknown, fallback: ViPlanStep[]): ViPlanStep[] {
  if (!Array.isArray(value)) return fallback;

  const normalized = value
    .map((item, index) => {
      if (!isObject(item)) return null;

      return {
        id: asNullableString(item.id) || `step-${index + 1}`,
        time: asNullableString(item.time),
        title: asString(item.title) || `Step ${index + 1}`,
        detail: asString(item.detail) || "Continue the plan.",
        locationName: asNullableString(item.locationName),
        path: asNullableString(item.path),
        estimatedCost: asNullableString(item.estimatedCost),
        travelTimeMinutes:
          typeof item.travelTimeMinutes === "number"
            ? item.travelTimeMinutes
            : null,
      };
    })
    .filter(Boolean)
    .slice(0, 8) as ViPlanStep[];

  return normalized.length ? normalized : fallback;
}

function normalizeActions(value: unknown, fallback: ViAction[]): ViAction[] {
  if (!Array.isArray(value)) return fallback;

  const allowedKinds: ViActionKind[] = [
    "map",
    "mobility",
    "ride",
    "booking",
    "checkout",
    "partner",
    "admin",
    "general",
    "call",
    "save",
    "share",
    "route",
    "upgrade",
    "learn_more",
  ];

  const normalized = value
    .map((item) => {
      if (!isObject(item)) return null;

      const rawKind = asString(item.kind) as ViActionKind;
      const kind = allowedKinds.includes(rawKind) ? rawKind : "general";

      const rawPriority = asString(item.priority);
      const priority =
        rawPriority === "low" ||
        rawPriority === "medium" ||
        rawPriority === "high"
          ? rawPriority
          : "medium";

      return {
        label: asString(item.label) || "Continue",
        description: asNullableString(item.description),
        path: asString(item.path) || "/concierge",
        kind,
        priority,
      };
    })
    .filter(Boolean)
    .slice(0, 6) as ViAction[];

  return normalized.length ? normalized : fallback;
}

function normalizeLeadDraft(
  value: unknown,
  fallback: ViLeadDraft
): ViLeadDraft {
  if (!isObject(value)) return fallback;

  return {
    name: asNullableString(value.name),
    email: asNullableString(value.email),
    phone: asNullableString(value.phone),
    partySize: typeof value.partySize === "number" ? value.partySize : null,
    preferredDate: asNullableString(value.preferredDate),
    preferredTime: asNullableString(value.preferredTime),
    pickupLocation: asNullableString(value.pickupLocation),
    destination: asNullableString(value.destination),
    budget: asNullableString(value.budget),
    notes: asNullableString(value.notes),
  };
}

function normalizeMemorySignals(
  value: unknown,
  fallback: ViMemorySignal[]
): ViMemorySignal[] {
  if (!Array.isArray(value)) return fallback;

  return value
    .map((item) => {
      if (!isObject(item)) return null;

      return {
        key: asString(item.key) || "preference",
        value: asString(item.value) || "",
        confidence: normalizeConfidence(item.confidence),
        shouldSave: Boolean(item.shouldSave),
        reason: asNullableString(item.reason),
      };
    })
    .filter((item): item is ViMemorySignal => Boolean(item && item.value))
    .slice(0, 8);
}

function normalizeAccess(value: Record<string, unknown>) {
  return {
    admin: Boolean(value.admin),
    partner: Boolean(value.partner),
    premium: Boolean(value.premium),
    operatorMode: Boolean(value.operatorMode),
  };
}

function normalizeRoutes(
  value: Record<string, unknown>,
  fallback: ViRoutes
): ViRoutes {
  return {
    concierge: asNullableString(value.concierge) || fallback.concierge,
    explore: asNullableString(value.explore) || fallback.explore,
    beaches: asNullableString(value.beaches) || fallback.beaches,
    places: asNullableString(value.places) || fallback.places,
    events: asNullableString(value.events) || fallback.events,
    mobility: asNullableString(value.mobility) || fallback.mobility,
    checkout: asNullableString(value.checkout) || fallback.checkout,
  };
}

function normalizeStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;

  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, 12);
}

function asString(value: unknown): string {
  return String(value || "").trim();
}

function asNullableString(value: unknown): string | null {
  const text = asString(value);
  return text || null;
}

function isObject(value: unknown): value is Record<string, any> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function defaultRoutes(islandCode: IslandCode): ViRoutes {
  return {
    concierge: "/concierge",
    explore: `/explore?island=${islandCode}`,
    beaches: `/beaches?island=${islandCode}`,
    places: `/places?island=${islandCode}`,
    events: `/events?island=${islandCode}`,
    mobility: `/mobility?island=${islandCode}`,
    checkout: "/visitor-checkout",
  };
}

function islandLabel(islandCode: IslandCode) {
  const labels: Record<IslandCode, string> = {
    st_thomas: "St. Thomas",
    st_john: "St. John",
    st_croix: "St. Croix",
    water_island: "Water Island",
  };

  return labels[islandCode] || "St. Thomas";
}
