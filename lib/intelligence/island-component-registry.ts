import type {
  IslandUIComponent,
  IslandUIPresentationBlock,
  IslandUIPresentationPlan,
} from "@/types/island-workspace";

export type IslandUIZone = "canvas" | "support" | "rail";

export const ISLAND_COMPONENT_REGISTRY: Readonly<
  Record<IslandUIComponent, Readonly<{ zone: IslandUIZone; label: string }>>
> = Object.freeze({
  WorldCanvas: Object.freeze({ zone: "canvas", label: "World canvas" }),
  RecommendationDeck: Object.freeze({ zone: "canvas", label: "Recommendations" }),
  CatalogDeck: Object.freeze({ zone: "canvas", label: "Connected traveler catalog" }),
  EvidenceStrip: Object.freeze({ zone: "support", label: "Evidence" }),
  AgentActivity: Object.freeze({ zone: "support", label: "Agent activity" }),
  MissionTimeline: Object.freeze({ zone: "rail", label: "Mission timeline" }),
  WarningPanel: Object.freeze({ zone: "rail", label: "Warnings" }),
  ConfirmationCard: Object.freeze({ zone: "rail", label: "Confirmations" }),
  ActionDock: Object.freeze({ zone: "rail", label: "Actions" }),
});

export function blocksForIslandZone(
  presentation: IslandUIPresentationPlan,
  zone: IslandUIZone,
): readonly IslandUIPresentationBlock[] {
  return presentation.blocks
    .filter(
      (block) => ISLAND_COMPONENT_REGISTRY[block.component]?.zone === zone,
    )
    .sort(
      (a, b) =>
        b.priority - a.priority || a.component.localeCompare(b.component),
    );
}
