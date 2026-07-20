import { searchUnifiedTravelKnowledge } from "@/lib/unified-search";
import type { ConciergeContext } from "@/types/concierge";

export type ConciergeDirectoryEvidence = {
  type: "place" | "beach" | "stay" | "historic";
  name: string;
  description: string;
  category: string;
  island: string;
  estateGeoid: string | null;
  href: string;
  score: number;
  tags: string[];
};

export function getConciergeDirectoryEvidence({
  context,
  message,
  limit = 18,
}: {
  context: Pick<ConciergeContext, "island" | "selectedEstate">;
  message: string;
  limit?: number;
}): ConciergeDirectoryEvidence[] {
  const selectedGeoid = context.selectedEstate?.geoid ?? null;
  const results = searchUnifiedTravelKnowledge({
    query: message,
    island: context.island,
    limit: Math.max(limit * 3, 30),
  });

  return results
    .map((result) => {
      const estateBoost = selectedGeoid && result.item.estateGeoid === selectedGeoid ? 8 : 0;
      return {
        type: mapKind(result.kind),
        name: result.item.name,
        description: result.item.description.slice(0, 280),
        category: result.item.category || mapKind(result.kind),
        island: result.item.island.toUpperCase(),
        estateGeoid: result.item.estateGeoid ?? null,
        href: result.href,
        score: result.score + estateBoost,
        tags: result.item.tags.slice(0, 6),
      };
    })
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, Math.max(1, Math.min(limit, 24)));
}

function mapKind(kind: "places" | "beaches" | "stays" | "historic") {
  if (kind === "places") return "place" as const;
  if (kind === "beaches") return "beach" as const;
  if (kind === "stays") return "stay" as const;
  return "historic" as const;
}
