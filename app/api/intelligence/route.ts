import { NextRequest, NextResponse } from "next/server";

import { runIntelligenceEngine } from "@/lib/intelligence/engine";
import type {
  IntelligenceContext,
  IntelligenceRequest,
  IntelligenceIsland,
  IntelligencePage,
} from "@/types/intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ISLANDS = new Set<IntelligenceIsland>(["stt", "stj", "stx"]);
const PAGES = new Set<IntelligencePage>([
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
]);

function validIdentifier(value: unknown) {
  return typeof value === "string" && /^[a-zA-Z0-9_-]{8,120}$/.test(value);
}

function normalizeContext(value: unknown): IntelligenceContext | null {
  if (!value || typeof value !== "object") return null;
  const context = value as Partial<IntelligenceContext>;
  if (!validIdentifier(context.sessionId)) return null;
  if (!context.island || !ISLANDS.has(context.island)) return null;
  if (!context.page || !PAGES.has(context.page)) return null;

  return {
    sessionId: context.sessionId,
    ...(typeof context.userId === "string" ? { userId: context.userId.slice(0, 160) } : {}),
    page: context.page,
    island: context.island,
    now: typeof context.now === "string" ? context.now : new Date().toISOString(),
    timezone: "America/St_Thomas",
    ...(context.currentLocation ? { currentLocation: context.currentLocation } : {}),
    ...(context.selectedPlace ? { selectedPlace: context.selectedPlace } : {}),
    ...(context.pickup ? { pickup: context.pickup } : {}),
    ...(context.destination ? { destination: context.destination } : {}),
    party: {
      adults: Math.max(1, Number(context.party?.adults) || 1),
      children: Math.max(0, Number(context.party?.children) || 0),
      accessibilityNeeds: Array.isArray(context.party?.accessibilityNeeds)
        ? context.party.accessibilityNeeds.slice(0, 12).map(String)
        : [],
    },
    preferences: {
      interests: Array.isArray(context.preferences?.interests)
        ? context.preferences.interests.slice(0, 24).map(String)
        : [],
      pace: context.preferences?.pace,
      budget: context.preferences?.budget,
      food: Array.isArray(context.preferences?.food)
        ? context.preferences.food.slice(0, 20).map(String)
        : [],
      avoid: Array.isArray(context.preferences?.avoid)
        ? context.preferences.avoid.slice(0, 20).map(String)
        : [],
    },
    memory: context.memory && typeof context.memory === "object" ? context.memory : {},
  };
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as Partial<IntelligenceRequest>;
    const message = typeof payload.message === "string" ? payload.message.trim() : "";
    const context = normalizeContext(payload.context);

    if (!message || message.length > 4_000 || !context) {
      return NextResponse.json(
        { error: "The intelligence request is invalid." },
        { status: 400 },
      );
    }

    const result = runIntelligenceEngine({
      message,
      context,
      capabilities: Array.isArray(payload.capabilities)
        ? payload.capabilities.slice(0, 12)
        : undefined,
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
        "X-VI-Intelligence-Intent": result.intent,
        "X-VI-Intelligence-Confidence": result.confidence,
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
