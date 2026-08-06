import { NextRequest, NextResponse } from "next/server";

import { buildGroundedAnswer } from "@/lib/intelligence/grounded-answer";
import {
  bearerTokenFromAuthorization,
  bindVerifiedIntelligenceIdentity,
} from "@/lib/intelligence/identity";
import { refineIntelligenceResponse } from "@/lib/intelligence/model-refinement";
import { runRegisteredIntelligenceOrchestrator } from "@/lib/intelligence/registered-orchestrator";
import {
  beginIntelligenceRun,
  completeIntelligenceRun,
  failIntelligenceRun,
} from "@/lib/intelligence/telemetry";
import {
  getAdminAuth,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import type {
  IntelligenceContext,
  IntelligenceRequest,
  IntelligenceIsland,
  IntelligencePage,
} from "@/types/intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ISLANDS: readonly IntelligenceIsland[] = ["stt", "stj", "stx"];
const PAGES: readonly IntelligencePage[] = [
  "home",
  "explore",
  "map",
  "heritage",
  "mobility",
  "stays",
  "beaches",
  "fishing",
  "community",
  "concierge",
  "cruises",
  "planner",
  "profile",
  "today",
  "search",
  "unknown",
];

class IntelligenceAuthenticationError extends Error {}

function validIdentifier(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9_-]{8,120}$/.test(value);
}

function isIsland(value: unknown): value is IntelligenceIsland {
  return typeof value === "string" && ISLANDS.includes(value as IntelligenceIsland);
}

function isPage(value: unknown): value is IntelligencePage {
  return typeof value === "string" && PAGES.includes(value as IntelligencePage);
}

function normalizeStringArray(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, limit).map(String);
}

function normalizeContext(value: unknown): IntelligenceContext | null {
  if (!value || typeof value !== "object") return null;

  const context = value as Partial<IntelligenceContext>;
  const sessionId = context.sessionId;
  const island = context.island;
  const page = context.page;
  const party = context.party;
  const preferences = context.preferences;

  if (!validIdentifier(sessionId) || !isIsland(island) || !isPage(page)) {
    return null;
  }

  const normalized: IntelligenceContext = {
    sessionId,
    page,
    island,
    now: typeof context.now === "string" ? context.now : new Date().toISOString(),
    timezone: "America/St_Thomas",
    party: {
      adults: Math.max(1, Number(party?.adults) || 1),
      children: Math.max(0, Number(party?.children) || 0),
      accessibilityNeeds: normalizeStringArray(party?.accessibilityNeeds, 12),
    },
    preferences: {
      interests: normalizeStringArray(preferences?.interests, 24),
      ...(preferences?.pace ? { pace: preferences.pace } : {}),
      ...(preferences?.budget ? { budget: preferences.budget } : {}),
      food: normalizeStringArray(preferences?.food, 20),
      avoid: normalizeStringArray(preferences?.avoid, 20),
    },
    memory: context.memory && typeof context.memory === "object" ? context.memory : {},
  };

  if (context.currentLocation) normalized.currentLocation = context.currentLocation;
  if (context.selectedPlace) normalized.selectedPlace = context.selectedPlace;
  if (context.pickup) normalized.pickup = context.pickup;
  if (context.destination) normalized.destination = context.destination;

  return normalized;
}

async function verifiedUserId(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization) return undefined;
  const token = bearerTokenFromAuthorization(authorization);
  if (!token) throw new IntelligenceAuthenticationError("Invalid authorization header.");
  if (!hasFirebaseAdminConfiguration()) {
    throw new IntelligenceAuthenticationError(
      "Authenticated intelligence is not configured.",
    );
  }
  try {
    return (await getAdminAuth().verifyIdToken(token)).uid;
  } catch {
    throw new IntelligenceAuthenticationError("Invalid traveler session.");
  }
}

export async function POST(request: NextRequest) {
  let run: Awaited<ReturnType<typeof beginIntelligenceRun>> | null = null;

  try {
    const payload = (await request.json().catch(() => null)) as Partial<IntelligenceRequest> | null;
    if (!payload) {
      return NextResponse.json({ error: "The intelligence request body is invalid." }, { status: 400 });
    }

    const message = typeof payload.message === "string" ? payload.message.trim() : "";
    const unsafeContext = normalizeContext(payload.context);
    if (!message || message.length > 4_000 || !unsafeContext) {
      return NextResponse.json({ error: "The intelligence request is invalid." }, { status: 400 });
    }

    const userId = await verifiedUserId(request);
    const context = bindVerifiedIntelligenceIdentity(unsafeContext, userId);
    const normalizedRequest: IntelligenceRequest = {
      message,
      context,
      ...(Array.isArray(payload.capabilities)
        ? { capabilities: payload.capabilities.slice(0, 12) }
        : {}),
    };

    run = await beginIntelligenceRun(normalizedRequest);
    const engineResult = await runRegisteredIntelligenceOrchestrator(normalizedRequest);
    const groundedResult = {
      ...engineResult,
      answer: buildGroundedAnswer(message, engineResult),
    };
    const result = await refineIntelligenceResponse(normalizedRequest, groundedResult);
    await completeIntelligenceRun(run, result);

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
        "X-VI-Intelligence-Run": run.id,
        "X-VI-Intelligence-Intent": result.intent,
        "X-VI-Intelligence-Confidence": result.confidence,
        "X-VI-Intelligence-Workflow": result.orchestration?.status ?? "legacy",
        "X-VI-Intelligence-Identity": userId ? "authenticated" : "anonymous",
        "X-VI-Intelligence-Source": process.env.OPENAI_API_KEY
          ? "vi-guide-grounded-model"
          : "vi-guide-knowledge-index",
      },
    });
  } catch (error) {
    if (error instanceof IntelligenceAuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (run) await failIntelligenceRun(run, error);
    console.error("VI Guide intelligence request failed.", error);
    return NextResponse.json(
      { error: "The VI Guide intelligence engine could not respond." },
      { status: 500 },
    );
  }
}
