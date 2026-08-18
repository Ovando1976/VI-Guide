import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type IslandCode = "stt" | "stj" | "stx";
type DictionaryEstate = {
  id?: string;
  name?: string;
  rawName?: string;
  normalizedName?: string;
  aliases?: string[];
  island?: IslandCode | "unknown";
  dictionarySummary?: string;
};
type DictionaryMatch = {
  id?: string;
  name?: string;
  normalizedName?: string;
  dictionarySummary?: string;
  matchReason?: string;
};
type Estate = {
  geoid: string;
  baseName: string;
  fullName?: string;
  island: IslandCode;
  aliases?: string[];
  historicalAliases?: string[];
  dictionaryMatches?: DictionaryMatch[];
  [key: string]: unknown;
};
type ManualLink = { dictionaryId: string; modernGeoid: string };
type ReviewCandidate = {
  modernEstate: { geoid: string; baseName: string; island: IslandCode };
  dictionaryEntry: { id?: string; name?: string; normalizedName?: string };
  reason: string;
  score: number;
};

const ESTATES_PATH = path.resolve("data/derived/estates.enriched-with-dictionary.json");
const DICTIONARY_PATH = path.resolve("data/derived/geographic-dictionary-estates.normalized.json");
const MANUAL_LINKS_PATH = path.resolve("data/derived/geographic-dictionary-manual-links.json");
const REVIEW_PATH = path.resolve("data/derived/estates.dictionary-review-candidates.json");

function normalize(value: unknown): string {
  return String(value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, " and ").replace(/\bestate\b/g, " ").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}
function slug(value: unknown): string { return normalize(value).replace(/\s+/g, "-"); }
function dictionaryNames(entry: DictionaryEstate): string[] {
  return [...new Set([entry.name, entry.rawName, entry.normalizedName, ...(entry.aliases ?? [])].map(normalize).filter(Boolean))];
}
function estateNames(estate: Estate): string[] {
  return [...new Set([estate.baseName, estate.fullName, ...(estate.aliases ?? []), ...(estate.historicalAliases ?? [])].map(normalize).filter(Boolean))];
}
function generatedDictionaryId(entry: DictionaryEstate): string | undefined {
  const island = entry.island;
  const name = slug(entry.normalizedName ?? entry.name ?? entry.rawName);
  return island && island !== "unknown" && name ? `gd-${island}-${name}` : undefined;
}
function asMatch(entry: DictionaryEstate, reason: string): DictionaryMatch {
  return { id: entry.id ?? generatedDictionaryId(entry), name: entry.name ?? entry.rawName, normalizedName: entry.normalizedName ?? normalize(entry.name ?? entry.rawName), dictionarySummary: entry.dictionarySummary, matchReason: reason };
}

async function main() {
  const [estateRaw, dictionaryRaw, manualRaw] = await Promise.all([
    readFile(ESTATES_PATH, "utf8"), readFile(DICTIONARY_PATH, "utf8"), readFile(MANUAL_LINKS_PATH, "utf8").catch(() => "[]"),
  ]);
  const estates = JSON.parse(estateRaw) as Estate[];
  const dictionary = JSON.parse(dictionaryRaw) as DictionaryEstate[];
  const manualLinks = JSON.parse(manualRaw) as ManualLink[];

  const dictionaryById = new Map<string, DictionaryEstate>();
  for (const entry of dictionary) {
    if (entry.id) dictionaryById.set(entry.id, entry);
    const generated = generatedDictionaryId(entry);
    if (generated) dictionaryById.set(generated, entry);
  }
  const manualByGeoid = new Map<string, DictionaryEstate[]>();
  for (const link of manualLinks) {
    const entry = dictionaryById.get(link.dictionaryId);
    if (!entry) {
      console.warn(`Skipping stale manual dictionary link: ${link.dictionaryId} -> ${link.modernGeoid}`);
      continue;
    }
    const current = manualByGeoid.get(link.modernGeoid) ?? [];
    current.push(entry); manualByGeoid.set(link.modernGeoid, current);
  }

  const review: ReviewCandidate[] = [];
  let exact = 0, alias = 0, manual = 0, ambiguous = 0, missing = 0;
  for (const estate of estates) {
    const manualMatches = manualByGeoid.get(estate.geoid) ?? [];
    if (manualMatches.length) { estate.dictionaryMatches = manualMatches.map((entry) => asMatch(entry, "manual-geoid-link")); manual++; continue; }
    const modern = normalize(estate.baseName);
    const names = new Set(estateNames(estate));
    const sameIsland = dictionary.filter((entry) => entry.island === estate.island);
    const exactCandidates = sameIsland.filter((entry) => normalize(entry.name ?? entry.rawName) === modern || normalize(entry.normalizedName) === modern);
    if (exactCandidates.length === 1) { estate.dictionaryMatches = [asMatch(exactCandidates[0], "exact-same-island-name")]; exact++; continue; }
    const aliasCandidates = sameIsland.filter((entry) => dictionaryNames(entry).some((name) => names.has(name)));
    const candidates = exactCandidates.length > 1 ? exactCandidates : aliasCandidates;
    if (candidates.length === 1) { estate.dictionaryMatches = [asMatch(candidates[0], "verified-same-island-alias")]; alias++; continue; }
    estate.dictionaryMatches = [];
    if (candidates.length > 1) {
      ambiguous++;
      for (const entry of candidates) review.push({ modernEstate: { geoid: estate.geoid, baseName: estate.baseName, island: estate.island }, dictionaryEntry: { id: entry.id ?? generatedDictionaryId(entry), name: entry.name ?? entry.rawName, normalizedName: entry.normalizedName }, reason: "ambiguous-same-island-name-or-alias", score: exactCandidates.includes(entry) ? 1 : 0.9 });
    } else missing++;
  }
  review.sort((a, b) => a.modernEstate.island.localeCompare(b.modernEstate.island) || a.modernEstate.baseName.localeCompare(b.modernEstate.baseName));
  await Promise.all([writeFile(ESTATES_PATH, JSON.stringify(estates, null, 2) + "\n", "utf8"), writeFile(REVIEW_PATH, JSON.stringify(review, null, 2) + "\n", "utf8")]);
  console.log("USVI estate dictionary enrichment complete");
  console.log({ total: estates.length, exact, alias, manual, ambiguous, missing, reviewCandidates: review.length });
}
main().catch((error) => { console.error("Estate dictionary enrichment failed:", error); process.exit(1); });
