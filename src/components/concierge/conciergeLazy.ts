import type { IslandCode } from "../../types";
import type { GeographicIndexItem } from "../../data/core/geographicIndex";

export async function searchGeographyLazy(
  query: string,
  filters: { island?: IslandCode; limit?: number },
): Promise<GeographicIndexItem[]> {
  const { searchAllGeography } = await import("../../lib/search/geographicSearch");
  return searchAllGeography(query, filters) as GeographicIndexItem[];
}

export async function parseIntentLazy(message: string, island: IslandCode) {
  const { parseConciergeIntent } = await import("../../lib/concierge/conciergeIntentEngine");
  return parseConciergeIntent({ message, island });
}

export async function relationshipAnswerLazy(parsed: Awaited<ReturnType<typeof parseIntentLazy>>) {
  const { answerConciergeRelationship } = await import("../../lib/concierge/conciergeRelationshipEngine");
  return answerConciergeRelationship({ parsed });
}

export async function reasonFromResultsLazy(args: {
  parsed: Awaited<ReturnType<typeof parseIntentLazy>>;
  results: GeographicIndexItem[];
}) {
  const { reasonFromConciergeResults } = await import("../../features/concierge/conciergeReasoner");
  return reasonFromConciergeResults(args);
}

export async function runBrainLazy(
  args: Parameters<typeof import("../../features/concierge/conciergeBrain").runConciergeBrain>[0],
) {
  const { runConciergeBrain } = await import("../../features/concierge/conciergeBrain");
  return runConciergeBrain(args);
}
