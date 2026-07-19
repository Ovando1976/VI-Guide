import type {
  GeographicDictionaryEntry,
  RawDictionaryEntry,
} from "@/types/geographic";
import {
  buildSearchTokens,
  normalizeGeoText,
  slugifyGeoName,
  uniqueStrings,
} from "@/lib/geographic-normalize";
import { inferFeatureType, inferIsland } from "@/lib/geographic-classify";

const PAGE_MARKER_RE = /<PARSED TEXT FOR PAGE:\s*(\d+)\s*\/\s*(\d+)>/g;

function isLikelyHeading(line: string) {
  const value = line.trim();
  if (!value) return false;
  if (value.length > 80) return false;
  if (/\d{3,}/.test(value)) return false;
  if (/^[^A-Za-z]+$/.test(value)) return false;

  const alphaCount = (value.match(/[A-Za-z]/g) || []).length;
  if (alphaCount < 3) return false;

  const wordCount = value.split(/\s+/).length;
  if (wordCount > 8) return false;

  const looksTitleCase =
    /^[A-Z][A-Za-z'’`().\-]*(\s+[A-Z][A-Za-z'’`().\-]*)*$/.test(value);

  const looksUpperCase = /^[A-Z0-9'’`().,\-/\s]+$/.test(value);

  return looksTitleCase || looksUpperCase;
}

function sanitizeDictionaryText(input: string) {
  return input
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function extractRawDictionaryEntries(
  fullText: string
): RawDictionaryEntry[] {
  const cleaned = sanitizeDictionaryText(fullText);
  const lines = cleaned.split("\n");

  const entries: RawDictionaryEntry[] = [];
  let currentHeading: string | null = null;
  let currentBody: string[] = [];
  let currentPage: number | null = null;

  function flush() {
    if (!currentHeading) return;

    const body = currentBody.join("\n").trim();
    if (!body) return;

    entries.push({
      heading: currentHeading,
      body,
      pageStart: currentPage,
      pageEnd: currentPage,
    });
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    const pageMatch = line.match(
      /^<PARSED TEXT FOR PAGE:\s*(\d+)\s*\/\s*\d+>$/
    );
    if (pageMatch) {
      currentPage = Number(pageMatch[1]);
      continue;
    }

    if (isLikelyHeading(line)) {
      flush();
      currentHeading = line.replace(/:$/, "").trim();
      currentBody = [];
      continue;
    }

    if (currentHeading) {
      currentBody.push(rawLine);
    }
  }

  flush();

  return dedupeRawEntries(entries);
}

function dedupeRawEntries(entries: RawDictionaryEntry[]) {
  const map = new Map<string, RawDictionaryEntry>();

  for (const entry of entries) {
    const key = normalizeGeoText(entry.heading);
    if (!key) continue;

    const existing = map.get(key);
    if (!existing || entry.body.length > existing.body.length) {
      map.set(key, entry);
    }
  }

  return [...map.values()];
}

export function normalizeRawDictionaryEntry(
  raw: RawDictionaryEntry
): GeographicDictionaryEntry {
  const warnings: string[] = [];
  const now = new Date().toISOString();

  const canonicalName = raw.heading.trim();
  const rawText = raw.body.trim();
  const shortDescription =
    rawText
      .split(/\n+/)
      .join(" ")
      .split(/(?<=[.?!])\s+/)[0]
      ?.slice(0, 220) || "Geographic entry in the Virgin Islands.";

  const featureType = inferFeatureType(canonicalName, rawText);
  const island = inferIsland(rawText, inferIsland(canonicalName, "UNKNOWN"));

  const parseConfidence = [
    canonicalName ? 0.3 : 0,
    rawText ? 0.3 : 0,
    island !== "UNKNOWN" ? 0.2 : 0,
    featureType !== "other" ? 0.2 : 0,
  ].reduce((a, b) => a + b, 0);

  if (island === "UNKNOWN") warnings.push("Island not inferred");
  if (featureType === "other") warnings.push("Feature type not inferred");

  return {
    id: slugifyGeoName(canonicalName),
    slug: slugifyGeoName(canonicalName),
    canonicalName,
    normalizedName: normalizeGeoText(canonicalName),

    featureType,
    island,
    quarter: null,

    aliases: [],
    linguisticEquivalents: [],
    obsoleteNames: [],
    variantSpellings: [],

    description: rawText,
    shortDescription,
    rawText,

    coordinates: undefined,
    altitudeFeet: null,
    areaEnglishSqUnits: null,
    bayWidthYards: null,

    historicalNotes: null,
    scenicNotes: null,
    nameOrigin: null,

    relatedEntryIds: [],
    relatedEstateGeoids: [],
    relatedPlaceIds: [],
    relatedHistoricSiteIds: [],

    searchTokens: buildSearchTokens([canonicalName, rawText]),

    source: {
      title: "Geographic Dictionary of the Virgin Islands of the United States",
      year: 1925,
      pageStart: raw.pageStart,
      pageEnd: raw.pageEnd,
    },

    parseConfidence: Number(parseConfidence.toFixed(2)),
    parseWarnings: warnings,
    needsReview: parseConfidence < 0.8,

    createdAt: now,
    updatedAt: now,
  };
}
