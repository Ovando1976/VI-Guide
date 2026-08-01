import { NextRequest, NextResponse } from "next/server";
import { getTravelKnowledge } from "@/lib/travel-knowledge";
import { FieldValue } from "firebase-admin/firestore";

import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import type {
  ConciergeAction,
  ConciergeActionType,
  ConciergeChatRequest,
  ConciergeContext,
  ConciergeMessage,
  ConciergeReply,
} from "@/types/concierge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUDGET = {
  maxModelCalls: 1,
  maxOutputTokens: 1800,
  maxRuntimeMs: 25_000,
  externalSpendLimitCents: 0,
  maxActions: 4,
  maxHistoryMessages: 10,
} as const;

type DirectoryRecommendation = {
  type: "place" | "beach";
  name: string;
  description: string;
  category: string;
  island: string;
  estateGeoid: string | null;
  href: string;
};

const ALLOWED_ACTIONS = new Set<ConciergeActionType>([
  "select_estate",
  "set_pickup",
  "set_destination",
  "open_estate",
  "open_mobility",
]);

const completedRequests = new Map<string, ConciergeReply>();
const rateWindows = new Map<string, number[]>();

const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["answer", "suggestions", "actions"],
  properties: {
    answer: {
      type: "string",
    },
    suggestions: {
      type: "array",
      maxItems: 4,
      items: {
        type: "string",
      },
    },
    actions: {
      type: "array",
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "label", "geoid", "href", "rationale"],
        properties: {
          type: {
            type: "string",
            enum: [
              "select_estate",
              "set_pickup",
              "set_destination",
              "open_estate",
              "open_mobility",
            ],
          },
          label: {
            type: "string",
          },
          geoid: {
            type: ["string", "null"],
          },
          href: {
            type: ["string", "null"],
          },
          rationale: {
            type: "string",
          },
        },
      },
    },
  },
} as const;

const SYSTEM_INSTRUCTIONS = `
Role: You are VI Guide Concierge, an exceptional local trip-planning partner for the U.S. Virgin Islands.

Outcome: Help the traveler move from a vague desire to a practical, enjoyable island plan grounded in the live map and directory evidence supplied with the request.

Success means:
- answer the immediate question first;
- account for the selected island, estate, route endpoints, party size, luggage, and active map lens when relevant;
- recommend only named places or beaches present in directoryEvidence;
- explain why each recommendation fits this traveler, not merely what it is;
- surface one material logistics consideration when useful (island mismatch, ferry dependency, airport timing, distance, hillside access, or the need to verify current hours);
- end with the smallest useful next choice, suggestion, or reversible app action.

Taxi system context:
- VI Guide represents the regulated U.S. Virgin Islands taxi system, not private dynamic-pricing rideshare.
- Taxi fares are territory-regulated, generally destination/zone and passenger based, and may include only officially supported additions.
- Treat the app's fare engine as the sole calculation authority. Never calculate, interpolate, discount, surge, negotiate, or invent a fare in conversation.
- Describe displayed amounts as official-rate estimates pending route details and final review.
- Taxi associations, authorized drivers, dispatchers, and their fleets are first-class participants. Do not imply that VI Guide itself owns the vehicle or employs the driver.
- Never promise a particular association, driver, vehicle class, accessibility feature, or pickup until the dispatch workflow confirms it.

Personality: Warm, perceptive, polished, and locally literate. Sound like a trusted island host, not a tourism brochure. Be direct without being abrupt. Use plain language and concrete tradeoffs.

Collaboration:
- If the request is broad, make a sensible recommendation from available evidence and ask one focused follow-up only when the missing preference would materially change the plan.
- For comparisons, distinguish atmosphere, logistics, and best fit.
- For itineraries, use a realistic sequence and avoid overpacking the day.
- Clearly label uncertainty and say what should be verified locally.

Evidence and safety:
- Never invent estate GEOIDs, businesses, beaches, prices, hours, availability, travel times, ferry schedules, routes, weather, bookings, or completed actions.
- Directory evidence confirms that a record exists; it does not confirm that it is currently open.
- Do not silently move a traveler between islands. Explain the transfer implication first.
- You may propose only these reversible UI actions: select_estate, set_pickup, set_destination, open_estate, open_mobility.
- Use only estate GEOIDs present in liveAppContext. open_mobility opens a review screen; it never books.
- Never claim money was spent, a ride was booked, a message was sent, or an external party was contacted.
- Consequential real-world actions require a separate confirmation screen.

Response style: Lead with the recommendation or answer. Preserve necessary caveats and next steps, but remove generic introductions, repetition, and promotional filler. Use short paragraphs or a compact numbered plan when sequencing matters.
`;

