import { getAllHeritageRecords } from "@/lib/heritage/knowledge";
import {
  GENERIC_DIRECTORY_IMAGES,
  getIslandContextImage,
  isLocalIslandImage,
} from "@/lib/intelligence/island-ui-images";
import { buildDefaultIslandPresentationPlan, normalizeIslandPresentationPlan } from "@/lib/intelligence/island-ui-plan";
import {
  getTravelKnowledge,
  type TravelKnowledgeKind,
} from "@/lib/travel-knowledge";
import type { DirectoryItem } from "@/types/directory";
import type {
  IntelligenceIsland,
  IntelligenceRecommendation,
  IntelligenceResponse,
} from "@/types/intelligence";
import type {
  IslandDataProvenance,
  IslandTrustedBinding,
  IslandTrustedImage,
  IslandUIEnvelope,
  IslandUIPresentationPlan,
} from "@/types/island-workspace";

const DIRECTORY_KINDS = new Set<TravelKnowledgeKind>([
  "places",
  "beaches",
  "historic",
  "stays",
]);

function compact(values: Array<string | undefined>) {
  return Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean))) as string[];
}

function directoryRecordForRecommendation(
  recommendation: IntelligenceRecommendation,
): { kind: TravelKnowledgeKind; item: DirectoryItem } | null {
  const separator = recommendation.id.indexOf(":");
  if (separator <= 0) return null;
  const kind = recommendation.id.slice(0, separator) as TravelKnowledgeKind;
  const sourceId = recommendation.id.slice(separator + 1);
  if (!DIRECTORY_KINDS.has(kind) || !sourceId) return null;
  const item = getTravelKnowledge(kind).find((candidate) => candidate.id === sourceId);
  return item ? { kind, item } : null;
}

export function resolveTrustedDirectoryImage(item: DirectoryItem): IslandTrustedImage {
  const local = isLocalIslandImage(item.heroImage) && !GENERIC_DIRECTORY_IMAGES.has(item.heroImage);
  const hasSource = Boolean(item.imageSourceUrl?.trim());
  if (local && (item.imageStatus === "verified" || hasSource)) {
    return Object.freeze({
      src: item.heroImage,
      alt: `${item.name} in the U.S. Virgin Islands`,
      status: item.imageStatus === "verified" ? ("verified" as const) : ("sourced" as const),
      ...(hasSource ? { sourceUrl: item.imageSourceUrl } : {}),
    });
  }
  return getIslandContextImage(item.island);
}

function directoryProvenance(item: DirectoryItem): IslandDataProvenance {
  return Object.freeze({
    sourceSystem: "travel-knowledge" as const,
    sourceId: item.id,
    reviewStatus: item.verifiedAt ? "verified-record" : "catalog-record",
    ...(item.sourceLabel ? { sourceLabel: item.sourceLabel } : {}),
    sourceUrls: Object.freeze(compact([...(item.sourceUrls ?? []), item.sourceUrl])),
    ...(item.verifiedAt ? { verifiedAt: item.verifiedAt } : {}),
  });
}

function directoryBinding(
  recommendation: IntelligenceRecommendation,
  kind: TravelKnowledgeKind,
  item: DirectoryItem,
): IslandTrustedBinding {
  const href =
    kind === "beaches"
      ? `/beaches/${item.slug}`
      : kind === "stays"
        ? `/accommodations/${item.slug}`
        : kind === "historic"
          ? `/historic/${item.slug}`
          : `/places/${item.slug}`;
  return Object.freeze({
    id: recommendation.id,
    title: item.name,
    kind,
    island: item.island,
    summary: item.description,
    image: resolveTrustedDirectoryImage(item),
    provenance: directoryProvenance(item),
    href,
    ...(recommendation.mapHref ? { mapHref: recommendation.mapHref } : {}),
  });
}

function heritageBinding(
  recommendation: IntelligenceRecommendation,
): IslandTrustedBinding | null {
  const record = getAllHeritageRecords().find((candidate) => candidate.id === recommendation.id);
  if (!record) return null;
  const island = (record.island ?? recommendation.island) as IntelligenceIsland;
  const localHero = record.heroImage && isLocalIslandImage(record.heroImage)
    ? record.heroImage
    : record.images.find((image) => isLocalIslandImage(image));
  const image: IslandTrustedImage = localHero && record.provenance.reviewStatus !== "needs-review"
    ? Object.freeze({
        src: localHero,
        alt: `${record.title} — USVI Explorer heritage image`,
        status: record.provenance.reviewStatus === "canonical" ? ("verified" as const) : ("sourced" as const),
      })
    : getIslandContextImage(island);
  const sourceUrls = compact(record.sources.map((source) => source.url));
  return Object.freeze({
    id: recommendation.id,
    title: record.title,
    kind: record.type,
    island,
    summary: record.summary,
    image,
    provenance: Object.freeze({
      sourceSystem: "heritage-knowledge" as const,
      sourceId: record.provenance.sourceId,
      reviewStatus: record.provenance.reviewStatus,
      sourceUrls: Object.freeze(sourceUrls),
    }),
    ...(record.href ? { href: record.href } : recommendation.href ? { href: recommendation.href } : {}),
    ...(recommendation.mapHref ? { mapHref: recommendation.mapHref } : {}),
  });
}

function fallbackBinding(
  recommendation: IntelligenceRecommendation,
): IslandTrustedBinding {
  return Object.freeze({
    id: recommendation.id,
    title: recommendation.title,
    kind: recommendation.kind,
    island: recommendation.island,
    summary: recommendation.summary,
    image: getIslandContextImage(recommendation.island),
    provenance: Object.freeze({
      sourceSystem: "response-fallback" as const,
      sourceId: recommendation.id,
      reviewStatus: "grounded-response",
      sourceUrls: Object.freeze([]),
    }),
    ...(recommendation.href ? { href: recommendation.href } : {}),
    ...(recommendation.mapHref ? { mapHref: recommendation.mapHref } : {}),
  });
}

export function resolveIslandRecommendationBinding(
  recommendation: IntelligenceRecommendation,
): IslandTrustedBinding {
  const directory = directoryRecordForRecommendation(recommendation);
  if (directory) return directoryBinding(recommendation, directory.kind, directory.item);
  return heritageBinding(recommendation) ?? fallbackBinding(recommendation);
}

export function buildIslandUIBindings(
  response: IntelligenceResponse,
): Readonly<Record<string, IslandTrustedBinding>> {
  const entries = response.recommendations.map((recommendation) => {
    const binding = resolveIslandRecommendationBinding(recommendation);
    return [recommendation.id, binding] as const;
  });
  return Object.freeze(Object.fromEntries(entries));
}

export type IntelligenceResponseWithIslandUI = IntelligenceResponse & {
  islandUI?: IslandUIEnvelope;
};

export function attachIslandUIEnvelope(
  response: IntelligenceResponse,
  rawPresentation?: unknown,
): IntelligenceResponseWithIslandUI {
  const presentation: IslandUIPresentationPlan = rawPresentation === undefined
    ? buildDefaultIslandPresentationPlan(response)
    : normalizeIslandPresentationPlan(rawPresentation, response);
  const envelope: IslandUIEnvelope = Object.freeze({
    version: 1 as const,
    presentation,
    bindings: buildIslandUIBindings(response),
  });
  return { ...response, islandUI: envelope };
}
