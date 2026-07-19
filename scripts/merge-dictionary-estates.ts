import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type IslandCode = "stt" | "stj" | "stx";

type ModernEstate = {
  geoid: string;
  state?: string;
  county?: string;
  baseName: string;
  normalizedName?: string;
  island: "stt" | "stj" | "stx";
  aliases?: string[];
  fullName?: string;
  estateCode?: string | null;
  centroid?: { lat: number; lng: number };
  internalPoint?: { lat: number; lng: number };
  geometry?: unknown;
};

type FlexibleModernEstateInput = {
  geoid?: string;
  id?: string;
  state?: string;
  county?: string;
  baseName?: string;
  name?: string;
  normalizedName?: string;
  island?: string;
  aliases?: string[];
  fullName?: string;
  estateCode?: string | null;
  centroid?: { lat: number; lng: number };
  internalPoint?: { lat: number; lng: number };
  geometry?: unknown;
};

type DictionaryEstateSeed = {
  id: string;
  name: string;
  normalizedName: string;
  aliases: string[];
  island: IslandCode;
  source: "geographic_dictionary";
  dictionarySummary: string;
};

type EnrichedEstate = {
  geoid: string;
  state?: string;
  county?: string;
  baseName: string;
  normalizedName: string;
  island: IslandCode;
  aliases: string[];
  historicalNotes: string[];
  sources: string[];
  dictionaryMatches: {
    id: string;
    name: string;
    normalizedName: string;
    dictionarySummary: string;
    matchReason: string;
  }[];
  fullName?: string;
  estateCode?: string | null;
  centroid?: { lat: number; lng: number };
  internalPoint?: { lat: number; lng: number };
  geometry?: unknown;
};

