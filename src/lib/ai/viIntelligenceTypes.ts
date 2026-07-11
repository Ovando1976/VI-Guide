// src/lib/ai/viIntelligenceTypes.ts

import type {
    BeachDoc,
    EventDoc,
    IslandCode,
    PlaceDoc,
    UserProfile,
  } from "../../types";
  
  export type ViListing = BeachDoc | PlaceDoc;
  
  export type ViAgentId =
    | "concierge"
    | "operator"
    | "trip_planner"
    | "mobility"
    | "booking"
    | "local_guide"
    | "history"
    | "safety";
  
  export type ViIntent =
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
  
  export type ViMessageRole = "user" | "model" | "system";
  
  export type ViConversationMessage = {
    role: ViMessageRole;
    text: string;
    createdAt?: string;
  };
  
  export type ViUserLocation = {
    lat: number;
    lng: number;
  };
  
  export type ViPlanStep = {
    id?: string;
    time?: string;
    title: string;
    detail: string;
    locationName?: string;
    path?: string;
    estimatedCost?: string;
    travelTimeMinutes?: number;
  };
  
  export type ViActionKind =
    | "checkout"
    | "booking"
    | "ride"
    | "map"
    | "call"
    | "save"
    | "share"
    | "route"
    | "upgrade"
    | "learn_more";
  
  export type ViAction = {
    label: string;
    description?: string;
    path: string;
    kind?: ViActionKind;
    priority?: "low" | "medium" | "high";
  };
  
  export type ViLeadDraft = {
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
  
  export type ViMemorySignal = {
    key: string;
    value: string;
    confidence: "low" | "medium" | "high";
    shouldSave: boolean;
    reason?: string;
  };
  
  export type ViAccessState = {
    admin?: boolean;
    partner?: boolean;
    premium?: boolean;
    operatorMode?: boolean;
  };
  
  export type ViSuggestedRoutes = Record<string, string | null>;
  
  export type ViIntelligenceRequest = {
    message: string;
    islandCode: IslandCode;
    agentId?: ViAgentId | string;
    sessionId?: string;
    userId?: string | null;
    userProfile?: UserProfile | null;
    contextListing?: ViListing | null;
    userLocation?: ViUserLocation | null;
    history?: ViConversationMessage[];
  };
  
  export type ViIntelligenceResponse = {
    answer: string;
    intent: ViIntent;
    confidence: "low" | "medium" | "high";
  
    listings?: ViListing[];
    events?: EventDoc[];
    plan?: ViPlanStep[];
    actions?: ViAction[];
  
    leadDraft?: ViLeadDraft;
    missingFields?: string[];
    memorySignals?: ViMemorySignal[];
  
    provider?: string;
    access?: ViAccessState;
    suggestedRoutes?: ViSuggestedRoutes;
  
    debug?: {
      agentUsed?: string;
      toolsUsed?: string[];
      reason?: string;
    };
  };