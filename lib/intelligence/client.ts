"use client";

import { dispatchIntelligenceResponseMapFocus } from "@/lib/intelligence/map-focus-events";
import type {
  IntelligenceContext,
  IntelligenceMemory,
  IntelligencePage,
  IntelligenceRequest,
  IntelligenceResponse,
} from "@/types/intelligence";

const SESSION_KEY = "vi-guide.intelligence.session";
const MEMORY_KEY = "vi-guide.intelligence.memory";
const MEMORY_UPDATED_AT_KEY = "vi-guide.intelligence.memory-updated-at";
const CONTEXT_KEY = "vi-guide.intelligence.context";
export const INTELLIGENCE_MEMORY_UPDATED_EVENT = "vi-guide-intelligence-memory";

function createId() {
  const random =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID().replace(/-/g, "")
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  return `intelligence_${random}`;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getIntelligenceSessionId() {
  if (typeof window === "undefined") return "intelligence_server";
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const sessionId = createId();
  window.localStorage.setItem(SESSION_KEY, sessionId);
  return sessionId;
}

export function getIntelligenceMemory(): IntelligenceMemory {
  return readJson<IntelligenceMemory>(MEMORY_KEY, {});
}

export function getIntelligenceMemoryUpdatedAt() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(MEMORY_UPDATED_AT_KEY) ?? "";
}

export function replaceIntelligenceMemory(memory: IntelligenceMemory) {
  if (typeof window === "undefined") return memory;
  writeJson(MEMORY_KEY, memory);
  window.localStorage.setItem(MEMORY_UPDATED_AT_KEY, new Date().toISOString());
  window.dispatchEvent(
    new CustomEvent(INTELLIGENCE_MEMORY_UPDATED_EVENT, { detail: memory }),
  );
  return memory;
}

export function patchIntelligenceMemory(patch: IntelligenceMemory) {
  const current = getIntelligenceMemory();
  const next: IntelligenceMemory = {
    ...current,
    ...patch,
    party: { ...current.party, ...patch.party },
    preferences: { ...current.preferences, ...patch.preferences },
    cruise: { ...current.cruise, ...patch.cruise },
    recentPlaceIds: patch.recentPlaceIds ?? current.recentPlaceIds,
    savedPlaceIds: patch.savedPlaceIds ?? current.savedPlaceIds,
  };
  return replaceIntelligenceMemory(next);
}

export function feedIntelligenceContext(
  page: IntelligencePage,
  patch: Partial<IntelligenceContext>,
) {
  const current = readJson<Partial<IntelligenceContext>>(CONTEXT_KEY, {});
  const memory = getIntelligenceMemory();
  const next: Partial<IntelligenceContext> = {
    ...current,
    ...patch,
    page,
    sessionId: getIntelligenceSessionId(),
    now: new Date().toISOString(),
    timezone: "America/St_Thomas",
    memory,
    party: {
      adults: patch.party?.adults ?? current.party?.adults ?? memory.party?.adults ?? 1,
      children:
        patch.party?.children ?? current.party?.children ?? memory.party?.children ?? 0,
      accessibilityNeeds:
        patch.party?.accessibilityNeeds ??
        current.party?.accessibilityNeeds ??
        memory.party?.accessibilityNeeds ??
        [],
    },
    preferences: {
      interests:
        patch.preferences?.interests ??
        current.preferences?.interests ??
        memory.preferences?.interests ??
        [],
      pace:
        patch.preferences?.pace ?? current.preferences?.pace ?? memory.preferences?.pace,
      budget:
        patch.preferences?.budget ?? current.preferences?.budget ?? memory.preferences?.budget,
      food: patch.preferences?.food ?? current.preferences?.food ?? memory.preferences?.food,
      avoid:
        patch.preferences?.avoid ?? current.preferences?.avoid ?? memory.preferences?.avoid,
    },
  };
  writeJson(CONTEXT_KEY, next);
  window.dispatchEvent(new CustomEvent("vi-guide-intelligence-context", { detail: next }));
  return next;
}

export function getIntelligenceContext(): Partial<IntelligenceContext> {
  return readJson<Partial<IntelligenceContext>>(CONTEXT_KEY, {});
}

export async function askViIntelligence(
  message: string,
  overrides: Partial<IntelligenceContext> = {},
  capabilities?: IntelligenceRequest["capabilities"],
): Promise<IntelligenceResponse> {
  const stored = getIntelligenceContext();
  const memory = getIntelligenceMemory();
  const context = {
    ...stored,
    ...overrides,
    sessionId: getIntelligenceSessionId(),
    now: new Date().toISOString(),
    timezone: "America/St_Thomas" as const,
    memory,
    island: overrides.island ?? stored.island ?? memory.preferredIsland ?? "stt",
    page: overrides.page ?? stored.page ?? "unknown",
    party: {
      adults: overrides.party?.adults ?? stored.party?.adults ?? memory.party?.adults ?? 1,
      children:
        overrides.party?.children ?? stored.party?.children ?? memory.party?.children ?? 0,
      accessibilityNeeds:
        overrides.party?.accessibilityNeeds ??
        stored.party?.accessibilityNeeds ??
        memory.party?.accessibilityNeeds ??
        [],
    },
    preferences: {
      interests:
        overrides.preferences?.interests ??
        stored.preferences?.interests ??
        memory.preferences?.interests ??
        [],
      pace:
        overrides.preferences?.pace ??
        stored.preferences?.pace ??
        memory.preferences?.pace ??
        "balanced",
      budget:
        overrides.preferences?.budget ??
        stored.preferences?.budget ??
        memory.preferences?.budget ??
        "moderate",
      food:
        overrides.preferences?.food ??
        stored.preferences?.food ??
        memory.preferences?.food ??
        [],
      avoid:
        overrides.preferences?.avoid ??
        stored.preferences?.avoid ??
        memory.preferences?.avoid ??
        [],
    },
  } satisfies IntelligenceContext;

  const response = await fetch("/api/intelligence", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, context, capabilities }),
  });
  const payload = (await response.json().catch(() => null)) as
    | IntelligenceResponse
    | { error?: string }
    | null;

  if (!response.ok || !payload || !("runId" in payload)) {
    throw new Error(
      payload && "error" in payload
        ? payload.error
        : "VI Guide Intelligence could not respond.",
    );
  }

  patchIntelligenceMemory(payload.memoryPatch);
  feedIntelligenceContext(context.page, payload.context);
  dispatchIntelligenceResponseMapFocus(payload);
  return payload;
}