const MODERN_INPUT_PATH = path.resolve(
  "data/generated/modern-estates.normalized.json"
);
const DICTIONARY_INPUT_PATH = path.resolve(
  "data/derived/geographic-dictionary-estates.app.json"
);
const OUTPUT_DIR = path.resolve("data/derived");
const OUTPUT_PATH = path.resolve(
  OUTPUT_DIR,
  "estates.enriched-with-dictionary.json"
);
const REVIEW_OUTPUT_PATH = path.resolve(
  OUTPUT_DIR,
  "estates.dictionary-review-candidates.json"
);

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeName(value: string): string {
  return normalizeWhitespace(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[.,;:()[\]{}!?'"`“”’]/g, "")
    .replace(/\bestate\b/g, "")
    .replace(/\bplantage\b/g, "")
    .replace(/\bplantation\b/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function uniqueSorted(values: string[]): string[] {
  return [
    ...new Set(values.filter(Boolean).map((v) => normalizeWhitespace(v))),
  ].sort((a, b) => a.localeCompare(b));
}

function isIslandCode(value: string): value is IslandCode {
  return value === "stt" || value === "stj" || value === "stx";
}

async function loadJsonFile<T>(filePath: string): Promise<T> {
  const text = await readFile(filePath, "utf8");
  return JSON.parse(text) as T;
}

function toModernEstate(
  input: FlexibleModernEstateInput,
  index: number
): ModernEstate | null {
  const island =
    typeof input.island === "string" ? input.island.toLowerCase() : "";
  if (!isIslandCode(island)) return null;

  const baseName = input.baseName || input.name;
  if (!baseName || typeof baseName !== "string") return null;

  const geoid =
    typeof input.geoid === "string" && input.geoid.trim()
      ? input.geoid
      : typeof input.id === "string" && input.id.trim()
      ? input.id
      : `generated-${island}-${normalizeName(baseName).replace(
          /\s+/g,
          "-"
        )}-${index}`;

  return {
    geoid,
    state: typeof input.state === "string" ? input.state : undefined,
    county: typeof input.county === "string" ? input.county : undefined,
    baseName,
    normalizedName:
      typeof input.normalizedName === "string" && input.normalizedName.trim()
        ? input.normalizedName
        : normalizeName(baseName),
    island,
    aliases: Array.isArray(input.aliases) ? input.aliases : [],
    fullName: typeof input.fullName === "string" ? input.fullName : undefined,
    estateCode:
      typeof input.estateCode === "string" ? input.estateCode : undefined,
    centroid: input.centroid,
    internalPoint: input.internalPoint,
    geometry: input.geometry,
  };
}

function getModernAliases(estate: ModernEstate): string[] {
  const raw = [
    estate.baseName,
    estate.normalizedName,
    estate.fullName,
    estate.estateCode,
    ...(estate.aliases ?? []),
  ].filter(Boolean) as string[];

  return uniqueSorted(raw.map((value) => normalizeName(value)).filter(Boolean));
}

function getDictionaryAliases(entry: DictionaryEstateSeed): string[] {
  const raw = [
    entry.name,
    entry.normalizedName,
    ...(entry.aliases ?? []),
  ].filter(Boolean) as string[];

  return uniqueSorted(raw.map((value) => normalizeName(value)).filter(Boolean));
}

function tokenSet(value: string): Set<string> {
  return new Set(
    normalizeName(value)
      .split(" ")
      .map((part) => part.trim())
      .filter((part) => part.length >= 4)
  );
}

function jaccardScore(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;

  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }

  const union = new Set([...a, ...b]).size;
  return union ? intersection / union : 0;
}

function isGenericSingleWord(value: string): boolean {
  const generic = new Set([
    "little",
    "mount",
    "valley",
    "north",
    "south",
    "east",
    "west",
    "bay",
    "hill",
    "upper",
    "lower",
  ]);
  return generic.has(value);
}

function matchDictionaryEntry(
  modernEstate: ModernEstate,
  dictionaryEntry: DictionaryEstateSeed
): { matched: boolean; reason: string; score: number } {
  if (modernEstate.island !== dictionaryEntry.island) {
    return { matched: false, reason: "different_island", score: 0 };
  }

  const modernAliases = getModernAliases(modernEstate);
  const dictionaryAliases = getDictionaryAliases(dictionaryEntry);

  const modernSet = new Set(modernAliases);
  const dictionarySet = new Set(dictionaryAliases);

  for (const alias of modernSet) {
    if (dictionarySet.has(alias)) {
      return { matched: true, reason: `exact_alias:${alias}`, score: 1 };
    }
  }

  const modernNormalized = normalizeName(modernEstate.baseName);
  const dictionaryNormalized = normalizeName(dictionaryEntry.name);

  if (modernNormalized === dictionaryNormalized) {
    return { matched: true, reason: "exact_normalized_name", score: 0.98 };
  }

  const baseA = tokenSet(modernEstate.baseName);
  const baseB = tokenSet(dictionaryEntry.name);
  const similarity = jaccardScore(baseA, baseB);

  if (similarity >= 0.75) {
    return {
      matched: true,
      reason: `token_similarity:${similarity.toFixed(2)}`,
      score: similarity,
    };
  }

  const modernWords = modernNormalized.split(" ").filter((w) => w.length >= 4);
  const dictWords = dictionaryNormalized
    .split(" ")
    .filter((w) => w.length >= 4);
  const sharedWords = modernWords.filter((w) => dictWords.includes(w));
  const nonGenericSharedWords = sharedWords.filter(
    (w) => !isGenericSingleWord(w)
  );

  if (nonGenericSharedWords.length >= 2) {
    return {
      matched: true,
      reason: `shared_specific_words:${nonGenericSharedWords.join("|")}`,
      score: 0.7,
    };
  }

  return { matched: false, reason: "no_match", score: similarity };
}

function isStrongAutoMatch(reason: string, score: number): boolean {
  return (
    reason.startsWith("exact_alias:") ||
    reason === "exact_normalized_name" ||
    (reason.startsWith("token_similarity:") && score >= 0.75) ||
    (reason.startsWith("shared_specific_words:") && score >= 0.7)
  );
}

async function main() {
  const [modernInput, dictionaryEntries] = await Promise.all([
    loadJsonFile<FlexibleModernEstateInput[]>(MODERN_INPUT_PATH),
    loadJsonFile<DictionaryEstateSeed[]>(DICTIONARY_INPUT_PATH),
  ]);

  const modernEstates = modernInput
    .map((item, index) => toModernEstate(item, index))
    .filter((item): item is ModernEstate => item !== null);

  if (!modernEstates.length) {
    throw new Error(
      `No usable modern estates found in ${MODERN_INPUT_PATH}. Check field names like baseName/name, geoid/id, island.`
    );
  }

  const enriched: EnrichedEstate[] = [];
  const reviewCandidates: Array<{
    modernEstate: Pick<ModernEstate, "geoid" | "baseName" | "island">;
    dictionaryEntry: DictionaryEstateSeed;
    reason: string;
    score: number;
  }> = [];

  for (const modernEstate of modernEstates) {
    const matches = dictionaryEntries
      .map((entry) => {
        const result = matchDictionaryEntry(modernEstate, entry);
        return { entry, ...result };
      })
      .filter(
        (item) => item.matched && isStrongAutoMatch(item.reason, item.score)
      )
      .sort(
        (a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name)
      );

    const aliases = uniqueSorted([
      ...(modernEstate.aliases ?? []),
      modernEstate.baseName,
      ...matches.flatMap((item) => item.entry.aliases ?? []),
      ...matches.map((item) => item.entry.name),
    ]);

    const historicalNotes = uniqueSorted(
      matches.map((item) => item.entry.dictionarySummary)
    );

    const sources = uniqueSorted([
      "modern_estates",
      ...matches.map((item) => item.entry.source),
    ]);

    enriched.push({
      geoid: modernEstate.geoid,
      ...(modernEstate.state ? { state: modernEstate.state } : {}),
      ...(modernEstate.county ? { county: modernEstate.county } : {}),
      baseName: modernEstate.baseName,
      normalizedName:
        modernEstate.normalizedName && modernEstate.normalizedName.trim()
          ? modernEstate.normalizedName
          : normalizeName(modernEstate.baseName),
      island: modernEstate.island,
      aliases,
      historicalNotes,
      sources,
      dictionaryMatches: matches.map((item) => ({
        id: item.entry.id,
        name: item.entry.name,
        normalizedName: item.entry.normalizedName,
        dictionarySummary: item.entry.dictionarySummary,
        matchReason: item.reason,
      })),
      ...(modernEstate.fullName ? { fullName: modernEstate.fullName } : {}),
      ...(modernEstate.estateCode
        ? { estateCode: modernEstate.estateCode }
        : {}),
      ...(modernEstate.centroid ? { centroid: modernEstate.centroid } : {}),
      ...(modernEstate.internalPoint
        ? { internalPoint: modernEstate.internalPoint }
        : {}),
      ...(modernEstate.geometry ? { geometry: modernEstate.geometry } : {}),
    });
  }

  for (const dictionaryEntry of dictionaryEntries) {
    const scored = modernEstates
      .map((modernEstate) => {
        const result = matchDictionaryEntry(modernEstate, dictionaryEntry);
        return { modernEstate, ...result };
      })
      .filter((item) => item.score >= 0.25)
      .sort((a, b) => b.score - a.score);

    if (!scored.length) continue;

    const best = scored[0];

    if (isStrongAutoMatch(best.reason, best.score)) {
      continue;
    }

    reviewCandidates.push({
      modernEstate: {
        geoid: best.modernEstate.geoid,
        baseName: best.modernEstate.baseName,
        island: best.modernEstate.island,
      },
      dictionaryEntry,
      reason: best.reason,
      score: best.score,
    });
  }

  await mkdir(OUTPUT_DIR, { recursive: true });
  await Promise.all([
    writeFile(OUTPUT_PATH, JSON.stringify(enriched, null, 2), "utf8"),
    writeFile(
      REVIEW_OUTPUT_PATH,
      JSON.stringify(reviewCandidates, null, 2),
      "utf8"
    ),
  ]);

  console.log(
    `Loaded ${modernEstates.length} modern estates from ${MODERN_INPUT_PATH}`
  );
  console.log(`Wrote ${enriched.length} enriched estates to ${OUTPUT_PATH}`);
  console.log(
    `Wrote ${reviewCandidates.length} review candidates to ${REVIEW_OUTPUT_PATH}`
  );
  console.log("Sample enriched records:");
  console.log(enriched.slice(0, 5));
}

main().catch((error) => {
  console.error("Estate merge failed:", error);
  process.exit(1);
});
