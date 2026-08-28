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

export type IslandMissionStep = Readonly<{
  id: string;
  title: string;
  detail: string;
  meta: string;
  status: "ready" | "needs_input" | "requires_confirmation";
  href?: string;
}>;

export type IslandWorkspaceRecommendation = Readonly<{
  id: string;
  title: string;
  kind: string;
  island: IntelligenceIsland;
  summary: string;
  score: number;
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

export type IslandWorkspaceProjection = Readonly<{
  version: 1;
  runId: string;
  island: IntelligenceIsland;
  headline: string;
  summary: string;
  intent: string;
  confidence: "low" | "medium" | "high";
  mission: readonly IslandMissionStep[];
  recommendations: readonly IslandWorkspaceRecommendation[];
  actions: readonly IntelligenceAction[];
  evidence: readonly IslandEvidenceItem[];
  agentActivity: readonly IslandAgentActivity[];
  warnings: readonly string[];
  generatedAt: string;
}>;