function validIdentifier(value: unknown) {
  return typeof value === "string" && /^[a-zA-Z0-9_-]{8,100}$/.test(value);
}

function rateLimit(clientId: string) {
  const now = Date.now();
  const start = now - 60_000;

  const attempts = (rateWindows.get(clientId) ?? []).filter(
    (timestamp) => timestamp > start
  );

  if (attempts.length >= 12) return false;

  attempts.push(now);
  rateWindows.set(clientId, attempts);

  if (rateWindows.size > 1000) {
    const firstKey = rateWindows.keys().next().value as string | undefined;

    if (firstKey) rateWindows.delete(firstKey);
  }

  return true;
}

function normalizeEstate(value: unknown) {
  if (!value || typeof value !== "object") return null;

  const estate = value as {
    geoid?: unknown;
    name?: unknown;
  };

  if (typeof estate.geoid !== "string" || typeof estate.name !== "string") {
    return null;
  }

  return {
    geoid: estate.geoid.slice(0, 80),
    name: estate.name.slice(0, 120),
  };
}

function validateContext(value: unknown): ConciergeContext | null {
  if (!value || typeof value !== "object") return null;

  const context = value as ConciergeContext;

  if (
    context.island !== "stt" &&
    context.island !== "stj" &&
    context.island !== "stx"
  ) {
    return null;
  }

  const nearbyEstates = Array.isArray(context.nearbyEstates)
    ? context.nearbyEstates
        .map(normalizeEstate)
        .filter((estate): estate is NonNullable<typeof estate> =>
          Boolean(estate)
        )
        .slice(0, 8)
    : [];

  return {
    island: context.island,
    islandName: String(context.islandName || "").slice(0, 80),
    selectedEstate: normalizeEstate(context.selectedEstate),
    pickup: normalizeEstate(context.pickup),
    destination: normalizeEstate(context.destination),
    rideMode: context.rideMode,
    passengers: Math.max(1, Math.min(12, Number(context.passengers) || 1)),
    luggage: Math.max(0, Math.min(12, Number(context.luggage) || 0)),
    activeLens: String(context.activeLens || "places").slice(0, 40),
    nearbyEstates,
  };
}

function normalizeHistory(value: unknown): ConciergeMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is ConciergeMessage => {
      if (!item || typeof item !== "object") return false;

      const message = item as Partial<ConciergeMessage>;

      return (
        (message.role === "user" || message.role === "assistant") &&
        typeof message.text === "string"
      );
    })
    .slice(-BUDGET.maxHistoryMessages)
    .map((message) => ({
      id: String(message.id || crypto.randomUUID()).slice(0, 100),
      role: message.role,
      text: message.text.trim().slice(0, 3000),
      createdAt: String(message.createdAt || new Date().toISOString()),
    }));
}

function buildMobilityHref(context: ConciergeContext) {
  const parameters = new URLSearchParams({
    island: context.island,
    mode: context.rideMode,
    passengers: String(context.passengers),
    luggage: String(context.luggage),
  });

  if (context.pickup) {
    parameters.set("from", context.pickup.geoid);
  }

  if (context.destination) {
    parameters.set("to", context.destination.geoid);
  }

  return `/mobility?${parameters.toString()}`;
}

