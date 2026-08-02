import { NextResponse } from "next/server";

import {
  isUnifiedSearchKind,
  normalizeSearchIsland,
  searchUnifiedTravelKnowledge,
} from "@/lib/unified-search";

export const dynamic = "force-static";

export function GET(request: Request) {
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") || "").trim();
  const requestedKind = url.searchParams.get("kind");
  const kind = isUnifiedSearchKind(requestedKind) ? requestedKind : "all";
  const island = normalizeSearchIsland(url.searchParams.get("island"));
  const requestedLimit = Number(url.searchParams.get("limit") || 24);
  const limit = Number.isFinite(requestedLimit) ? requestedLimit : 24;

  const results = searchUnifiedTravelKnowledge({ query, kind, island, limit }).map(({ item, kind: resultKind, score, href }) => ({
    id: item.id,
    slug: item.slug,
    name: item.name,
    description: item.description,
    category: item.category,
    island: item.island,
    heroImage: item.heroImage,
    tags: item.tags,
    featured: Boolean(item.featured),
    kind: resultKind,
    score,
    href,
  }));

  return NextResponse.json({
    query,
    kind,
    island,
    count: results.length,
    results,
  });
}
