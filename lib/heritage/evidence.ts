import {
  getAllHeritageRecords,
  type HeritageRecord,
} from "@/lib/heritage/knowledge";
import type { DirectoryIsland } from "@/types/directory";

export type HeritageEvidence = {
  id: string;
  type: HeritageRecord["type"];
  title: string;
  summary: string;
  category: string;
  island: DirectoryIsland | null;
  href: string;
  heroImage?: string;
  estateGeoid?: string;
  reviewStatus: HeritageRecord["provenance"]["reviewStatus"];
  score: number;
};

const IGNORED_TOKENS = new Set([
  "about",
  "after",
  "before",
  "could",
  "from",
  "have",
  "help",
  "history",
  "island",
  "looking",
  "need",
  "please",
  "show",
  "that",
  "there",
  "this",
  "want",
  "what",
  "where",
  "with",
  "would",
]);

function meaningfulTokens(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((token) => token.length > 2 && !IGNORED_TOKENS.has(token));
}

function recordHaystack(record: HeritageRecord) {
  return [
    record.title,
    record.type,
    record.category,
    record.summary,
    record.significance,
    record.dateStart,
    record.dateEnd,
    ...record.searchTerms,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function rankHeritageEvidence(parameters: {
  query: string;
  island?: DirectoryIsland | null;
  estateGeoid?: string | null;
  limit?: number;
  records?: readonly HeritageRecord[];
}): HeritageEvidence[] {
  const records = parameters.records ?? getAllHeritageRecords();
  const tokens = meaningfulTokens(parameters.query);
  const normalizedQuery = parameters.query.trim().toLowerCase();
  const limit = Math.max(1, Math.min(parameters.limit ?? 12, 30));

  return records
    .filter(
      (record) =>
        !parameters.island || !record.island || record.island === parameters.island,
    )
    .map((record) => {
      const haystack = recordHaystack(record);
      const exactTitleScore =
        normalizedQuery && record.title.toLowerCase() === normalizedQuery ? 18 : 0;
      const titlePhraseScore =
        normalizedQuery && record.title.toLowerCase().includes(normalizedQuery) ? 10 : 0;
      const tokenScore = tokens.reduce((score, token) => {
        const titleMatch = record.title.toLowerCase().includes(token) ? 5 : 0;
        const bodyMatch = haystack.includes(token) ? 2 : 0;
        return score + titleMatch + bodyMatch;
      }, 0);
      const estateScore =
        parameters.estateGeoid && record.map?.estateGeoid === parameters.estateGeoid
          ? 7
          : 0;
      const canonicalScore = record.provenance.reviewStatus === "canonical" ? 2 : 0;

      return {
        record,
        score: exactTitleScore + titlePhraseScore + tokenScore + estateScore + canonicalScore,
      };
    })
    .filter(({ score }) => score > 0 || tokens.length === 0)
    .sort((a, b) => b.score - a.score || a.record.title.localeCompare(b.record.title))
    .slice(0, limit)
    .map(({ record, score }) => ({
      id: record.id,
      type: record.type,
      title: record.title,
      summary: record.summary.slice(0, 320),
      category: record.category ?? record.type,
      island: record.island ?? null,
      href:
        record.href ??
        (record.type === "place"
          ? `/historic/${encodeURIComponent(record.slug)}`
          : `/heritage?record=${encodeURIComponent(record.slug)}`),
      ...(record.heroImage ? { heroImage: record.heroImage } : {}),
      ...(record.map?.estateGeoid ? { estateGeoid: record.map.estateGeoid } : {}),
      reviewStatus: record.provenance.reviewStatus,
      score,
    }));
}
