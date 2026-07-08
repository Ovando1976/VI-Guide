import { getCurrentIdToken } from "../firebase/firebaseClient";
import type { BeachDoc, EventDoc, IslandCode, PlaceDoc } from "../../types";

export type ConciergeListing = BeachDoc | PlaceDoc;

export type ConciergePlanStep = {
  time?: string;
  title: string;
  detail: string;
  path?: string;
};

export type ConciergeAction = {
  label: string;
  description?: string;
  path: string;
  kind?:
    | "map"
    | "mobility"
    | "booking"
    | "checkout"
    | "partner"
    | "admin"
    | "general";
};

export type ConciergeResponse = {
  answer: string;
  listings?: ConciergeListing[];
  events?: EventDoc[];
  plan?: ConciergePlanStep[];
  actions?: ConciergeAction[];
  provider?: string;
  access?: {
    admin?: boolean;
    partner?: boolean;
    premium?: boolean;
    operatorMode?: boolean;
  };
  suggestedRoutes?: Record<string, string | null>;
};

const functionsBaseUrl =
  import.meta.env.VITE_PAYMENTS_API_BASE_URL ||
  "https://us-central1-usvi-news.cloudfunctions.net";

export async function askAiConcierge(input: {
  message: string;
  islandCode?: IslandCode;
  agentId?: string;
  contextListing?: ConciergeListing | null;
  userLocation?: { lat: number; lng: number } | null;
}) {
  const token = await getCurrentIdToken().catch(() => "");

  const response = await fetch(`${functionsBaseUrl}/aiConcierge`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      message: input.message,
      islandCode: input.islandCode || "st_thomas",
      agentId: input.agentId || "concierge",
      contextListing: input.contextListing || null,
      userLocation: input.userLocation || null,
    }),
  });

  const raw = await response.text();
  let data: ConciergeResponse | { error?: string; message?: string } = {};

  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { error: raw };
  }

  if (!response.ok) {
    const detail =
      "message" in data && data.message
        ? data.message
        : "error" in data && data.error
        ? data.error
        : `HTTP ${response.status}`;

    throw new Error(`AI concierge failed: ${detail}`);
  }

  return data as ConciergeResponse;
}