function sanitizeActions(
  value: unknown,
  context: ConciergeContext
): ConciergeAction[] {
  if (!Array.isArray(value)) return [];

  const validEstates = new Map(
    [
      context.selectedEstate,
      context.pickup,
      context.destination,
      ...context.nearbyEstates,
    ]
      .filter((estate): estate is NonNullable<typeof estate> => Boolean(estate))
      .map((estate) => [estate.geoid, estate])
  );

  const actions: ConciergeAction[] = [];

  for (const item of value.slice(0, BUDGET.maxActions)) {
    if (!item || typeof item !== "object") continue;

    const candidate = item as {
      type?: unknown;
      label?: unknown;
      geoid?: unknown;
      rationale?: unknown;
    };

    if (
      typeof candidate.type !== "string" ||
      !ALLOWED_ACTIONS.has(candidate.type as ConciergeActionType)
    ) {
      continue;
    }

    const type = candidate.type as ConciergeActionType;

    const geoid = typeof candidate.geoid === "string" ? candidate.geoid : null;

    const estate = geoid ? validEstates.get(geoid) : null;

    if (type !== "open_mobility" && !estate) {
      continue;
    }

    const href =
      type === "open_estate" && estate
        ? `/estate/${encodeURIComponent(estate.geoid)}`
        : type === "open_mobility"
        ? buildMobilityHref(context)
        : null;

    actions.push({
      id: crypto.randomUUID(),
      type,
      label:
        typeof candidate.label === "string"
          ? candidate.label.trim().slice(0, 60)
          : "Apply suggestion",
      geoid: estate?.geoid ?? null,
      href,
      rationale:
        typeof candidate.rationale === "string"
          ? candidate.rationale.trim().slice(0, 180)
          : "Suggested from the current map context.",
      risk: "local",
      requiresApproval: false,
    });
  }

  return actions;
}

function extractOutputText(payload: Record<string, unknown>) {
  if (typeof payload.output_text === "string") {
    return payload.output_text;
  }

  const output = Array.isArray(payload.output) ? payload.output : [];

  const parts: string[] = [];

  for (const item of output) {
    if (!item || typeof item !== "object") continue;

    const content = Array.isArray((item as { content?: unknown }).content)
      ? (item as { content: unknown[] }).content
      : [];

    for (const part of content) {
      if (!part || typeof part !== "object") continue;

      const text = (part as { text?: unknown }).text;

      if (typeof text === "string") {
        parts.push(text);
      }
    }
  }

  return parts.join("\n");
}

async function loadDirectoryEvidence(
  context: ConciergeContext,
  message: string
): Promise<DirectoryRecommendation[]> {
  const island = context.island.toLowerCase();
  const rows: DirectoryRecommendation[] = [
    ...getTravelKnowledge("places").map((item) => ({
      type: "place" as const,
      name: item.name,
      description: item.description.slice(0, 240),
      category: item.category || "place",
      island: item.island.toUpperCase(),
      estateGeoid: item.estateGeoid ?? null,
      href: `/places/${encodeURIComponent(item.slug)}`,
    })),
    ...getTravelKnowledge("beaches").map((item) => ({
      type: "beach" as const,
      name: item.name,
      description: item.description.slice(0, 240),
      category: "beach",
      island: item.island.toUpperCase(),
      estateGeoid: item.estateGeoid ?? null,
      href: `/beaches/${encodeURIComponent(item.slug)}`,
    })),
  ].filter((item) => item.island.toLowerCase() === island);

  const queryTokens = meaningfulTokens(message);
  const selectedGeoid = context.selectedEstate?.geoid;
  const beachIntent = /beach|swim|sand|snorkel|surf|water/.test(message.toLowerCase());

  return rows
    .map((item) => {
      const haystack = `${item.name} ${item.category} ${item.description}`.toLowerCase();
      const tokenScore = queryTokens.reduce((score, token) => score + (haystack.includes(token) ? 3 : 0), 0);
      const estateScore = selectedGeoid && item.estateGeoid === selectedGeoid ? 5 : 0;
      const typeScore = beachIntent && item.type === "beach" ? 2 : 0;
      return { item, score: tokenScore + estateScore + typeScore };
    })
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))
    .slice(0, 18)
    .map(({ item }) => item);
}

function meaningfulTokens(value: string) {
  const ignored = new Set(["about", "after", "before", "could", "from", "have", "help", "island", "looking", "need", "please", "that", "there", "this", "want", "what", "where", "with", "would"]);
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").split(" ").filter((token) => token.length > 3 && !ignored.has(token));
}

