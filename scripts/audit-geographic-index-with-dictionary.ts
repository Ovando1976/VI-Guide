// @ts-nocheck

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  geographicIndexItems,
  geographicIndexMeta,
} from "../src/data/core/geographicIndex";

type IslandCode = "st_thomas" | "st_john" | "st_croix" | "water_island" | "";

type DictionaryEntry = {
  id: string;
  name: string;
  normalizedName: string;
  kind: string;
  island: IslandCode;
  description: string;
  aliases?: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
  source?: Record<string, unknown>;
  extraction?: {
    confidence: "high" | "medium" | "low";
    needsReview: boolean;
    notes: string[];
  };
};

const ROOT = process.cwd();

const DICTIONARY_JSON = path.join(
  ROOT,
  "src/data/generated/geographicDictionaryEntries.json",
);

const REPORT_DIR = path.join(ROOT, "reports");

const OUT_AUDIT_JSON = path.join(
  REPORT_DIR,
  "geographic-dictionary-index-audit.json",
);

const OUT_MISSING_JSON = path.join(
  REPORT_DIR,
  "geographic-dictionary-missing-candidates.json",
);

const OUT_VERIFIED_JSON = path.join(
  REPORT_DIR,
  "geographic-dictionary-verified-index-records.json",
);

const OUT_LOOSE_JSON = path.join(
  REPORT_DIR,
  "geographic-dictionary-loose-review-matches.json",
);

const OUT_SKIPPED_MALFORMED_JSON = path.join(
  REPORT_DIR,
  "geographic-dictionary-skipped-malformed.json",
);

const OUT_MD = path.join(
  REPORT_DIR,
  "geographic-dictionary-index-audit.md",
);

function normalizeName(value: unknown) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[Ææ]/g, "ae")
    .replace(/[Øø]/g, "o")
    .replace(/[Åå]/g, "a")
    .toLowerCase()
    .replace(/\bst[.\s]+/g, "st ")
    .replace(/\bestate\b/g, "")
    .replace(/\bplantage\b/g, "")
    .replace(/\bplantation\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slugify(value: string) {
  return normalizeName(value).replace(/\s+/g, "-").replace(/^-+|-+$/g, "");
}

function normalizeIsland(value: unknown): IslandCode {
  const raw = String(value || "").toLowerCase().trim();

  if (["st_thomas", "stt", "saint_thomas", "st-thomas", "st thomas"].includes(raw)) {
    return "st_thomas";
  }

  if (["st_john", "stj", "saint_john", "st-john", "st john", "st jan"].includes(raw)) {
    return "st_john";
  }

  if (["st_croix", "stx", "saint_croix", "st-croix", "st croix"].includes(raw)) {
    return "st_croix";
  }

  if (["water_island", "wat", "water-island", "water island"].includes(raw)) {
    return "water_island";
  }

  return "";
}

function getIndexName(item: any) {
  return (
    item.name ||
    item.title ||
    item.label ||
    item.canonicalName ||
    item.displayName ||
    item.properties?.name ||
    item.properties?.Name ||
    ""
  );
}

function getIndexIsland(item: any): IslandCode {
  return normalizeIsland(
    item.island ||
      item.islandCode ||
      item.properties?.island ||
      item.properties?.islandCode ||
      "",
  );
}

function getIndexKind(item: any) {
  return String(
    item.type ||
      item.kind ||
      item.category ||
      item.properties?.type ||
      item.properties?.kind ||
      "",
  ).toLowerCase();
}

function getIndexAliases(item: any) {
  const possible = [
    item.aliases,
    item.alternateNames,
    item.alternativeNames,
    item.historicalNames,
    item.variantNames,
    item.properties?.aliases,
    item.properties?.alternateNames,
    item.properties?.historicalNames,
  ];

  return possible.flatMap((value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === "string") return value.split(/,|;/).map((part) => part.trim());
    return [];
  });
}

function mapDictionaryKindToType(kind: string) {
  if (kind === "alias") return "dictionaryEntry";
  if (kind === "estate") return "estate";
  if (kind === "bay") return "bay";
  if (kind === "quarter") return "quarter";
  if (kind === "hill") return "hill";
  if (kind === "cay") return "cay";
  if (kind === "island") return "island";
  if (kind === "settlement") return "place";
  if (kind === "fort") return "fort";
  if (kind === "harbor") return "harbor";
  if (kind === "lagoon") return "lagoon";
  if (kind === "pond") return "pond";
  if (kind === "road") return "road";
  if (kind === "point") return "point";
  if (kind === "gut") return "gut";
  if (kind === "marine_feature") return "marine_feature";

  return "dictionaryEntry";
}

