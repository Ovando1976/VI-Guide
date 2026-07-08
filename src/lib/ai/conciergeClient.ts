import { getCurrentIdToken } from "../firebase/firebaseClient";
import type { BeachDoc, EventDoc, IslandCode, PlaceDoc } from "../../types";

export type ConciergeListing = BeachDoc | PlaceDoc;

export type ConciergeResponse = {
  answer: string;
  listings?: ConciergeListing[];
  events?: EventDoc[];
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

  if (!response.ok) {
    throw new Error(`AI concierge failed: ${response.status}`);
  }

  return (await response.json()) as ConciergeResponse;
}
