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
};

export type ConciergeActionType =
  | "select_estate"
  | "set_pickup"
  | "set_destination"
  | "open_estate"
  | "open_mobility";

export type ConciergeAction = {
  id: string;
  type: ConciergeActionType;
  label: string;
  geoid: string | null;
  href: string | null;
  rationale: string;
  risk: "local" | "consequential";
  requiresApproval: boolean;
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