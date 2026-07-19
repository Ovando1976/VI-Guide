import { access, readFile, writeFile, mkdir } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

const TEXT_PATH = path.resolve("data/geographic-dictionary.txt");
const OUTPUT_DIR = path.resolve("data/derived");
const RAW_OUTPUT_PATH = path.resolve(
  OUTPUT_DIR,
  "geographic-dictionary-entries.json"
);
const NORMALIZED_OUTPUT_PATH = path.resolve(
  OUTPUT_DIR,
  "geographic-dictionary-estates.normalized.json"
);
const APP_OUTPUT_PATH = path.resolve(
  OUTPUT_DIR,
  "geographic-dictionary-estates.app.json"
);

type IslandCode = "stt" | "stj" | "stx" | "unknown";

type RawExtractedEntry = {
  raw: string;
  name: string;
  normalizedName: string;
  aliases: string[];
  island: IslandCode;
  context: string[];
};

type NormalizedEstateEntry = {
  source: "geographic_dictionary";
  sourceType: "estate";
  rawName: string;
  name: string;
  normalizedName: string;
  aliases: string[];
  island: IslandCode;
  dictionarySummary: string;
  raw: string;
  context: string[];
};

type AppEstateSeed = {
  id: string;
  name: string;
  normalizedName: string;
  aliases: string[];
  island: Exclude<IslandCode, "unknown">;
  source: "geographic_dictionary";
  dictionarySummary: string;
};