async function requestOpenAI(parameters: {
  message: string;
  context: ConciergeContext;
  history: ConciergeMessage[];
  directoryEvidence: DirectoryRecommendation[];
}) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    BUDGET.maxRuntimeMs - 1500
  );

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.6-sol",
        store: false,
        instructions: SYSTEM_INSTRUCTIONS,
        input: JSON.stringify({
          liveAppContext: parameters.context,
          recentConversation: parameters.history.map(({ role, text }) => ({
            role,
            text,
          })),
          directoryEvidence: parameters.directoryEvidence,
          userMessage: parameters.message,
        }),
        reasoning: {
          effort: "medium",
        },
        max_output_tokens: BUDGET.maxOutputTokens,
        text: {
          format: {
            type: "json_schema",
            name: "vi_guide_concierge_response",
            strict: true,
            schema: RESPONSE_SCHEMA,
          },
        },
      }),
    });

    const payload = (await response.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;

    if (!response.ok || !payload) {
      const apiError = payload?.error as { message?: unknown } | undefined;

      throw new Error(
        typeof apiError?.message === "string"
          ? apiError.message
          : `OpenAI request failed with status ${response.status}.`
      );
    }

    const outputText = extractOutputText(payload);

    if (!outputText) {
      throw new Error("The model returned no readable response.");
    }

    const parsed = JSON.parse(outputText) as {
      answer?: unknown;
      suggestions?: unknown;
      actions?: unknown;
    };

    if (typeof parsed.answer !== "string" || !parsed.answer.trim()) {
      throw new Error("The model response did not contain an answer.");
    }

    const usage = payload.usage as { output_tokens?: unknown } | undefined;

    return {
      answer: parsed.answer.trim().slice(0, 5000),
      suggestions: Array.isArray(parsed.suggestions)
        ? parsed.suggestions
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim().slice(0, 100))
            .filter(Boolean)
            .slice(0, 4)
        : [],
      actions: Array.isArray(parsed.actions)
        ? parsed.actions.filter(
            (action): action is Record<string, unknown> =>
              Boolean(action) &&
              typeof action === "object" &&
              !Array.isArray(action)
          )
        : [],
      outputTokens:
        typeof usage?.output_tokens === "number" ? usage.output_tokens : 0,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function buildLocalReply(
  message: string,
  context: ConciergeContext,
  directoryEvidence: DirectoryRecommendation[] = []
) {
  const normalized = message.toLowerCase();
  const selected = context.selectedEstate;
  const pickup = context.pickup;
  const destination = context.destination;
  const neighbor = context.nearbyEstates[0] ?? null;

  const actions: Array<Record<string, unknown>> = [];
  let answer: string;

  if (/ride|route|taxi|pickup|airport|ferry|transport/.test(normalized)) {
    if (pickup && destination) {
      answer =
        `Your current ${context.islandName} corridor is ` +
        `${pickup.name} to ${destination.name} for ` +
        `${context.passengers} ${
          context.passengers === 1 ? "passenger" : "passengers"
        }. Open the ride review to see the territory-regulated taxi estimate before submitting it.`;

      actions.push({
        type: "open_mobility",
        label: "Review this ride",
        geoid: null,
        rationale: "The pickup and destination are already set.",
      });
    } else if (selected && !pickup) {
      answer =
        `${selected.name} is selected. Set it as your ` +
        `pickup, then choose a different destination.`;

      actions.push({
        type: "set_pickup",
        label: `Use ${selected.name} as pickup`,
        geoid: selected.geoid,
        rationale: "This uses the estate currently selected on the map.",
      });
    } else if (pickup && neighbor) {
      answer =
        `${pickup.name} is set as pickup. ` +
        `${neighbor.name} is one nearby mapped destination.`;

      actions.push({
        type: "set_destination",
        label: `Set ${neighbor.name} as destination`,
        geoid: neighbor.geoid,
        rationale: "It is among the closest mapped estates.",
      });
    } else {
      answer =
        `Select an estate on the ${context.islandName} ` +
        `map and I will help turn it into a pickup or destination.`;
    }
  } else if (selected) {
    answer =
      `${selected.name} is the active estate on ` +
      `${context.islandName}. I can open its profile, ` +
      `use it as a trip endpoint, or compare it with nearby estates.`;

    actions.push(
      {
        type: "open_estate",
        label: `Open ${selected.name}`,
        geoid: selected.geoid,
        rationale: "View the estate record and its local context.",
      },
      {
        type: "set_pickup",
        label: "Use as pickup",
        geoid: selected.geoid,
        rationale: "Prepare a route without creating a booking.",
      }
    );
  } else {
    const names = directoryEvidence.slice(0, 3).map((item) => item.name);
    answer = names.length
      ? `For ${context.islandName}, a few directory-backed starting points are ${names.join(", ")}. Tell me whether you want food, beach time, history, or the easiest taxi logistics and I’ll narrow the plan.`
      : `I am ready to help explore ${context.islandName}. Select an estate or ask about regulated taxi transportation, nearby places, beaches, stays, or history.`;
  }

  return {
    answer,
    suggestions: [
      "Help me plan a ride",
      selected
        ? `What is near ${selected.name}?`
        : `What is nearby on ${context.islandName}?`,
      "Show me a historic place",
    ],
    actions,
    outputTokens: 0,
  };
}

async function loadDurableHistory(sessionId: string, clientId: string) {
  if (!hasFirebaseAdminConfiguration()) return [];

  try {
    const database = getAdminDb();
    const sessionReference = database
      .collection("conciergeSessions")
      .doc(sessionId);

    const sessionSnapshot = await sessionReference.get();

    if (
      sessionSnapshot.exists &&
      sessionSnapshot.data()?.clientId !== clientId
    ) {
      return [];
    }

    const messagesSnapshot = await sessionReference
      .collection("messages")
      .orderBy("createdAt", "desc")
      .limit(BUDGET.maxHistoryMessages)
      .get();

    return messagesSnapshot.docs
      .map((document) => {
        const data = document.data();

        return {
          id: document.id,
          role: data.role === "assistant" ? "assistant" : "user",
          text: String(data.text || ""),
          createdAt:
            data.createdAt?.toDate?.()?.toISOString?.() ||
            new Date().toISOString(),
        } satisfies ConciergeMessage;
      })
      .reverse();
  } catch (error) {
    console.warn("Unable to load durable concierge history.", error);

    return [];
  }
}

async function persistReply(parameters: {
  request: ConciergeChatRequest;
  reply: ConciergeReply;
}) {
  if (!hasFirebaseAdminConfiguration()) return false;

  try {
    const database = getAdminDb();

    const sessionReference = database
      .collection("conciergeSessions")
      .doc(parameters.request.sessionId);

    const runReference = database
      .collection("agentRuns")
      .doc(parameters.reply.runId);

    const requestReference = database
      .collection("conciergeRequests")
      .doc(
        `${parameters.request.clientId}_${parameters.request.idempotencyKey}`
          .replace(/[^a-zA-Z0-9_-]/g, "")
          .slice(0, 180)
      );

    const userMessageReference = sessionReference.collection("messages").doc();

    const assistantMessageReference = sessionReference
      .collection("messages")
      .doc();

    const eventReference = database.collection("agentEvents").doc();

    const batch = database.batch();

    batch.set(
      sessionReference,
      {
        clientId: parameters.request.clientId,
        context: parameters.request.context,
        lastMessage: parameters.reply.message.text.slice(0, 240),
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      },
      {
        merge: true,
      }
    );

    batch.set(userMessageReference, {
      role: "user",
      text: parameters.request.message,
      runId: parameters.reply.runId,
      createdAt: FieldValue.serverTimestamp(),
    });

    batch.set(assistantMessageReference, {
      role: "assistant",
      text: parameters.reply.message.text,
      actions: parameters.reply.actions,
      provider: parameters.reply.provider,
      runId: parameters.reply.runId,
      createdAt: FieldValue.serverTimestamp(),
    });

    batch.set(runReference, {
      sessionId: parameters.request.sessionId,
      clientId: parameters.request.clientId,
      objective: parameters.request.message,
      context: parameters.request.context,
      budget: parameters.reply.budget,
      provider: parameters.reply.provider,
      status: "completed",
      createdAt: FieldValue.serverTimestamp(),
      completedAt: FieldValue.serverTimestamp(),
    });

    batch.set(requestReference, {
      status: "completed",
      runId: parameters.reply.runId,
      reply: parameters.reply,
      createdAt: FieldValue.serverTimestamp(),
      completedAt: FieldValue.serverTimestamp(),
    });

    batch.set(eventReference, {
      runId: parameters.reply.runId,
      type: "run_completed",
      details: {
        provider: parameters.reply.provider,
        budget: parameters.reply.budget,
        actions: parameters.reply.actions.map((action) => ({
          type: action.type,
          geoid: action.geoid,
          risk: action.risk,
        })),
      },
      createdAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return true;
  } catch (error) {
    console.warn("Unable to persist concierge session.", error);

    return false;
  }
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const runId = crypto.randomUUID();

  try {
    const body = (await request.json().catch(() => null)) as Partial<ConciergeChatRequest> | null;

    if (!body) {
      return NextResponse.json(
        { error: "The concierge request body is invalid." },
        { status: 400 },
      );
    }

    if (
      !validIdentifier(body.sessionId) ||
      !validIdentifier(body.clientId) ||
      !validIdentifier(body.idempotencyKey)
    ) {
      return NextResponse.json(
        {
          error: "The concierge session identifiers are invalid.",
        },
        {
          status: 400,
        }
      );
    }

    const sessionId = body.sessionId as string;
    const clientId = body.clientId as string;
    const idempotencyKey = body.idempotencyKey as string;

    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!message || message.length > 3000) {
      return NextResponse.json(
        {
          error: "Enter a message between 1 and 3,000 characters.",
        },
        {
          status: 400,
        }
      );
    }

    const context = validateContext(body.context);

    if (!context) {
      return NextResponse.json(
        {
          error: "The current Explorer context is invalid.",
        },
        {
          status: 400,
        }
      );
    }

    if (!rateLimit(clientId)) {
      return NextResponse.json(
        {
          error:
            "The concierge is receiving too many requests. Try again shortly.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": "30",
          },
        }
      );
    }

    const requestKey = `${clientId}_${idempotencyKey}`;

    const cached = completedRequests.get(requestKey);

    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          "X-Concierge-Idempotent-Replay": "true",
        },
      });
    }

    const durableHistory = await loadDurableHistory(sessionId, clientId);

    const history = durableHistory.length
      ? durableHistory
      : normalizeHistory(body.recentMessages);

    const directoryEvidence = await loadDirectoryEvidence(context, message);

    let provider: ConciergeReply["provider"] = "local";

    let result = buildLocalReply(message, context, directoryEvidence);

    let modelCallsUsed = 0;

    if (process.env.OPENAI_API_KEY) {
      try {
        modelCallsUsed = 1;

        result = await requestOpenAI({
          message,
          context,
          history,
          directoryEvidence,
        });

        provider = "openai";
      } catch (error) {
        console.error(
          "OpenAI concierge request failed. Using local fallback.",
          error
        );
      }
    }

    const reply: ConciergeReply = {
      runId,
      sessionId,
      message: {
        id: crypto.randomUUID(),
        role: "assistant",
        text: result.answer,
        createdAt: new Date().toISOString(),
      },
      suggestions: result.suggestions.slice(0, 4),
      actions: sanitizeActions(result.actions, context),
      budget: {
        maxModelCalls: BUDGET.maxModelCalls,
        modelCallsUsed,
        maxOutputTokens: BUDGET.maxOutputTokens,
        outputTokensUsed: result.outputTokens,
        maxRuntimeMs: BUDGET.maxRuntimeMs,
        runtimeMs: Date.now() - startedAt,
        externalSpendLimitCents: BUDGET.externalSpendLimitCents,
        externalSpendCents: 0,
      },
      provider,
      memoryStatus: "session-only",
    };

    const persisted = await persistReply({
      request: {
        sessionId,
        clientId,
        idempotencyKey,
        message,
        context,
        recentMessages: history,
      },
      reply,
    });

    if (persisted) {
      reply.memoryStatus = "durable";
    }

    completedRequests.set(requestKey, reply);

    if (completedRequests.size > 200) {
      const firstKey = completedRequests.keys().next().value as
        | string
        | undefined;

      if (firstKey) {
        completedRequests.delete(firstKey);
      }
    }

    return NextResponse.json(reply, {
      headers: {
        "Cache-Control": "no-store",
        "X-Concierge-Run-Id": runId,
      },
    });
  } catch (error) {
    console.error("Concierge request failed.", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The concierge could not complete this request.",
      },
      {
        status: 500,
      }
    );
  }
}
