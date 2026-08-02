import { buildDirectoryMapHref } from "@/lib/discovery/map-links";
import { searchUnifiedTravelKnowledge } from "@/lib/unified-search";
import type { ConciergeContext } from "@/types/concierge";
import type { DirectoryIsland } from "@/types/directory";

export type ConciergeDirectoryEvidence = {
  id: string;
  type: "place" | "beach" | "stay" | "historic";
  name: string;
  description: string;
  category: string;
  island: DirectoryIsland;
  islandName: string;
  estateGeoid: string | null;
  href: string;
  mapHref: string;
  rideHref: string;
  lat: number | null;
  lng: number | null;
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
      const type = mapKind(result.kind);
      const estateBoost =
        selectedGeoid && result.item.estateGeoid === selectedGeoid ? 8 : 0;
      const mapHref = buildDirectoryMapHref(result.item, type);

      return {
        id: result.item.id,
        type,
        name: result.item.name,
        description: result.item.description.slice(0, 280),
        category: result.item.category || type,
        island: result.item.island,
        islandName: islandLabel(result.item.island),
        estateGeoid: result.item.estateGeoid ?? null,
        href: result.href,
        mapHref,
        rideHref: buildRideHref(result.item),
        lat:
          typeof result.item.lat === "number" && Number.isFinite(result.item.lat)
            ? result.item.lat
            : null,
        lng:
          typeof result.item.lng === "number" && Number.isFinite(result.item.lng)
            ? result.item.lng
            : null,
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

function buildRideHref(item: {
  island: DirectoryIsland;
  name: string;
  estateGeoid?: string;
  lat?: number;
  lng?: number;
}) {
  const params = new URLSearchParams({
    island: item.island,
    destination: item.name,
  });
  if (item.estateGeoid) params.set("to", item.estateGeoid);
  if (typeof item.lat === "number") params.set("toLat", String(item.lat));
  if (typeof item.lng === "number") params.set("toLng", String(item.lng));
  return `/mobility?${params.toString()}`;
}

function islandLabel(island: DirectoryIsland) {
  if (island === "stj") return "St. John";
  if (island === "stx") return "St. Croix";
  return "St. Thomas";
}
