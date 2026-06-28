// scripts/normalize-dictionary-text.ts

import fs from "node:fs/promises";
import path from "node:path";

const INPUT =
  process.env.INPUT ||
  path.join(process.cwd(), "generated/geographic-dictionary.entries.json");

const OUTPUT =
  process.env.OUTPUT ||
  path.join(process.cwd(), "generated/geographic-dictionary.entries.normalized.json");

const OUTPUT_TS =
  process.env.OUTPUT_TS ||
  path.join(process.cwd(), "src/data/geographicDictionaryEntries.ts");

type Entry = {
  id: string;
  sourceName: string;
  normalizedName: string;
  description: string;
  possibleIsland: string | null;
  possibleQuarter: string | null;
  [key: string]: unknown;
};

function normalizeOcrText(value: unknown) {
  return String(value ?? "")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\b8ame\b/g, "Same")
    .replace(/\b8t\./g, "St.")
    .replace(/\bSt\.\s*J o h n\b/gi, "St. John")
    .replace(/\bSt\.\s*T h o m a s\b/gi, "St. Thomas")
    .replace(/\bSt\.\s*C r o i x\b/gi, "St. Croix")
    .replace(/\bXey\b/g, "Key")
    .replace(/\bXeys\b/g, "Keys")
    .replace(/\bp\\rt\b/g, "part")
    .replace(/\bo t\b/g, "of")
    .replace(/\blat\.\s*/gi, "lat. ")
    .replace(/\blong\.\s*/gi, "long. ")
    .replace(/\bI'ostotke\b/g, "Post Office")
    .replace(/\bI'ostoffice\b/g, "Post Office")
    .replace(/\bPostotke\b/g, "Post Office")
    .replace(/\bIslnnd\b/g, "Island")
    .replace(/\bIslund\b/g, "Island")
    .replace(/\bQuttrter\b/g, "Quarter")
    .replace(/\bQuiirter\b/g, "Quarter")
    .replace(/\bEatate\b/g, "Estate")
    .replace(/\bBstate\b/g, "Estate")
    .replace(/\bICstate\b/g, "Estate")
    .replace(/\bOroix\b/g, "Croix")
    .replace(/\bCrok\b/g, "Croix")
    .replace(/\bThonras\b/g, "Thomas")
    .replace(/\bTho~nas\b/g, "Thomas")
    .replace(/\bJ o h n\b/g, "John")
    .replace(/\bTroix\b/g, "Croix")
    .replace(/\bDronning\)/g, "Dronning)")
    .replace(/\s+;/g, ";")
    .replace(/;\s*/g, "; ")
    .replace(/\s+,/g, ",")
    .replace(/,\s*/g, ", ")
    .replace(/\s+\./g, ".")
    .replace(/\.\s*/g, ". ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeName(value: unknown) {
  return normalizeOcrText(value)
    .replace(/^Estate\s+/i, "")
    .replace(/[,.;:].*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizedKey(value: unknown) {
  return normalizeName(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const raw = await fs.readFile(INPUT, "utf8");
  const entries = JSON.parse(raw) as Entry[];

  const normalized = entries.map((entry) => {
    const sourceName = normalizeName(entry.sourceName);
    const description = normalizeOcrText(entry.description);

    return {
      ...entry,
      id: normalizedKey(sourceName) || entry.id,
      sourceName,
      normalizedName: normalizedKey(sourceName),
      description,
    };
  });

  await fs.writeFile(OUTPUT, JSON.stringify(normalized, null, 2));

  await fs.writeFile(
    OUTPUT_TS,
    `export type GeographicDictionaryEntry = {
  id: string;
  sourceName: string;
  normalizedName: string;
  description: string;
  possibleIsland: string | null;
  possibleQuarter: string | null;
  [key: string]: unknown;
};

export const geographicDictionaryEntries: GeographicDictionaryEntry[] = ${JSON.stringify(
      normalized,
      null,
      2
    )};
`
  );

  console.log(`Normalized ${normalized.length} dictionary entries`);
  console.log(`Wrote ${OUTPUT}`);
  console.log(`Wrote ${OUTPUT_TS}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});