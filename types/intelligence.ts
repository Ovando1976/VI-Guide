export type IntelligenceIsland = "stt" | "stj" | "stx";

export type IntelligencePage =
  | "home"
  | "explore"
  | "map"
  | "heritage"
  | "mobility"
  | "stays"
  | "beaches"
  | "fishing"
  | "community"
  | "concierge"
  | "cruises"
  | "planner"
  | "profile"
  | "today"
  | "search"
  | "unknown";

export type IntelligenceCapability =
  | "recommend"
  | "plan"
  | "map"
  | "mobility"
  | "booking"
  | "knowledge";

export type IntelligenceLocation = {
  id?: string;
  name: string;
  island: IntelligenceIsland;
  lat?: number;
  lng?: number;
  kind?: string;
};

export type IntelligenceParty = {
  adults: number;
  children: number;
  accessibilityNeeds?: string[];
};

export type IntelligencePreferences = {
  interests: string[];
  pace?: "relaxed" | "balanced" | "active";
  budget?: "value" | "moderate" | "premium";
  food?: string[];
  avoid?: string[];
};

export type IntelligenceNotificationPreferences = {
  tripMonitoring?: boolean;
  inApp?: boolean;
  email?: boolean;
  minimumSeverity?: "medium" | "high" | "critical";
  notifyOnRecovery?: boolean;
};

export type IntelligenceActiveTripStop = {
  id: string;
  title: string;
  kind: string;
  summary?: string;
  startTime?: string;
  durationMinutes?: number;
  bookingHref?: string;
  mobility?: {
    mode: "walk" | "taxi" | "ferry" | "drive" | "transfer";
    estimatedMinutes?: number;
  };
};

export type IntelligenceActiveTrip = {
  id: string;
  title: string;
  island: IntelligenceIsland;
  date: string;
  status: "draft" | "ready";
  updatedAt: string;
  stops: IntelligenceActiveTripStop[];
};

export type IntelligenceMemory = {
  preferredIsland?: IntelligenceIsland;
  party?: Partial<IntelligenceParty>;
  preferences?: Partial<IntelligencePreferences>;
  notifications?: IntelligenceNotificationPreferences;
  recentPlaceIds?: string[];
  savedPlaceIds?: string[];
  cruise?: {
    tripId?: string;
    sailingId?: string;
    cruiseLine?: string;
    ship?: string;
    portCallDate?: string;
    port?: IntelligenceLocation;
    arrivalTime?: string;
    allAboardTime?: string;
    allAboardSource?: "derived_from_scheduled_departure" | "confirmed" | "unavailable";
  };
  stay?: IntelligenceLocation;
  activeTrip?: IntelligenceActiveTrip;
};

export type IntelligenceContext = {
  sessionId: string;
  userId?: string;
  page: IntelligencePage;
  island: IntelligenceIsland;
  now: string;
  timezone: "America/St_Thomas";
  currentLocation?: IntelligenceLocation;
  selectedPlace?: IntelligenceLocation;
  pickup?: IntelligenceLocation;
  destination?: IntelligenceLocation;
  party: IntelligenceParty;
  preferences: IntelligencePreferences;
  memory: IntelligenceMemory;
};

export type IntelligenceRequest = {
  message: string;
  context: IntelligenceContext;
  capabilities?: IntelligenceCapability[];
};

export type IntelligencePlanStop = {
  id: string;
  title: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  island: IntelligenceIsland;
  kind: string;
  summary: string;
  placeId?: string;
  lat?: number;
  lng?: number;
  href?: string;
  mapHref?: string;
  bookingHref?: string;
  mobility?: {
    from?: string;
    to: string;
    mode: "walk" | "taxi" | "ferry" | "drive" | "transfer";
    estimatedMinutes?: number;
  };
};

export type IntelligenceAction = {
  id: string;
  type:
    | "open_place"
    | "open_map"
    | "plan_ride"
    | "start_booking"
    | "save_plan"
    | "ask_follow_up";
  label: string;
  href?: string;
  payload?: Record<string, unknown>;
  requiresConfirmation: boolean;
};

export type IntelligenceRecommendation = {
  id: string;
  title: string;
  kind: string;
  island: IntelligenceIsland;
  summary: string;
  score: number;
  reasons: string[];
  lat?: number;
  lng?: number;
  href?: string;
  mapHref?: string;
};

export type IntelligenceOrchestrationStep = {
  node:
    | "classify"
    | "authorize"
    | "ground"
    | "plan"
    | "validate"
    | "finalize";
  status: "completed" | "limited" | "waiting";
  detail: string;
  completedAt: string;
};

export type IntelligenceToolSummary = {
  id: string;
  name: string;
  description: string;
  category: string;
  capability: IntelligenceCapability;
  permissions: string[];
  risk: "low" | "medium" | "high";
  requiresConfirmation: boolean;
  enabled: boolean;
  tags: string[];
  version: string;
};

export type IntelligenceAgentContextSummary = {
  version: number;
  builtAt: string;
  ownerKey: string;
  memorySource: "firestore" | "request";
  workflow: {
    id: string;
    status: "active" | "waiting_for_user" | "completed" | "failed";
    intent: string;
    currentStep: string;
    missingInformation: string[];
  } | null;
  tools: IntelligenceToolSummary[];
  requestedCapabilities: IntelligenceCapability[];
  authorizedCapabilities: IntelligenceCapability[];
  unavailableCapabilities: IntelligenceCapability[];
  map: {
    island: IntelligenceIsland;
    currentLocation?: IntelligenceLocation;
    selectedPlace?: IntelligenceLocation;
    pickup?: IntelligenceLocation;
    destination?: IntelligenceLocation;
  };
  confirmations: {
    bookingRequired: boolean;
    mobilityRequired: boolean;
    pending: string[];
  };
};

export type IntelligenceCoordinationSummary = {
  version: 1;
  status: "planned" | "limited";
  rootIntentId: string;
  rootIntentExpiresAt: string;
  team: Array<{
    agentId: string;
    name: string;
    roles: string[];
    capabilities: IntelligenceCapability[];
    reason: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    requiredCapabilities: IntelligenceCapability[];
    status: "pending" | "claimed" | "completed" | "failed";
    depth: number;
    dependsOn: string[];
    claimedBy?: string;
  }>;
  messageCount: number;
  safeAutonomousTools: string[];
  blockedAutonomousTools: Array<{
    toolId: string;
    reason:
      | "read_only_tool"
      | "tool_disabled"
      | "human_confirmation_required"
      | "high_risk_tool"
      | "mutating_tool";
  }>;
  missingCapabilities: IntelligenceCapability[];
  limits: {
    maxAgents: number;
    maxTasks: number;
    maxMessages: number;
    maxDepth: number;
    maxRuntimeMs: number;
  };
};

export type IntelligenceOrchestration = {
  status: "ready" | "waiting_for_user";
  intent: string;
  requiredCapabilities: IntelligenceCapability[];
  missingInformation: string[];
  trace: IntelligenceOrchestrationStep[];
  tools?: IntelligenceToolSummary[];
  context?: IntelligenceAgentContextSummary;
  coordination?: IntelligenceCoordinationSummary;
};

export type IntelligenceResponse = {
  runId: string;
  answer: string;
  intent: string;
  confidence: "low" | "medium" | "high";
  context: IntelligenceContext;
  plan: IntelligencePlanStop[];
  recommendations: IntelligenceRecommendation[];
  actions: IntelligenceAction[];
  memoryPatch: IntelligenceMemory;
  warnings: string[];
  orchestration?: IntelligenceOrchestration;
  generatedAt: string;
};