function dictionaryCandidateToIndexSource(entry: DictionaryEntry, looseMatches: any[] = []) {
  const baseName = entry.name;
  const island = normalizeIsland(entry.island);

  const aliases = Array.from(
    new Set([...(entry.aliases || [])].map((alias) => alias.trim()).filter(Boolean)),
  );

  const type = mapDictionaryKindToType(entry.kind);

  return {
    id: `gdvi:${island || "unknown"}:${slugify(baseName)}`,
    name: baseName,
    title: baseName,
    displayName: baseName,
    normalizedName: normalizeName(baseName),
    slug: `gdvi-${island || "unknown"}-${slugify(baseName)}`,
    type,
    category: type,
    source: "geographic-dictionary-1925",
    sources: ["geographic-dictionary-1925"],
    island,
    description: entry.description,
    aliases,
    historicalNames: aliases,
    coordinates: entry.coordinates,
    confidence: entry.extraction?.confidence || "medium",
    needsReview:
      (entry.extraction?.needsReview ?? false) ||
      !island ||
      type === "dictionaryEntry" ||
      looseMatches.length > 0,
    reviewNotes: [
      ...(entry.extraction?.notes || []),
      ...(!island ? ["Island could not be verified."] : []),
      ...(looseMatches.length > 0
        ? ["Loose name matches exist, but no same-island exact match was found."]
        : []),
    ],
    dictionaryMeta: {
      sourceTitle: "Geographic Dictionary of the Virgin Islands of the United States",
      publicationYear: 1925,
      sourceEntryId: entry.id,
      extractedKind: entry.kind,
      extractionConfidence: entry.extraction?.confidence || "medium",
      needsReview: entry.extraction?.needsReview ?? true,
      notes: entry.extraction?.notes || [],
      looseMatches: looseMatches.map((item) => ({
        id: item.id,
        name: getIndexName(item),
        type: getIndexKind(item),
        island: getIndexIsland(item),
      })),
    },
  };
}

function compactMatch(item: any) {
  return {
    id: item.id,
    name: getIndexName(item),
    type: getIndexKind(item),
    island: getIndexIsland(item),
    source: item.source,
    sources: item.sources || [],
  };
}

function addLookup(map: Map<string, any[]>, key: string, item: any) {
  if (!key) return;
  if (!map.has(key)) map.set(key, []);
  map.get(key)!.push(item);
}