async function readDictionaryText() {
  try {
    await access(TEXT_PATH, constants.F_OK);
  } catch {
    throw new Error(
      `Missing ${TEXT_PATH}. Run: node scripts/export-geographic-dictionary-text.mjs`
    );
  }

  return readFile(TEXT_PATH, "utf8");
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeSearchText(value: string): string {
  return normalizeWhitespace(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,;:()[\]{}!?'"`“”’]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function titleCaseLoose(value: string): string {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/\b[a-z]/g, (char) => char.toUpperCase());
}

function cleanLine(line: string): string {
  return normalizeWhitespace(
    line
      .replace(/[‐-–—]/g, "-")
      .replace(/\s+([,.;:])/g, "$1")
      .replace(/([([])\s+/g, "$1")
      .replace(/\s+([)\]])/g, "$1")
  );
}

function isPageMarker(line: string): boolean {
  return /^<PARSED TEXT FOR PAGE:\s*\d+\s*\/\s*\d+>$/i.test(line.trim());
}

function isMostlyNoise(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (trimmed.length <= 1) return true;
  if (/^\d+$/.test(trimmed)) return true;
  if (/^[xivlcdm]+$/i.test(trimmed)) return true;
  return false;
}

function compressSpacedCaps(value: string): string {
  return value.replace(/\b(?:[A-Z]\s+){2,}[A-Z]\b/g, (match) =>
    match.replace(/\s+/g, "")
  );
}

function inferIsland(text: string): IslandCode {
  const v = normalizeSearchText(text);

  if (
    v.includes("saint thomas") ||
    v.includes("st thomas") ||
    v.includes("r tthomas") ||
    v.includes("st. thomas") ||
    v.includes("charlotte amalie") ||
    v.includes("red hook") ||
    v.includes("bovoni") ||
    v.includes("brewers bay") ||
    v.includes("frenchtown") ||
    v.includes("nazareth") ||
    v.includes("new quarter") ||
    v.includes("fortuna") ||
    v.includes("southside quarter") ||
    v.includes("northside quarter") ||
    v.includes("east end quarter") ||
    v.includes("tutu")
  ) {
    return "stt";
  }

  if (
    v.includes("saint john") ||
    v.includes("st john") ||
    v.includes("st. john") ||
    v.includes("cruz bay") ||
    v.includes("coral bay") ||
    v.includes("centerline road") ||
    v.includes("cinnamon bay") ||
    v.includes("maho bay") ||
    v.includes("susannaberg")
  ) {
    return "stj";
  }

  if (
    v.includes("saint croix") ||
    v.includes("st croix") ||
    v.includes("st. croix") ||
    v.includes("st uroix") ||
    v.includes("st. uroix") ||
    v.includes("i8tcroix") ||
    v.includes("christiansted") ||
    v.includes("frederiksted") ||
    v.includes("kingshill") ||
    v.includes("king quarter") ||
    v.includes("company quarter") ||
    v.includes("companyquarter") ||
    v.includes("queen quarter") ||
    v.includes("prince quarter") ||
    v.includes("west end quarter") ||
    v.includes("eastendaquarter") ||
    v.includes("eastendbquarter") ||
    v.includes("east end a quarter") ||
    v.includes("east end b quarter") ||
    v.includes("northsideaquarter") ||
    v.includes("northsidebquarter") ||
    v.includes("northside a quarter") ||
    v.includes("northside b quarter")
  ) {
    return "stx";
  }

  return "unknown";
}

function buildAliases(name: string): string[] {
  const base = normalizeSearchText(name);
  const aliases = new Set<string>();

  if (!base) return [];

  aliases.add(base);
  aliases.add(base.replace(/\s+/g, ""));

  if (!base.startsWith("estate ")) {
    aliases.add(`estate ${base}`);
  } else {
    aliases.add(base.replace(/^estate\s+/, ""));
  }

  return [...aliases].filter(Boolean);
}

function looksLikeEstateEntry(line: string): boolean {
  const cleaned = cleanLine(line);
  const lower = normalizeSearchText(cleaned);

  if (!cleaned.includes(";")) return false;

  return (
    lower.includes(" estate,") ||
    lower.includes(";estate,") ||
    lower.includes("; estate,") ||
    lower.includes(" old estate") ||
    lower.includes(" plantage") ||
    lower.includes(" plantation")
  );
}

function isLikelyBadHead(candidate: string): boolean {
  const normalized = normalizeSearchText(candidate);

  if (!normalized) return true;
  if (normalized.startsWith("and ")) return true;
  if (/^\d/.test(normalized)) return true;
  if (/^and\d/.test(normalized)) return true;
  if (normalized.includes(" same as ")) return true;
  if (normalized.includes(" variant of ")) return true;
  if (normalized.includes(" formerly ")) return true;
  if (normalized.includes(" old estate ")) return true;
  if (candidate.split(" ").length > 5) return true;

  const alphaOnly = candidate.replace(/[^A-Za-z\s'-]/g, "");
  if (!alphaOnly.trim()) return true;

  return false;
}

function normalizeHeadword(candidate: string): string {
  return titleCaseLoose(
    compressSpacedCaps(candidate)
      .replace(/$begin:math:text$\[\^\)\]\*$end:math:text$/g, "")
      .replace(/["“”]/g, "")
      .replace(/\.$/, "")
      .trim()
  );
}

function extractCandidateName(line: string): string | null {
  const cleaned = compressSpacedCaps(cleanLine(line));

  if (!looksLikeEstateEntry(cleaned)) return null;

  const rawHead = cleaned.split(";")[0]?.trim() ?? "";
  if (!rawHead) return null;

  const candidate = normalizeHeadword(rawHead);

  if (candidate.length < 2 || candidate.length > 60) return null;
  if (!/[A-Za-z]/.test(candidate)) return null;
  if (isLikelyBadHead(candidate)) return null;

  return candidate;
}

function dedupeEntries(entries: RawExtractedEntry[]): RawExtractedEntry[] {
  const byName = new Map<string, RawExtractedEntry>();

  for (const entry of entries) {
    const key = entry.normalizedName;
    const existing = byName.get(key);

    if (!existing) {
      byName.set(key, {
        ...entry,
        aliases: [...new Set(entry.aliases)],
        context: [...new Set(entry.context)],
      });
      continue;
    }

    byName.set(key, {
      ...existing,
      aliases: [...new Set([...existing.aliases, ...entry.aliases])],
      context: [...new Set([...existing.context, ...entry.context])],
      island: existing.island === "unknown" ? entry.island : existing.island,
    });
  }

  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function looksLikeNewEntryBoundary(line: string): boolean {
  const cleaned = compressSpacedCaps(cleanLine(line));
  if (!cleaned) return false;
  if (isPageMarker(cleaned) || isMostlyNoise(cleaned)) return false;
  return looksLikeEstateEntry(cleaned);
}

function collectContext(lines: string[], startIndex: number): string[] {
  const context: string[] = [lines[startIndex]];

  for (let i = startIndex + 1; i < lines.length; i += 1) {
    const next = lines[i];
    if (!next) continue;
    if (looksLikeNewEntryBoundary(next)) break;
    if (context.length >= 3) break;
    context.push(next);
  }

  return context;
}

function parseDictionary(text: string): RawExtractedEntry[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => !isPageMarker(line))
    .filter((line) => !isMostlyNoise(line))
    .map(cleanLine)
    .filter(Boolean);

  const entries: RawExtractedEntry[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const name = extractCandidateName(line);
    if (!name) continue;

    const context = collectContext(lines, i);
    const combinedContext = context.join(" ");
    const normalizedName = normalizeSearchText(name);

    entries.push({
      raw: line,
      name,
      normalizedName,
      aliases: buildAliases(name),
      island: inferIsland(combinedContext),
      context,
    });
  }

  return dedupeEntries(entries);
}

function shouldKeepNormalizedEntry(entry: RawExtractedEntry): boolean {
  const n = entry.normalizedName;
  const first = normalizeSearchText(entry.context[0] || "");

  if (!n) return false;
  if (n.startsWith("and")) return false;
  if (/^\d/.test(n)) return false;
  if (/^and\d/.test(n)) return false;
  if (n.length < 3) return false;

  if (
    first.includes(" same as ") &&
    !first.includes(" estate") &&
    !first.includes(" plantage") &&
    !first.includes(" plantation")
  ) {
    return false;
  }

  if (
    first.includes(" hill,") ||
    first.includes(" bay,") ||
    first.includes(" point,") ||
    first.includes(" cay,") ||
    first.includes(" mountain,") ||
    first.includes(" ridge,")
  ) {
    return false;
  }

  return true;
}

function buildDictionarySummary(context: string[]): string {
  const summary = context.join(" ").replace(/\s+/g, " ").trim();
  return summary.length > 320 ? `${summary.slice(0, 317)}...` : summary;
}

function normalizeEstateEntry(
  entry: RawExtractedEntry
): NormalizedEstateEntry | null {
  if (!shouldKeepNormalizedEntry(entry)) return null;

  const rawName = entry.name.trim();
  const cleanedName = rawName
    .replace(/\bPlantage\b/i, "")
    .replace(/\bEstate\b/i, "")
    .replace(/\s+/g, " ")
    .trim();

  const finalName = titleCaseLoose(cleanedName || rawName).replace(
    /\bS\b/g,
    "s"
  );

  const normalizedName = normalizeSearchText(finalName);
  if (!normalizedName) return null;

  const aliases = [...new Set([...buildAliases(finalName), ...entry.aliases])];

  return {
    source: "geographic_dictionary",
    sourceType: "estate",
    rawName: entry.name,
    name: finalName,
    normalizedName,
    aliases,
    island: entry.island,
    dictionarySummary: buildDictionarySummary(entry.context),
    raw: entry.raw,
    context: entry.context,
  };
}

function dedupeNormalizedEntries(
  entries: NormalizedEstateEntry[]
): NormalizedEstateEntry[] {
  const byName = new Map<string, NormalizedEstateEntry>();

  for (const entry of entries) {
    const existing = byName.get(entry.normalizedName);

    if (!existing) {
      byName.set(entry.normalizedName, {
        ...entry,
        aliases: [...new Set(entry.aliases)].sort(),
      });
      continue;
    }

    byName.set(entry.normalizedName, {
      ...existing,
      aliases: [...new Set([...existing.aliases, ...entry.aliases])].sort(),
      island: existing.island === "unknown" ? entry.island : existing.island,
      dictionarySummary:
        existing.dictionarySummary.length >= entry.dictionarySummary.length
          ? existing.dictionarySummary
          : entry.dictionarySummary,
    });
  }

  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function toAppEstateSeed(entry: NormalizedEstateEntry): AppEstateSeed | null {
  if (entry.island === "unknown") return null;

  return {
    id: `gd-${entry.island}-${entry.normalizedName.replace(/\s+/g, "-")}`,
    name: entry.name,
    normalizedName: entry.normalizedName,
    aliases: [...new Set(entry.aliases)].sort(),
    island: entry.island,
    source: "geographic_dictionary",
    dictionarySummary: entry.dictionarySummary,
  };
}

async function main() {
  const text = await readDictionaryText();

  const rawEntries = parseDictionary(text).filter((entry) => {
    const first = normalizeSearchText(entry.context[0] || "");
    return (
      first.includes(" estate") ||
      first.includes(";estate") ||
      first.includes(" old estate") ||
      first.includes(" plantage") ||
      first.includes(" plantation")
    );
  });

  const normalizedEntries = dedupeNormalizedEntries(
    rawEntries
      .map((entry) => normalizeEstateEntry(entry))
      .filter((entry): entry is NormalizedEstateEntry => entry !== null)
  );

  const appEntries = normalizedEntries
    .map((entry) => toAppEstateSeed(entry))
    .filter((entry): entry is AppEstateSeed => entry !== null)
    .sort((a, b) => a.name.localeCompare(b.name));

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(RAW_OUTPUT_PATH, JSON.stringify(rawEntries, null, 2), "utf8");
  await writeFile(
    NORMALIZED_OUTPUT_PATH,
    JSON.stringify(normalizedEntries, null, 2),
    "utf8"
  );
  await writeFile(APP_OUTPUT_PATH, JSON.stringify(appEntries, null, 2), "utf8");

  console.log(
    `Wrote ${rawEntries.length} raw extracted entries to ${RAW_OUTPUT_PATH}`
  );
  console.log(
    `Wrote ${normalizedEntries.length} normalized estate entries to ${NORMALIZED_OUTPUT_PATH}`
  );
  console.log(
    `Wrote ${appEntries.length} app estate seed entries to ${APP_OUTPUT_PATH}`
  );
  console.log("Normalized sample:");
  console.log(normalizedEntries.slice(0, 10));
}
main().catch((error) => {
  console.error("Dictionary extraction failed:", error);
  process.exit(1);
});
