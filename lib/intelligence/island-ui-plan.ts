import type { IntelligenceResponse } from "@/types/intelligence";
import type {
  IslandUIComponent,
  IslandUIPresentationBlock,
  IslandUIPresentationPlan,
  IslandUISource,
  IslandUIVariant,
} from "@/types/island-workspace";

const COMPONENT_SOURCE: Readonly<Record<IslandUIComponent, IslandUISource>> =
  Object.freeze({
    WorldCanvas: "workspace",
    MissionTimeline: "plan",
    RecommendationDeck: "recommendations",
    CatalogDeck: "catalog",
    EvidenceStrip: "evidence",
    AgentActivity: "agents",
    WarningPanel: "warnings",
    ConfirmationCard: "actions",
    ActionDock: "actions",
  });

const DEFAULT_PRIORITY: Readonly<Record<IslandUIComponent, number>> =
  Object.freeze({
    WorldCanvas: 100,
    ConfirmationCard: 98,
    ActionDock: 96,
    MissionTimeline: 92,
    WarningPanel: 90,
    RecommendationDeck: 80,
    CatalogDeck: 74,
    EvidenceStrip: 60,
    AgentActivity: 55,
  });

const DEFAULT_VARIANT: Readonly<Record<IslandUIComponent, IslandUIVariant>> =
  Object.freeze({
    WorldCanvas: "primary",
    MissionTimeline: "expanded",
    RecommendationDeck: "expanded",
    CatalogDeck: "expanded",
    EvidenceStrip: "compact",
    AgentActivity: "compact",
    WarningPanel: "compact",
    ConfirmationCard: "primary",
    ActionDock: "persistent",
  });

const COMPONENTS = new Set<IslandUIComponent>(
  Object.keys(COMPONENT_SOURCE) as IslandUIComponent[],
);
const VARIANTS = new Set<IslandUIVariant>([
  "primary",
  "compact",
  "expanded",
  "route",
  "persistent",
]);
const MODES = new Set<IslandUIPresentationPlan["mode"]>([
  "discovery",
  "journey",
  "mobility",
  "booking",
  "knowledge",
]);
const FOCUSES = new Set<IslandUIPresentationPlan["focus"]>([
  "world",
  "mission",
  "recommendations",
  "mobility",
  "knowledge",
]);

function inferredMode(
  response: IntelligenceResponse,
): IslandUIPresentationPlan["mode"] {
  if (response.intent === "booking") return "booking";
  if (response.intent === "mobility") return "mobility";
  if (response.intent === "knowledge") return "knowledge";
  if (response.plan.length) return "journey";
  return "discovery";
}

function inferredFocus(
  response: IntelligenceResponse,
): IslandUIPresentationPlan["focus"] {
  if (response.intent === "mobility") return "mobility";
  if (response.intent === "knowledge") return "knowledge";
  if (response.plan.length || response.orchestration?.missingInformation.length) {
    return "mission";
  }
  if (response.recommendations.length) return "recommendations";
  return "world";
}

function bindingIdsForSource(
  source: IslandUISource,
  response: IntelligenceResponse,
  catalogBindingIds: readonly string[],
) {
  if (source === "recommendations") {
    return response.recommendations.map((item) => item.id);
  }
  if (source === "catalog") return [...catalogBindingIds];
  if (source === "plan") return response.plan.map((item) => item.id);
  if (source === "actions") return response.actions.map((item) => item.id);
  return [];
}

function makeBlock(
  component: IslandUIComponent,
  response: IntelligenceResponse,
  catalogBindingIds: readonly string[],
  overrides: Partial<
    Pick<IslandUIPresentationBlock, "variant" | "priority" | "bindingIds">
  > = {},
): IslandUIPresentationBlock {
  const source = COMPONENT_SOURCE[component];
  const available = bindingIdsForSource(source, response, catalogBindingIds);
  const requested = overrides.bindingIds ?? available;
  const allowed = new Set(available);
  const bindingIds =
    source === "actions"
      ? available
      : Array.from(new Set(requested.filter((id) => allowed.has(id)))).slice(0, 8);
  return Object.freeze({
    id: `island-ui-${component}`,
    component,
    source,
    bindingIds: Object.freeze(
      bindingIds.length || !available.length ? bindingIds : available.slice(0, 8),
    ),
    variant: overrides.variant ?? DEFAULT_VARIANT[component],
    priority: Math.max(
      0,
      Math.min(100, overrides.priority ?? DEFAULT_PRIORITY[component]),
    ),
  });
}