function main() {
  if (!existsSync(DICTIONARY_JSON)) {
    throw new Error(
      `Missing ${DICTIONARY_JSON}. Run: npx tsx scripts/extract-geographic-dictionary.ts`,
    );
  }

  mkdirSync(REPORT_DIR, { recursive: true });

  const dictionaryEntries = JSON.parse(
    readFileSync(DICTIONARY_JSON, "utf8"),
  ) as DictionaryEntry[];

  const indexItems = Array.isArray(geographicIndexItems)
    ? geographicIndexItems
    : [];

  const islandLookup = new Map<string, any[]>();
  const looseLookup = new Map<string, any[]>();

  for (const item of indexItems) {
    const names = [
      getIndexName(item),
      item.normalizedName,
      ...getIndexAliases(item),
    ]
      .map(normalizeName)
      .filter(Boolean);

    const island = getIndexIsland(item);

    for (const name of names) {
      addLookup(looseLookup, name, item);
      addLookup(islandLookup, `${island}|${name}`, item);
    }
  }

  const verified: any[] = [];
  const missing: any[] = [];
  const possibleDuplicates: any[] = [];
  const looseReviewMatches: any[] = [];
  const skippedMalformed: any[] = [];
  const needsReview: any[] = [];

  for (const entry of dictionaryEntries) {
    const primaryNormalizedName = normalizeName(entry.name || entry.normalizedName);

    if (
      !primaryNormalizedName ||
      ["estate", "bay", "point", "island", "hill", "cay", "quarter"].includes(primaryNormalizedName)
    ) {
      skippedMalformed.push({
        dictionaryEntry: entry,
        reason: "Malformed or generic extracted dictionary name.",
      });
      continue;
    }

    const entryIsland = normalizeIsland(entry.island);

    const namesToCheck = [
      entry.name,
      entry.normalizedName,
      ...(entry.aliases || []),
    ]
      .map(normalizeName)
      .filter(Boolean);

    const exactMatches = new Map<string, any>();
    const looseMatches = new Map<string, any>();

    for (const name of namesToCheck) {
      if (entryIsland) {
        for (const match of islandLookup.get(`${entryIsland}|${name}`) || []) {
          exactMatches.set(match.id || JSON.stringify(match).slice(0, 100), match);
        }
      }

      for (const match of looseLookup.get(name) || []) {
        looseMatches.set(match.id || JSON.stringify(match).slice(0, 100), match);
      }
    }

    const exactMatchList = [...exactMatches.values()];
    const looseMatchList = [...looseMatches.values()];

    if (exactMatchList.length > 0) {
      verified.push({
        dictionaryEntry: entry,
        matchMode: "same-island",
        matchedIndexRecords: exactMatchList.map(compactMatch),
      });

      if (exactMatchList.length > 1) {
        possibleDuplicates.push({
          dictionaryEntry: entry,
          matchMode: "same-island",
          matchedIndexRecords: exactMatchList.map(compactMatch),
        });
      }

      continue;
    }

    if (!entryIsland && looseMatchList.length > 0) {
      verified.push({
        dictionaryEntry: entry,
        matchMode: "loose-name-unknown-island",
        matchedIndexRecords: looseMatchList.map(compactMatch),
      });

      looseReviewMatches.push({
        dictionaryEntry: entry,
        reason: "Unknown-island dictionary entry matched by name only.",
        matchedIndexRecords: looseMatchList.map(compactMatch),
      });

      continue;
    }

    if (entryIsland && looseMatchList.length > 0) {
      looseReviewMatches.push({
        dictionaryEntry: entry,
        reason: "Known-island dictionary entry matched only outside same-island lookup.",
        matchedIndexRecords: looseMatchList.map(compactMatch),
      });
    }

    const candidate = dictionaryCandidateToIndexSource(entry, looseMatchList);

    missing.push(candidate);

    if (
      candidate.needsReview ||
      !candidate.island ||
      candidate.type === "dictionaryEntry" ||
      looseMatchList.length > 0
    ) {
      needsReview.push(candidate);
    }
  }

  const audit = {
    generatedAt: new Date().toISOString(),
    indexMeta: geographicIndexMeta,
    totals: {
      existingIndexRecords: indexItems.length,
      dictionaryEntries: dictionaryEntries.length,
      verified: verified.length,
      missing: missing.length,
      possibleDuplicates: possibleDuplicates.length,
      looseReviewMatches: looseReviewMatches.length,
      skippedMalformed: skippedMalformed.length,
      needsReview: needsReview.length,
    },
    byMissingType: missing.reduce<Record<string, number>>((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {}),
    byMissingIsland: missing.reduce<Record<string, number>>((acc, item) => {
      acc[item.island || "unknown"] = (acc[item.island || "unknown"] || 0) + 1;
      return acc;
    }, {}),
    possibleDuplicates,
    looseReviewMatches,
    needsReview,
  };

  writeFileSync(OUT_AUDIT_JSON, JSON.stringify(audit, null, 2));
  writeFileSync(OUT_MISSING_JSON, JSON.stringify(missing, null, 2));
  writeFileSync(OUT_VERIFIED_JSON, JSON.stringify(verified, null, 2));
  writeFileSync(OUT_LOOSE_JSON, JSON.stringify(looseReviewMatches, null, 2));
  writeFileSync(OUT_SKIPPED_MALFORMED_JSON, JSON.stringify(skippedMalformed, null, 2));

  const md = `# Geographic Dictionary Index Audit

Generated: ${audit.generatedAt}

## Totals

| Metric | Count |
|---|---:|
| Existing clean index records | ${audit.totals.existingIndexRecords} |
| Extracted dictionary entries | ${audit.totals.dictionaryEntries} |
| Verified records | ${audit.totals.verified} |
| Missing candidates | ${audit.totals.missing} |
| Possible duplicate groups | ${audit.totals.possibleDuplicates} |
| Loose review matches | ${audit.totals.looseReviewMatches} |
| Skipped malformed extraction fragments | ${audit.totals.skippedMalformed} |
| Needs review | ${audit.totals.needsReview} |

## Missing by type

${Object.entries(audit.byMissingType)
  .sort((a, b) => b[1] - a[1])
  .map(([type, count]) => `- ${type}: ${count}`)
  .join("\n") || "- None"}

## Missing by island

${Object.entries(audit.byMissingIsland)
  .sort((a, b) => b[1] - a[1])
  .map(([island, count]) => `- ${island}: ${count}`)
  .join("\n") || "- None"}

## Review files

- Missing candidates: \`reports/geographic-dictionary-missing-candidates.json\`
- Loose review matches: \`reports/geographic-dictionary-loose-review-matches.json\`
- Verified records: \`reports/geographic-dictionary-verified-index-records.json\`

## Next step

Use this audit against the clean unified index. Promote only records that have a verified island and no loose-match conflict.
`;

  writeFileSync(OUT_MD, md);

  console.log("Geographic Dictionary index audit complete.");
  console.log(audit.totals);
  console.log(`Audit: ${OUT_AUDIT_JSON}`);
  console.log(`Missing candidates: ${OUT_MISSING_JSON}`);
  console.log(`Loose review matches: ${OUT_LOOSE_JSON}`);
  console.log(`Verified records: ${OUT_VERIFIED_JSON}`);
  console.log(`Markdown report: ${OUT_MD}`);
}

main();
