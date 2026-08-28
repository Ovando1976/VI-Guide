import { getIslandContextImage } from "@/lib/intelligence/island-ui-images";
import { buildDefaultIslandPresentationPlan } from "@/lib/intelligence/island-ui-plan";
import type { IntelligenceResponse } from "@/types/intelligence";
import type {
  IslandAgentActivity,
  IslandCatalogKind,
  IslandEvidenceItem,
  IslandMissionStep,
  IslandTrustedBinding,
  IslandUIEnvelope,
  IslandWorkspaceCatalogItem,
  IslandWorkspaceProjection,
  IslandWorkspaceRecommendation,
} from "@/types/island-workspace";

function islandUIEnvelope(response: IntelligenceResponse): IslandUIEnvelope | null {
  const candidate = (
    response as IntelligenceResponse & { islandUI?: IslandUIEnvelope }
  ).islandUI;
  return candidate?.version === 1 ? candidate : null;
}

function missionStatus(
  response: IntelligenceResponse,
): IslandMissionStep["status"] {
  if (response.orchestration?.status === "waiting_for_user") {
    return "needs_input";
  }
  return response.actions.some((action) => action.requiresConfirmation)
    ? "requires_confirmation"
    : "ready";
}

function projectMission(
  response: IntelligenceResponse,
  bindings: Readonly<Record<string, IslandTrustedBinding>>,
): IslandMissionStep[] {
  const status = missionStatus(response);
  const planned = response.plan.slice(0, 8).map((stop, index) => {
    const bindingId = stop.placeId;
    const binding = bindingId ? bindings[bindingId] : undefined;
    return {
      id: stop.id,
      title: binding?.title ?? stop.title,
      detail: stop.summary,
      meta:
        [
          stop.startTime,
          stop.durationMinutes ? `${stop.durationMinutes} min` : null,
          stop.mobility?.mode,
        ]
          .filter(Boolean)
          .join(" · ") || `Step ${index + 1}`,
      status,
      image: binding?.image ?? getIslandContextImage(stop.island),
      ...(bindingId ? { bindingId } : {}),
      ...(stop.href || stop.mapHref
        ? { href: stop.href ?? stop.mapHref }
        : {}),
    } satisfies IslandMissionStep;
  });

  if (planned.length) return planned;

  return (response.orchestration?.missingInformation ?? [])
    .slice(0, 6)
    .map((field, index) => ({
      id: `missing-${index}-${field}`,
      title: `Confirm ${field}`,
      detail:
        "Island needs this detail before the governed workflow can continue.",
      meta: "Waiting for you",
      status: "needs_input" as const,
      image: getIslandContextImage(response.context.island),
    }));
}

function projectEvidence(response: IntelligenceResponse): IslandEvidenceItem[] {
  const trace = (response.orchestration?.trace ?? []).slice(-4).map((step) => ({
    id: `trace-${step.node}-${step.completedAt}`,
    label: step.node.replaceAll("_", " "),
    detail: step.detail,
    status:
      step.status === "completed"
        ? ("grounded" as const)
        : step.status === "limited"
          ? ("review" as const)
          : ("bounded" as const),
  }));

  const coordination = (response.orchestration?.coordination?.tasks ?? [])
    .slice(0, 4)
    .map((task) => ({
      id: `agent-task-${task.id}`,
      label: task.title,
      detail: task.claimedBy
        ? `Bounded specialist: ${task.claimedBy}`
        : "Held inside the bounded coordination plan.",
      status:
        task.status === "failed"
          ? ("review" as const)
          : task.status === "completed"
            ? ("grounded" as const)
            : ("bounded" as const),
    }));

  return [...trace, ...coordination].slice(0, 6);
}

function projectAgentActivity(
  response: IntelligenceResponse,
): IslandAgentActivity[] {
  const coordination = response.orchestration?.coordination;
  if (!coordination) return [];

  return coordination.team.slice(0, 6).map((member) => {
    const task = coordination.tasks.find(
      (candidate) => candidate.claimedBy === member.agentId,
    );
    const status: IslandAgentActivity["status"] =
      task?.status === "completed"
        ? "completed"
        : task?.status === "failed"
          ? "failed"
          : task?.status === "claimed"
            ? "working"
            : "pending";

    return {
      id: member.agentId,
      name: member.name,
      role: member.roles.join(" · ") || "specialist",
      status,
    };
  });
}

