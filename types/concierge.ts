import type { RideMode } from "@/types/mobility";
import type { IslandCode } from "@/types/usvi";

export type ConciergeMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
};

export type ConciergeEstateContext = {
  geoid: string;
  name: string;
};

export type ConciergeContext = {
  island: IslandCode;
  islandName: string;
  selectedEstate: ConciergeEstateContext | null;
  pickup: ConciergeEstateContext | null;
  destination: ConciergeEstateContext | null;
  rideMode: RideMode;
  passengers: number;
  luggage: number;
  activeLens: string;
  nearbyEstates: ConciergeEstateContext[];
  tripPlan?: {
    days: number;
    items: Array<{
      key: string;
      name: string;
      kind: "place" | "beach" | "stay" | "historic";
      island: IslandCode;
      day: number;
      timeOfDay: "morning" | "afternoon" | "evening" | "flexible";
    }>;
  };
};

export type ConciergeActionType =
  | "select_estate"
  | "set_pickup"
  | "set_destination"
  | "open_estate"
  | "open_mobility"
  | "add_trip_item"
  | "schedule_trip_item"
  | "remove_trip_item"
  | "optimize_trip"
  | "open_trip"
  | "open_fishing"
  | "prepare_mobility";

export type ConciergeAction = {
  id: string;
  type: ConciergeActionType;
  label: string;
  geoid: string | null;
  href: string | null;
  rationale: string;
  risk: "local" | "consequential";
  requiresApproval: boolean;
  target: string | null;
  day: number | null;
  timeOfDay: "morning" | "afternoon" | "evening" | "flexible" | null;
  tripItem: {
    id: string;
    slug: string;
    name: string;
    kind: "place" | "beach" | "stay" | "historic";
    island: IslandCode;
    href: string;
    description?: string;
  } | null;
  pickupName: string | null;
  destinationName: string | null;
};

export type ConciergeBudgetSnapshot = {
  maxModelCalls: number;
  modelCallsUsed: number;
  maxOutputTokens: number;
  outputTokensUsed: number;
  maxRuntimeMs: number;
  runtimeMs: number;
  externalSpendLimitCents: number;
  externalSpendCents: number;
};

export type ConciergeReply = {
  runId: string;
  sessionId: string;
  message: ConciergeMessage;
  suggestions: string[];
  actions: ConciergeAction[];
  budget: ConciergeBudgetSnapshot;
  provider: "openai" | "local";
  memoryStatus: "durable" | "session-only";
};

export type ConciergeChatRequest = {
  sessionId: string;
  clientId: string;
  idempotencyKey: string;
  message: string;
  context: ConciergeContext;
  recentMessages: ConciergeMessage[];
};
