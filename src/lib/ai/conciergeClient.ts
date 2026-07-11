// src/lib/ai/conciergeClient.ts

import { getCurrentIdToken } from "../firebase/firebaseClient";
import type {
  BeachDoc,
  EventDoc,
  IslandCode,
  PlaceDoc,
  UserProfile,
} from "../../types";

export type ConciergeListing = BeachDoc | PlaceDoc;

export type ConciergeAgentId =
  | "concierge"
  | "operator"
  | "trip_planner"
  | "mobility"
  | "booking"
  | "local_guide"
  | "history"
  | "safety"
  | string;

export type ConciergeIntent =
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

export type ConciergeMessageRole = "user" | "model" | "system";

export type ConciergeHistoryMessage = {
  role: ConciergeMessageRole;
  text: string;
  createdAt?: string;
};

export type ConciergeUserLocation = {
  lat: number;
  lng: number;
};

export type ConciergePlanStep = {
  id?: string;
  time?: string;
  title: string;
  detail: string;
  locationName?: string;
  path?: string;
  estimatedCost?: string;
  travelTimeMinutes?: number;
};

export type ConciergeActionKind =
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

export type ConciergeAction = {
  label: string;
  description?: string;
  path: string;
  kind?: ConciergeActionKind;
  priority?: "low" | "medium" | "high";
};

export type ConciergeLeadDraft = {
  name?: string;
  email?: string;
  phone?: string;
  partySize?: number;
  preferredDate?: string;
  preferredTime?: string;
  pickupLocation?: string;
  destination?: string;
  budget?: string;
  notes?: string;
};

export type ConciergeMemorySignal = {
  key: string;
  value: string;
  confidence: "low" | "medium" | "high";
  shouldSave: boolean;
  reason?: string;
};

export type ConciergeAccessState = {
  admin?: boolean;
  partner?: boolean;
  premium?: boolean;
  operatorMode?: boolean;
};

export type ConciergeRequest = {
  message: string;
  islandCode?: IslandCode;
  agentId?: ConciergeAgentId;
  sessionId?: string;
  userId?: string | null;
  userProfile?: UserProfile | null;
  contextListing?: ConciergeListing | null;
  userLocation?: ConciergeUserLocation | null;
  history?: ConciergeHistoryMessage[];
};

export type ConciergeResponse = {
  answer: string;
  intent?: ConciergeIntent;
  confidence?: "low" | "medium" | "high";

  listings?: ConciergeListing[];
  events?: EventDoc[];
  plan?: ConciergePlanStep[];
  actions?: ConciergeAction[];

  leadDraft?: ConciergeLeadDraft;
  missingFields?: string[];
  memorySignals?: ConciergeMemorySignal[];

  provider?: string;
  access?: ConciergeAccessState;
  suggestedRoutes?: Record<string, string | null>;

  debug?: {
    agentUsed?: string;
    toolsUsed?: string[];
    reason?: string;
  };
};

export type ConciergeClientOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
};

const functionsBaseUrl =
  import.meta.env.VITE_PAYMENTS_API_BASE_URL ||
  "https://us-central1-usvi-news.cloudfunctions.net";

/**
 * For now this defaults to your existing Cloud Function: aiConcierge.
 *
 * Later, when we create the true orchestration endpoint, you can set:
 *
 * VITE_VI_INTELLIGENCE_FUNCTION_NAME=viIntelligence
 *
 * or:
 *
 * VITE_VI_INTELLIGENCE_ENDPOINT=https://your-url/viIntelligence
 */
const intelligenceFunctionName =
  import.meta.env.VITE_VI_INTELLIGENCE_FUNCTION_NAME ||
  import.meta.env.VITE_AI_CONCIERGE_FUNCTION_NAME ||
  "aiConcierge";

function getEndpoint() {
  return (
    import.meta.env.VITE_VI_INTELLIGENCE_ENDPOINT ||
    import.meta.env.VITE_AI_CONCIERGE_ENDPOINT ||
    `${functionsBaseUrl}/${intelligenceFunctionName}`
  );
}

export async function askAiConcierge(
  input: ConciergeRequest,
  options: ConciergeClientOptions = {},
): Promise<ConciergeResponse> {
  const endpoint = getEndpoint();
  const token = await getCurrentIdToken().catch(() => "");

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 45_000;

  const timeout = window.setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  const abortFromParent = () => controller.abort();

  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort();
    } else {
      options.signal.addEventListener("abort", abortFromParent);
    }
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: controller.signal,
      body: JSON.stringify({
        message: input.message,
        islandCode: input.islandCode || "st_thomas",
        agentId: input.agentId || "concierge",
        sessionId: input.sessionId || null,
        userId: input.userId || null,
        userProfile: input.userProfile || null,
        contextListing: input.contextListing || null,
        userLocation: input.userLocation || null,
        history: input.history || [],
        timestamp: new Date().toISOString(),
        client: {
          source: "vi-guide-web",
          gateway: "conciergeClient",
        },
      }),
    });

    const raw = await response.text();
    const data = parseJsonResponse(raw);

    if (!response.ok) {
      const detail =
        data.message ||
        data.error ||
        data.answer ||
        `HTTP ${response.status}`;

      throw new Error(`AI concierge failed: ${detail}`);
    }

    return normalizeConciergeResponse(data);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("AI concierge request timed out.");
    }

    throw error;
  } finally {
    window.clearTimeout(timeout);

    if (options.signal) {
      options.signal.removeEventListener("abort", abortFromParent);
    }
  }
}

export async function askViIntelligence(
  input: ConciergeRequest,
  options: ConciergeClientOptions = {},
): Promise<ConciergeResponse> {
  return askAiConcierge(input, options);
}

function parseJsonResponse(raw: string): Record<string, any> {
  if (!raw) return {};

  try {
    return JSON.parse(raw) as Record<string, any>;
  } catch {
    return {
      error: raw,
    };
  }
}

function normalizeConciergeResponse(data: Record<string, any>): ConciergeResponse {
  return {
    answer:
      typeof data.answer === "string" && data.answer.trim()
        ? data.answer
        : "I’m here, but I did not receive a complete response from the VI Guide intelligence engine.",

    intent: data.intent || "general_help",
    confidence: data.confidence || "medium",

    listings: Array.isArray(data.listings) ? data.listings : [],
    events: Array.isArray(data.events) ? data.events : [],
    plan: Array.isArray(data.plan) ? data.plan : [],
    actions: Array.isArray(data.actions) ? data.actions : [],

    leadDraft: data.leadDraft || undefined,
    missingFields: Array.isArray(data.missingFields) ? data.missingFields : [],
    memorySignals: Array.isArray(data.memorySignals) ? data.memorySignals : [],

    provider: data.provider || "VI Guide Intelligence",
    access: data.access || {},
    suggestedRoutes: data.suggestedRoutes || {},

    debug: data.debug,
  };
}