import { NextRequest, NextResponse } from "next/server";
import { getTerritoryCatalogStats, queryTerritoryEntities } from "@/lib/territory";
import type { IslandCode } from "@/types/usvi";
import type { TerritoryEntityKind } from "@/types/territory";

const islands = new Set<IslandCode>(["stt", "stj", "stx"]);
const kinds = new Set<TerritoryEntityKind>([
  "estate", "place", "beach", "historic", "stay", "transport",
  "service", "event", "route", "activity",
]);

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const islandValue = params.get("island") as IslandCode | null;
  const island = islandValue && islands.has(islandValue) ? islandValue : undefined;
  const requestedKinds = (params.get("kinds") ?? "")
    .split(",")
    .map((value) => value.trim() as TerritoryEntityKind)
    .filter((value) => kinds.has(value));
  const categories = (params.get("categories") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const entities = queryTerritoryEntities({
    island,
    kinds: requestedKinds.length ? requestedKinds : undefined,
    categories: categories.length ? categories : undefined,
    text: params.get("q") ?? undefined,
    positionedOnly: params.get("positioned") === "true",
  });

  return NextResponse.json({
    entities,
    count: entities.length,
    catalog: getTerritoryCatalogStats(),
  });
}
