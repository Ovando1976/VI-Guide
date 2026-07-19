import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type IslandCode = "stt" | "stj" | "stx";

type EnrichedEstate = {
  geoid: string;
  state?: string;
  county?: string;
  baseName: string;
  fullName?: string;
  normalizedName: string;
  estateCode?: string | null;
  island: IslandCode;
  centroid?: { lat: number; lng: number };
  internalPoint?: { lat: number; lng: number };
  geometry?: unknown;
  aliases: string[];
  historicalNotes: string[];
  sources: string[];
  dictionaryMatches?: Array<{
    id: string;
    name: string;
    normalizedName: string;
    dictionarySummary: string;
    matchReason: string;
  }>;
};

type FirestoreEstateDoc = {
  geoid: string;
  baseName: string;
  fullName: string;
  normalizedName: string;
  estateCode: string | null;
  island: IslandCode;
  county: string | null;
  centroid: { lat: number; lng: number } | null;
  internalPoint: { lat: number; lng: number } | null;
  geometry: unknown | null;
  aliases: string[];
  historicalAliases: string[];
  historicalNotes: string[];
  sources: string[];
};

const INPUT_PATH = path.resolve(
  "data/derived/estates.enriched-with-dictionary.json"
);
const OUTPUT_DIR = path.resolve("data/derived");
const OUTPUT_PATH = path.resolve(OUTPUT_DIR, "estates.firestore-import.json");

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean).map(normalizeWhitespace))].sort(
    (a, b) => a.localeCompare(b)
  );
}

async function main() {
  const raw = await readFile(INPUT_PATH, "utf8");
  const estates = JSON.parse(raw) as EnrichedEstate[];

  const docs: FirestoreEstateDoc[] = estates.map((estate) => ({
    geoid: estate.geoid,
    baseName: estate.baseName,
    fullName: estate.fullName || `Estate ${estate.baseName}`,
    normalizedName: estate.normalizedName,
    estateCode: estate.estateCode ?? null,
    island: estate.island,
    county: estate.county ?? null,
    centroid: estate.centroid ?? null,
    internalPoint: estate.internalPoint ?? null,
    geometry: estate.geometry ?? null,
    aliases: uniqueSorted(estate.aliases ?? []),
    historicalAliases: uniqueSorted(
      (estate.dictionaryMatches ?? []).flatMap((match) => [
        match.name,
        match.normalizedName,
      ])
    ),
    historicalNotes: uniqueSorted(estate.historicalNotes ?? []),
    sources: uniqueSorted(estate.sources ?? []),
  }));

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(docs, null, 2), "utf8");

  console.log(`Wrote ${docs.length} Firestore estate docs to ${OUTPUT_PATH}`);
  console.log(docs.slice(0, 5));
}

main().catch((error) => {
  console.error("Build Firestore estate import failed:", error);
  process.exit(1);
});
