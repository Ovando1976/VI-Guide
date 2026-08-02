import { NextRequest, NextResponse } from "next/server";

import { runIntelligenceEngine } from "@/lib/intelligence/engine";
import { buildGroundedAnswer } from "@/lib/intelligence/grounded-answer";
import { buildIntelligencePresentation } from "@/lib/intelligence/presentation";
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
  "search",
  "unknown",
];

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

  if (typeof context.userId === "string") {
    normalized.userId = context.userId.slice(0, 160);
  }
  if (context.currentLocation) normalized.currentLocation = context.currentLocation;
  if (context.selectedPlace) normalized.selectedPlace = context.selectedPlace;
  if (context.pickup) normalized.pickup = context.pickup;
  if (context.destination) normalized.destination = context.destination;

  return normalized;
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json().catch(() => null)) as Partial<IntelligenceRequest> | null;
    if (!payload) {
      return NextResponse.json(
        { error: "The intelligence request body is invalid." },
        { status: 400 },
      );
    }
    const message = typeof payload.message === "string" ? payload.message.trim() : "";
    const context = normalizeContext(payload.context);

    if (!message || message.length > 4_000 || !context) {
      return NextResponse.json(
        { error: "The intelligence request is invalid." },
        { status: 400 },
      );
    }

    const engineResult = runIntelligenceEngine({
      message,
      context,
      ...(Array.isArray(payload.capabilities)
        ? { capabilities: payload.capabilities.slice(0, 12) }
        : {}),
    });
    const presentation = buildIntelligencePresentation(
      engineResult.intent,
      engineResult.context,
      engineResult.plan,
      engineResult.recommendations,
    );
    const result = {
      ...engineResult,
      ...presentation,
      answer: buildGroundedAnswer(message, engineResult),
    };

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
        "X-VI-Intelligence-Intent": result.intent,
        "X-VI-Intelligence-Confidence": result.confidence,
        "X-VI-Intelligence-Source": "vi-guide-knowledge-index",
      },
    });
  } catch (error) {
    console.error("VI Guide intelligence request failed.", error);
    return NextResponse.json(
      { error: "The VI Guide intelligence engine could not respond." },
      { status: 500 },
    );
  }
}
