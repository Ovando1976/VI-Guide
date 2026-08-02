import { getTravelKnowledge, type TravelKnowledgeKind } from "@/lib/travel-knowledge";
import type { DirectoryItem } from "@/types/directory";

export type UnifiedSearchKind = "all" | TravelKnowledgeKind;

export type UnifiedSearchResult = {
  item: DirectoryItem;
  kind: TravelKnowledgeKind;
  score: number;
  href: string;
};

const KINDS: TravelKnowledgeKind[] = ["places", "beaches", "stays", "historic"];

export function searchUnifiedTravelKnowledge({
  query = "",
  kind = "all",
  island = null,
  limit = 60,
}: {
  query?: string;
  kind?: UnifiedSearchKind;
  island?: string | null;
  limit?: number;
}): UnifiedSearchResult[] {
  const normalizedQuery = query.trim();
  const terms = normalizedQuery.toLowerCase().split(/\s+/).filter(Boolean);
  const selectedKinds = kind === "all" ? KINDS : [kind];
  const results: UnifiedSearchResult[] = [];

  for (const currentKind of selectedKinds) {
    for (const item of getTravelKnowledge(currentKind)) {
      if (island && item.island !== island) continue;
      const score = scoreItem(item, terms);
      if (normalizedQuery && score <= 0) continue;
      results.push({ item, kind: currentKind, score, href: getResultHref(currentKind, item.slug) });
    }
  }

  return results
    .sort((a, b) => b.score - a.score || Number(Boolean(b.item.featured)) - Number(Boolean(a.item.featured)) || a.item.name.localeCompare(b.item.name))
    .slice(0, Math.max(1, Math.min(limit, 100)));
}

export function isUnifiedSearchKind(value: string | null | undefined): value is UnifiedSearchKind {
  return value === "all" || value === "places" || value === "beaches" || value === "stays" || value === "historic";
}

export function normalizeSearchIsland(value: string | null | undefined) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  return normalized === "stt" || normalized === "stj" || normalized === "stx" ? normalized : null;
}

function scoreItem(item: DirectoryItem, terms: string[]) {
  if (!terms.length) return item.featured ? 10 : 1;
  const name = item.name.toLowerCase();
  const category = (item.category || "").toLowerCase();
  const description = (item.description || "").toLowerCase();
  const tags = item.tags.join(" ").toLowerCase();
  const address = (item.address || "").toLowerCase();
  let score = 0;

  for (const term of terms) {
    if (name === term) score += 40;
    else if (name.includes(term)) score += 18;
    if (category.includes(term)) score += 9;
    if (tags.includes(term)) score += 6;
    if (address.includes(term)) score += 4;
    if (description.includes(term)) score += 2;
  }

  return score;
}

function getResultHref(kind: TravelKnowledgeKind, slug: string) {
  if (kind === "places") return `/places/${slug}`;
  if (kind === "beaches") return `/beaches/${slug}`;
  if (kind === "stays") return `/accommodations/${slug}`;
  return `/historic/${slug}`;
}
