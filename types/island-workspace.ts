import type {
  IntelligenceAction,
  IntelligenceIsland,
} from "@/types/intelligence";

export type IslandWorkspaceLens =
  | "island"
  | "discover"
  | "move"
  | "stay"
  | "eat"
  | "experience"
  | "history"
  | "community";

export type IslandTrustedImage = Readonly<{
  src: string;
  alt: string;
  status: "verified" | "sourced" | "context";
  sourceUrl?: string;
}>;

export type IslandDataProvenance = Readonly<{
  sourceSystem:
    | "travel-knowledge"
    | "heritage-knowledge"
    | "response-fallback"
    | "experience-catalog"
    | "event-catalog"
    | "car-rental-catalog"
    | "ferry-schedule"
    | "dining-directory";
  sourceId: string;
  reviewStatus: string;
  sourceLabel?: string;
  sourceUrls: readonly string[];
  verifiedAt?: string;
}>;

export type IslandCatalogKind =
  | "experience"
  | "event"
  | "car_rental"
  | "ferry"
  | "dining";

export type IslandMissionStep = Readonly<{
  id: string;
  title: string;
  detail: string;
  meta: string;
  status: "ready" | "needs_input" | "requires_confirmation";
  image: IslandTrustedImage;
  bindingId?: string;
  href?: string;
}>;

export type IslandWorkspaceRecommendation = Readonly<{
  id: string;
  title: string;
  kind: string;
  island: IntelligenceIsland;
  summary: string;
  score: number;
  image: IslandTrustedImage;
  provenance: IslandDataProvenance;
  href?: string;
  mapHref?: string;
}>;

export type IslandWorkspaceCatalogItem = Readonly<{
  id: string;
  title: string;
  kind: IslandCatalogKind;
  island: IntelligenceIsland;
  summary: string;
  image: IslandTrustedImage;
  provenance: IslandDataProvenance;
  meta: readonly string[];
  status?: string;
  href?: string;
  mapHref?: string;
}>;

export type IslandEvidenceItem = Readonly<{
  id: string;
  label: string;
  detail: string;
  status: "grounded" | "bounded" | "review";
}>;

export type IslandAgentActivity = Readonly<{
  id: string;
  name: string;
  role: string;
  status: "pending" | "working" | "completed" | "failed";
}>;

export type IslandUIComponent =
  | "WorldCanvas"
  | "MissionTimeline"
  | "RecommendationDeck"
  | "CatalogDeck"
  | "EvidenceStrip"
  | "AgentActivity"
  | "WarningPanel"
  | "ConfirmationCard"
  | "ActionDock";

export type IslandUISource =
  | "workspace"
  | "plan"
  | "recommendations"
  | "catalog"
  | "evidence"
  | "agents"
  | "warnings"
  | "actions";

export type IslandUIVariant =
  | "primary"
  | "compact"
  | "expanded"
  | "route"
  | "persistent";

export type IslandUIPresentationBlock = Readonly<{
  id: string;
  component: IslandUIComponent;
  source: IslandUISource;
  bindingIds: readonly string[];
  variant: IslandUIVariant;
  priority: number;
}>;

export type IslandUIPresentationPlan = Readonly<{
  version: 1;
  mode: "discovery" | "journey" | "mobility" | "booking" | "knowledge";
  focus: "world" | "mission" | "recommendations" | "mobility" | "knowledge";
  blocks: readonly IslandUIPresentationBlock[];
}>;

export type IslandTrustedBinding = Readonly<{
  id: string;
  title: string;
  kind: string;
  island: IntelligenceIsland;
  summary: string;
  image: IslandTrustedImage;
  provenance: IslandDataProvenance;
  meta?: readonly string[];
  status?: string;
  href?: string;
  mapHref?: string;
}>;

export type IslandUIEnvelope = Readonly<{
  version: 1;
  presentation: IslandUIPresentationPlan;
  bindings: Readonly<Record<string, IslandTrustedBinding>>;
  catalogBindingIds: readonly string[];
}>;

export type IslandWorkspaceProjection = Readonly<{
  version: 1;
  runId: string;
  island: IntelligenceIsland;
  headline: string;
  summary: string;
  intent: string;
  confidence: "low" | "medium" | "high";
  presentation: IslandUIPresentationPlan;
  mission: readonly IslandMissionStep[];
  recommendations: readonly IslandWorkspaceRecommendation[];
  catalog: readonly IslandWorkspaceCatalogItem[];
  actions: readonly IntelligenceAction[];
  evidence: readonly IslandEvidenceItem[];
  agentActivity: readonly IslandAgentActivity[];
  warnings: readonly string[];
  generatedAt: string;
}>;
