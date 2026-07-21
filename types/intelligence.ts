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
  | "search"
  | "unknown";

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

export type IntelligenceMemory = {
  preferredIsland?: IntelligenceIsland;
  party?: Partial<IntelligenceParty>;
  preferences?: Partial<IntelligencePreferences>;
  recentPlaceIds?: string[];
  savedPlaceIds?: string[];
  cruise?: {
    ship?: string;
    port?: IntelligenceLocation;
    arrivalTime?: string;
    allAboardTime?: string;
  };
  stay?: IntelligenceLocation;
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
  capabilities?: Array<
    "recommend" | "plan" | "map" | "mobility" | "booking" | "knowledge"
  >;
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
  href?: string;
  mapHref?: string;
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
  generatedAt: string;
};