function fallbackBinding(
  item: IntelligenceResponse["recommendations"][number],
): IslandTrustedBinding {
  return Object.freeze({
    id: item.id,
    title: item.title,
    kind: item.kind,
    island: item.island,
    summary: item.summary,
    image: getIslandContextImage(item.island),
    provenance: Object.freeze({
      sourceSystem: "response-fallback" as const,
      sourceId: item.id,
      reviewStatus: "grounded-response",
      sourceUrls: Object.freeze([]),
    }),
    ...(item.href ? { href: item.href } : {}),
    ...(item.mapHref ? { mapHref: item.mapHref } : {}),
  });
}

function projectRecommendations(
  response: IntelligenceResponse,
  bindings: Readonly<Record<string, IslandTrustedBinding>>,
): IslandWorkspaceRecommendation[] {
  return response.recommendations.slice(0, 8).map((item) => {
    const binding = bindings[item.id] ?? fallbackBinding(item);
    return Object.freeze({
      id: item.id,
      title: binding.title,
      kind: binding.kind,
      island: binding.island,
      summary: binding.summary,
      score: item.score,
      image: binding.image,
      provenance: binding.provenance,
      ...(binding.href ? { href: binding.href } : {}),
      ...(binding.mapHref ? { mapHref: binding.mapHref } : {}),
    });
  });
}

const CATALOG_KINDS = new Set<IslandCatalogKind>([
  "experience",
  "event",
  "car_rental",
  "ferry",
  "dining",
]);

function projectCatalog(
  envelope: IslandUIEnvelope | null,
): IslandWorkspaceCatalogItem[] {
  if (!envelope) return [];
  return envelope.catalogBindingIds
    .slice(0, 8)
    .map((id) => envelope.bindings[id])
    .filter(
      (binding): binding is IslandTrustedBinding =>
        Boolean(binding && CATALOG_KINDS.has(binding.kind as IslandCatalogKind)),
    )
    .map((binding) =>
      Object.freeze({
        id: binding.id,
        title: binding.title,
        kind: binding.kind as IslandCatalogKind,
        island: binding.island,
        summary: binding.summary,
        image: binding.image,
        provenance: binding.provenance,
        meta: Object.freeze([...(binding.meta ?? [])]),
        ...(binding.status ? { status: binding.status } : {}),
        ...(binding.href ? { href: binding.href } : {}),
        ...(binding.mapHref ? { mapHref: binding.mapHref } : {}),
      }),
    );
}

/**
 * Presentation projection only.
 *
 * The projector never creates executable authority. `actions` are the exact
 * governed actions returned by the server intelligence boundary, including
 * their confirmation requirements. Internal root-intent identifiers, prompts,
 * blackboard messages, and broker evidence bodies are intentionally omitted.
 */
export function projectIntelligenceToIslandWorkspace(
  response: IntelligenceResponse,
): IslandWorkspaceProjection {
  const envelope = islandUIEnvelope(response);
  const bindings = envelope?.bindings ?? Object.freeze({});
  const mission = projectMission(response, bindings);
  const recommendations = projectRecommendations(response, bindings);
  const catalog = projectCatalog(envelope);
  const recommendationCount = recommendations.length;
  const headline = mission.length
    ? `${mission.length} connected ${mission.length === 1 ? "step" : "steps"} for your island mission`
    : recommendationCount
      ? `${recommendationCount} grounded ${recommendationCount === 1 ? "match" : "matches"} ready to explore`
      : "Island is holding the mission safely";

  return Object.freeze({
    version: 1 as const,
    runId: response.runId,
    island: response.context.island,
    headline,
    summary: response.answer,
    intent: response.intent,
    confidence: response.confidence,
    presentation:
      envelope?.presentation ?? buildDefaultIslandPresentationPlan(response),
    mission: Object.freeze(mission),
    recommendations: Object.freeze(recommendations),
    catalog: Object.freeze(catalog),
    actions: Object.freeze([...response.actions]),
    evidence: Object.freeze(projectEvidence(response)),
    agentActivity: Object.freeze(projectAgentActivity(response)),
    warnings: Object.freeze([...response.warnings]),
    generatedAt: response.generatedAt,
  });
}
