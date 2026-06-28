import type { IslandCode } from "../../types";
import type { GeographicIndexItem } from "../../data/core/geographicIndex";
import type { ConciergeAction, ConciergeIntent } from "./conciergeBrain";
import { resultPath } from "./conciergeUtils";

export function buildConciergeActions(input: {
  intent: ConciergeIntent;
  island: IslandCode;
  results: GeographicIndexItem[];
}): ConciergeAction[] {
  const { intent, island, results } = input;
  const top = results[0];
  const actions: ConciergeAction[] = [];

  if (top) {
    actions.push({
      type: "navigate",
      label: `Open ${top.name}`,
      path: resultPath(top, island),
    });

    actions.push({
      type: "navigate",
      label: "Show on map",
      path: `/map?island=${top.island || island}&q=${encodeURIComponent(top.name)}`,
    });
  }

  if (intent === "route" || intent === "nearby") {
    actions.push({
      type: "navigate",
      label: "Plan ride",
      path: `/mobility?island=${island}`,
    });
  }

  if (intent === "booking" || intent === "history") {
    actions.push({
      type: "book",
      label: "Create tour lead",
      intent: "tour",
    });

    actions.push({
      type: "book",
      label: "Tour + taxi bundle",
      intent: "bundle",
    });
  }

  if (intent === "business") {
    actions.push({
      type: "navigate",
      label: "Open business directory",
      path: "/businesses",
    });
  }

  return actions.slice(0, 4);
}