function requiredComponents(
  response: IntelligenceResponse,
  catalogBindingIds: readonly string[],
): IslandUIComponent[] {
  const required: IslandUIComponent[] = ["WorldCanvas"];
  if (response.plan.length || response.orchestration?.missingInformation.length) {
    required.push("MissionTimeline");
  }
  if (response.recommendations.length) required.push("RecommendationDeck");
  if (catalogBindingIds.length) required.push("CatalogDeck");
  if (response.orchestration?.trace.length) required.push("EvidenceStrip");
  if (response.orchestration?.coordination?.team.length) {
    required.push("AgentActivity");
  }
  if (response.warnings.length) required.push("WarningPanel");
  if (response.actions.some((action) => action.requiresConfirmation)) {
    required.push("ConfirmationCard");
  }
  if (response.actions.length) required.push("ActionDock");
  return required;
}

export function buildDefaultIslandPresentationPlan(
  response: IntelligenceResponse,
  catalogBindingIds: readonly string[] = [],
): IslandUIPresentationPlan {
  return Object.freeze({
    version: 1 as const,
    mode: inferredMode(response),
    focus: inferredFocus(response),
    blocks: Object.freeze(
      requiredComponents(response, catalogBindingIds)
        .map((component) =>
          makeBlock(component, response, catalogBindingIds),
        )
        .sort((a, b) => b.priority - a.priority),
    ),
  });
}

function rawObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function normalizeIslandPresentationPlan(
  value: unknown,
  response: IntelligenceResponse,
  catalogBindingIds: readonly string[] = [],
): IslandUIPresentationPlan {
  const fallback = buildDefaultIslandPresentationPlan(
    response,
    catalogBindingIds,
  );
  const raw = rawObject(value);
  if (!raw) return fallback;

  const mode =
    typeof raw.mode === "string" &&
    MODES.has(raw.mode as IslandUIPresentationPlan["mode"])
      ? (raw.mode as IslandUIPresentationPlan["mode"])
      : fallback.mode;
  const focus =
    typeof raw.focus === "string" &&
    FOCUSES.has(raw.focus as IslandUIPresentationPlan["focus"])
      ? (raw.focus as IslandUIPresentationPlan["focus"])
      : fallback.focus;

  const byComponent = new Map<
    IslandUIComponent,
    IslandUIPresentationBlock
  >();
  const rawBlocks = Array.isArray(raw.blocks) ? raw.blocks.slice(0, 10) : [];
  for (const candidate of rawBlocks) {
    const block = rawObject(candidate);
    if (!block || typeof block.component !== "string") continue;
    const component = block.component as IslandUIComponent;
    if (!COMPONENTS.has(component)) continue;
    if (
      typeof block.source !== "string" ||
      block.source !== COMPONENT_SOURCE[component]
    ) {
      continue;
    }
    const variant =
      typeof block.variant === "string" &&
      VARIANTS.has(block.variant as IslandUIVariant)
        ? (block.variant as IslandUIVariant)
        : DEFAULT_VARIANT[component];
    const priority = Number.isFinite(Number(block.priority))
      ? Math.max(0, Math.min(100, Math.round(Number(block.priority))))
      : DEFAULT_PRIORITY[component];
    const requestedIds = Array.isArray(block.bindingIds)
      ? block.bindingIds
          .filter((id): id is string => typeof id === "string")
          .slice(0, 8)
      : [];
    byComponent.set(
      component,
      makeBlock(component, response, catalogBindingIds, {
        variant,
        priority,
        bindingIds: requestedIds,
      }),
    );
  }

  for (const component of requiredComponents(response, catalogBindingIds)) {
    if (!byComponent.has(component)) {
      byComponent.set(
        component,
        makeBlock(component, response, catalogBindingIds),
      );
    }
  }

  return Object.freeze({
    version: 1 as const,
    mode,
    focus,
    blocks: Object.freeze(
      [...byComponent.values()]
        .sort(
          (a, b) =>
            b.priority - a.priority || a.component.localeCompare(b.component),
        )
        .slice(0, 10),
    ),
  });
}

export function getIslandUIComponentSource(component: IslandUIComponent) {
  return COMPONENT_SOURCE[component];
}
