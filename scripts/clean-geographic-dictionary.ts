import fs from "node:fs/promises";
import path from "node:path";

type GeographicDictionaryEntry = {
  id: string;
  slug: string;
  canonicalName: string;
  normalizedName?: string;
  featureType: string;
  island: string;
  quarter?: string | null;
  description?: string;
  shortDescription?: string;
  rawText?: string;
  aliases?: string[];
  obsoleteNames?: string[];
  variantSpellings?: string[];
  linguisticEquivalents?: string[];
  relatedEntryIds?: string[];
  relatedHistoricSiteIds?: string[];
  relatedEstateGeoids?: string[];
  relatedPlaceIds?: string[];
  searchTokens?: string[];
  parseWarnings?: string[];
  parseConfidence?: number;
  needsReview?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

const INPUT_PATH = path.join(process.cwd(), "data", "generated", "geographic-dictionary-normalized.json");
const OUTPUT_PATH = path.join(process.cwd(), "data", "generated", "geographic-dictionary-cleaned.json");
const REVIEW_PATH = path.join(process.cwd(), "data", "generated", "geographic-dictionary-review.json");

const BLOCKED_NAME_FRAGMENTS = [
  "GEOGRAPHICDICTIONARY", "GEOGRAPHIC DICTIONARY", "VIRGIN ISLANDS", "U.S.COAST", "U.S. COAST",
  "COASTANDGEODETIC", "COAST AND GEODETIC", "DEPARTMENT OF COMMERCE", "COAST PILOT",
  "GOVERNMENT PRINTING OFFICE", "WASHINGTON", "ERRATA NOTICE", "PREFACE", "CONTENTS",
];

const NARRATIVE_NAME_FRAGMENTS = [
  "thevegetationof", "theclimate", "thegroupwas", "theviewof", "theislandsare",
  "publicschools", "grammar school", "junior high", "populationabout", "totalpopulation",
];

const BAD_PREFIXES = ["U.S.", "U S ", "GEOGRAPHIC", "DEPARTMENT", "CONTENTS", "PREFACE"];
const ALLOWED_ISLANDS = new Set(["STT", "STJ", "STX", "UNKNOWN"]);
const FEATURE_TYPE_KEYWORDS: Record<string, string[]> = {
  bay: [" bay", " cove", " harbor", " harbour", " bight", " sound"],
  harbor: [" harbor", " harbour", " basin", " roadstead"],
  point: [" point", " pointe", " bluff", " cape", " head"],
  estate: [" estate", " plantation", " plantage", " quarter"],
  hill: [" hill", " mountain", " peak", " ridge", " knoll", " berg"],
  road: [" road", " lane", " path", " way", " trail"],
  gut: [" gut", " ghaut", " ghaut"],
  cay: [" cay", " key", " island", " islet", " rock"],
  quarter: [" quarter", " district"],
  harbor_feature: [" wharf", " dock", " landing"],
};

function normalizeWhitespace(value: string) { return value.replace(/\s+/g, " ").trim(); }
function normalizeGeoText(value: string) {
  return normalizeWhitespace(value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[‘’'\"]/g, "").replace(/&/g, " and ").replace(/[^a-zA-Z0-9.\- ]+/g, " ").toLowerCase());
}
function titleCaseLoose(value: string) {
  return normalizeWhitespace(value.toLowerCase().split(" ").map((part) => {
    if (!part) return part;
    if (part === "st." || part === "st") return "St.";
    if (part === "u.s." || part === "us") return "U.S.";
    return part.charAt(0).toUpperCase() + part.slice(1);
  }).join(" "));
}
function stripLeadingNoise(value: string) { return normalizeWhitespace(value.replace(/^[0-9&.,;:()\- ]+/, "").replace(/^(and|the)\s+/i, "")); }
function cleanCanonicalName(value: string) {
  let v = normalizeWhitespace(value);
  v = v.replace(/\s*;\s*$/, "").replace(/\s*\.\s*$/, "").replace(/^[^A-Za-z0-9(]+/, "").replace(/[^A-Za-z0-9.)]+$/, "");
  v = stripLeadingNoise(v);
  if (/^[A-Z0-9.\-()]+$/.test(v) && !/^St\./.test(v)) v = titleCaseLoose(v);
  return normalizeWhitespace(v);
}
function hasTooManyWeirdCharacters(value: string) { return (value.match(/[^A-Za-z0-9 .,'()\-]/g) || []).length >= 4; }
function tooManyCaps(value: string) {
  const caps = (value.match(/[A-Z]/g) || []).length;
  const lowers = (value.match(/[a-z]/g) || []).length;
  return caps >= 12 && lowers <= 2 && !value.includes("St.");
}
function looksLikeNarrativeArtifact(value: string) {
  const normalized = normalizeGeoText(value).replace(/\s+/g, "");
  if (NARRATIVE_NAME_FRAGMENTS.some((fragment) => normalized.includes(fragment.replace(/\s+/g, "")))) return true;
  if (value.length >= 45 && !/\s/.test(value)) return true;
  const wordishRuns = value.match(/[A-Za-z]{10,}/g) || [];
  return wordishRuns.length >= 3 && value.length >= 55;
}
function looksLikeHeaderOrJunkName(value: string) {
  const v = normalizeWhitespace(value);
  const upper = v.toUpperCase();
  if (!v || v.length < 3 || v.length > 90 || hasTooManyWeirdCharacters(v)) return true;
  if ((v.match(/[.;:()]/g) || []).length >= 4 || /[0-9]{3,}/.test(v) || /^[^A-Za-z]+$/.test(v) || tooManyCaps(v)) return true;
  if (BLOCKED_NAME_FRAGMENTS.some((x) => upper.includes(x)) || BAD_PREFIXES.some((x) => upper.startsWith(x))) return true;
  if (looksLikeNarrativeArtifact(v)) return true;
  return false;
}
function looksLikeMergedParagraph(value: string) {
  const compact = value.replace(/\s/g, "");
  return compact.length > 45 && (!value.includes(" ") || /[a-z]{8,}[A-Z][a-z]{5,}/.test(value));
}
function inferIsland(entry: GeographicDictionaryEntry) {
  const text = `${entry.canonicalName} ${entry.shortDescription || ""} ${entry.description || ""} ${entry.rawText || ""}`.toUpperCase();
  const hasSTT = /\bST\.\s*THOMAS\b|\bST THOMAS\b/.test(text);
  const hasSTJ = /\bST\.\s*JOHN\b|\bST JOHN\b/.test(text);
  const hasSTX = /\bST\.\s*CROIX\b|\bST CROIX\b/.test(text);
  if (hasSTT && !hasSTJ && !hasSTX) return "STT";
  if (hasSTJ && !hasSTT && !hasSTX) return "STJ";
  if (hasSTX && !hasSTT && !hasSTJ) return "STX";
  return entry.island && ALLOWED_ISLANDS.has(entry.island) ? entry.island : "UNKNOWN";
}
function inferFeatureType(entry: GeographicDictionaryEntry) {
  const haystack = normalizeGeoText(`${entry.canonicalName} ${entry.shortDescription || ""} ${entry.description || ""}`);
  for (const [type, keywords] of Object.entries(FEATURE_TYPE_KEYWORDS)) {
    if (keywords.some((k) => haystack.includes(k.trim()))) return type === "harbor_feature" ? "harbor" : type;
  }
  return entry.featureType || "place";
}
function dedupeStrings(values: string[] | undefined) {
  const seen = new Set<string>(); const out: string[] = [];
  for (const value of values || []) {
    const cleaned = normalizeWhitespace(value || ""); if (!cleaned) continue;
    const key = normalizeGeoText(cleaned); if (!key || seen.has(key)) continue;
    seen.add(key); out.push(cleaned);
  }
  return out;
}
function buildSearchTokens(entry: GeographicDictionaryEntry) {
  const tokens = new Set<string>();
  const add = (value?: string) => {
    const cleaned = normalizeGeoText(value || ""); if (!cleaned) return;
    tokens.add(cleaned); for (const part of cleaned.split(" ")) if (part.length >= 3) tokens.add(part);
  };
  add(entry.canonicalName); add(entry.normalizedName); add(entry.shortDescription); add(entry.description);
  for (const value of entry.aliases || []) add(value);
  for (const value of entry.variantSpellings || []) add(value);
  for (const value of entry.obsoleteNames || []) add(value);
  for (const value of entry.linguisticEquivalents || []) add(value);
  return Array.from(tokens).slice(0, 80);
}
function scoreEntry(entry: GeographicDictionaryEntry) {
  let score = 100;
  if (entry.parseConfidence != null) score += Math.round((entry.parseConfidence - 1) * 20);
  if (entry.island === "UNKNOWN") score -= 15;
  if (entry.needsReview) score -= 10;
  if (looksLikeMergedParagraph(entry.canonicalName)) score -= 50;
  if ((entry.canonicalName.match(/[.()]/g) || []).length >= 3) score -= 20;
  if ((entry.shortDescription || "").length < 12) score -= 5;
  if ((entry.description || "").length < 20) score -= 5;
  return score;
}
function cleanEntry(entry: GeographicDictionaryEntry) {
  const canonicalName = cleanCanonicalName(entry.canonicalName || "");
  if (looksLikeHeaderOrJunkName(canonicalName)) return null;
  const cleaned: GeographicDictionaryEntry = {
    ...entry,
    canonicalName,
    slug: normalizeGeoText(canonicalName).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || entry.id,
    normalizedName: normalizeGeoText(canonicalName),
    shortDescription: normalizeWhitespace(entry.shortDescription || entry.description || ""),
    description: normalizeWhitespace(entry.description || entry.shortDescription || ""),
    island: inferIsland({ ...entry, canonicalName }),
    featureType: inferFeatureType({ ...entry, canonicalName }),
    aliases: dedupeStrings(entry.aliases), obsoleteNames: dedupeStrings(entry.obsoleteNames),
    variantSpellings: dedupeStrings(entry.variantSpellings), linguisticEquivalents: dedupeStrings(entry.linguisticEquivalents),
    relatedEntryIds: Array.isArray(entry.relatedEntryIds) ? entry.relatedEntryIds : [],
    relatedHistoricSiteIds: Array.isArray(entry.relatedHistoricSiteIds) ? entry.relatedHistoricSiteIds : [],
    relatedEstateGeoids: Array.isArray(entry.relatedEstateGeoids) ? entry.relatedEstateGeoids : [],
    relatedPlaceIds: Array.isArray(entry.relatedPlaceIds) ? entry.relatedPlaceIds : [],
    quarter: typeof entry.quarter === "string" ? normalizeWhitespace(entry.quarter) : null,
  };
  cleaned.searchTokens = buildSearchTokens(cleaned);
  cleaned.parseConfidence = typeof cleaned.parseConfidence === "number" ? cleaned.parseConfidence : 1;
  const warnings = new Set(cleaned.parseWarnings || []);
  if (cleaned.island === "UNKNOWN") warnings.add("Island not inferred");
  if (looksLikeMergedParagraph(cleaned.canonicalName)) warnings.add("Possible merged OCR text");
  cleaned.parseWarnings = Array.from(warnings);
  const qualityScore = scoreEntry(cleaned);
  cleaned.needsReview = qualityScore < 65 || cleaned.parseWarnings.length > 1;
  return { cleaned, qualityScore };
}

export const dictionaryCleanerInternals = { cleanCanonicalName, looksLikeHeaderOrJunkName, looksLikeNarrativeArtifact, inferIsland };

async function main() {
  const raw = await fs.readFile(INPUT_PATH, "utf8");
  const entries = JSON.parse(raw) as GeographicDictionaryEntry[];
  const cleaned: GeographicDictionaryEntry[] = [];
  const review: Array<GeographicDictionaryEntry & { qualityScore: number }> = [];
  const dropped: Array<{ id: string; canonicalName: string }> = [];
  for (const entry of entries) {
    const result = cleanEntry(entry);
    if (!result) { dropped.push({ id: entry.id, canonicalName: entry.canonicalName }); continue; }
    cleaned.push(result.cleaned);
    if (result.cleaned.needsReview) review.push({ ...result.cleaned, qualityScore: result.qualityScore });
  }
  cleaned.sort((a, b) => a.canonicalName.localeCompare(b.canonicalName));
  review.sort((a, b) => a.qualityScore - b.qualityScore);
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(cleaned, null, 2), "utf8");
  await fs.writeFile(REVIEW_PATH, JSON.stringify(review, null, 2), "utf8");
  console.log(`Input entries: ${entries.length}`);
  console.log(`Cleaned entries: ${cleaned.length}`);
  console.log(`Dropped entries: ${dropped.length}`);
  console.log(`Needs review: ${review.length}`);
  console.log(`Wrote: ${OUTPUT_PATH}`);
  console.log(`Wrote: ${REVIEW_PATH}`);
  if (dropped.length) {
    console.log("Sample dropped entries:");
    for (const item of dropped.slice(0, 20)) console.log(`- ${item.id}: ${item.canonicalName}`);
  }
}

if (process.argv[1]?.endsWith("clean-geographic-dictionary.ts")) {
  main().catch((error) => { console.error("Geographic dictionary cleanup failed:", error); process.exit(1); });
}
