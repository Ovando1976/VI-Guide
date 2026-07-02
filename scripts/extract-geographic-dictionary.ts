// @ts-nocheck

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

type IslandCode = "st_thomas" | "st_john" | "st_croix" | "water_island" | "";

type DictionaryEntry = {
  id: string;
  name: string;
  normalizedName: string;
  kind: string;
  island: IslandCode;
  description: string;
  aliases: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
  source: {
    title: string;
    publicationYear: 1925;
    file: string;
  };
  extraction: {
    confidence: "high" | "medium" | "low";
    needsReview: boolean;
    notes: string[];
  };
};

const ROOT = process.cwd();

const PDF_PATH =
  process.argv.find((arg) => arg.startsWith("--pdf="))?.replace("--pdf=", "") ||
  path.join(ROOT, "source-materials/geographic-dictionary.pdf");

const OUT_JSON = path.join(
  ROOT,
  "src/data/generated/geographicDictionaryEntries.json",
);

const OUT_TS = path.join(
  ROOT,
  "src/data/generated/geographicDictionaryEntries.ts",
);

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[Ææ]/g, "ae")
    .replace(/[Øø]/g, "o")
    .replace(/[Åå]/g, "a")
    .toLowerCase()
    .replace(/st\./g, "st")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeName(value: string) {
  return value
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
    .replace(/\bhill\b/g, "hill")
    .replace(/\bbay\b/g, "bay")
    .replace(/\bcay\b/g, "cay")
    .replace(/\bpoint\b/g, "point")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}


async function parsePdfBuffer(buffer: Buffer) {
  const mod: any = await import("pdf-parse");

  // pdf-parse v1 compatibility
  if (typeof mod.default === "function") {
    return await mod.default(buffer);
  }

  // pdf-parse v2+ API
  if (typeof mod.PDFParse === "function") {
    const parser = new mod.PDFParse({ data: buffer });

    try {
      const result = await parser.getText();
      return {
        text: result.text || "",
        numpages: result.total || result.pages?.length || 0,
        info: result.infoData || {},
        metadata: result.metadata || null,
      };
    } finally {
      if (typeof parser.destroy === "function") {
        await parser.destroy();
      }
    }
  }

  throw new Error(
    "Unsupported pdf-parse export shape. Expected default parser function or PDFParse class."
  );
}

function cleanText(text: string) {
  return text
    .replace(/\u0000/g, "")
    .replace(/\uFFFE/g, "")
    .replace(/￾/g, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[—–]/g, "-")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n");
}

function inferIsland(text: string): IslandCode {
  const lower = text.toLowerCase();

  if (/\bst[.\s-]*croix\b|\bcroix\b|\bcrolx\b|\bcrois\b/.test(lower)) {
    return "st_croix";
  }

  if (/\bst[.\s-]*john\b|\bst[.\s-]*jan\b/.test(lower)) {
    return "st_john";
  }

  if (/\bst[.\s-]*thomas\b|\bthomaa\b|\bthomas\b/.test(lower)) {
    return "st_thomas";
  }

  if (/\bwater island\b|\bwater-island\b/.test(lower)) {
    return "water_island";
  }

  return "";
}

function inferKind(description: string) {
  const lower = description.toLowerCase();

  const patterns: Array<[RegExp, string]> = [
    [/\bestate\b|\bplantage\b|\bplantation\b/, "estate"],
    [/\bquarter\b|\brural district\b/, "quarter"],
    [/\bbay\b|\bbight\b/, "bay"],
    [/\bcay\b|\bkey\b/, "cay"],
    [/\bisland\b/, "island"],
    [/\bhill\b|\bmount\b|\bmountain\b|\bberg\b/, "hill"],
    [/\bpoint\b|\bpeninsula\b/, "point"],
    [/\bgut\b|\bstream\b|\bravine\b/, "gut"],
    [/\bharbor\b|\bport\b|\banchorage\b/, "harbor"],
    [/\blagoon\b/, "lagoon"],
    [/\bpond\b|\bsalt pond\b/, "pond"],
    [/\broad\b|\broadstead\b|\btrail\b/, "road"],
    [/\bfort\b|\bbattery\b/, "fort"],
    [/\btown\b|\bcity\b|\bsettlement\b|\bvillage\b/, "settlement"],
    [/\bchurch\b|\bmission\b/, "religious_site"],
    [/\brock\b|\breef\b|\bshoal\b/, "marine_feature"],
  ];

  for (const [regex, kind] of patterns) {
    if (regex.test(lower)) return kind;
  }

  if (/same as|variant|spelling|metamorphosis|corruption/.test(lower)) {
    return "alias";
  }

  return "place";
}

function extractAliases(description: string) {
  const aliases = new Set<string>();

  const patterns = [
    /also called,?\s+([^.;]+)/gi,
    /also spelled,?\s+([^.;]+)/gi,
    /same as\s+([^.;]+)/gi,
    /variant(?: spelling)? of\s+([^.;]+)/gi,
    /now called,?\s+([^.;]+)/gi,
    /formerly called,?\s+([^.;]+)/gi,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(description))) {
      const raw = match[1]
        .replace(/q\. ?v\./gi, "")
        .replace(/["']/g, "")
        .trim();

      raw
        .split(/,| or | and /i)
        .map((part) => part.trim())
        .filter((part) => part.length >= 2 && part.length <= 80)
        .forEach((part) => aliases.add(part));
    }
  }

  return [...aliases];
}

function dmsToDecimal(deg: number, min = 0, sec = 0, westOrSouth = false) {
  const value = Math.abs(deg) + min / 60 + sec / 3600;
  return westOrSouth ? -value : value;
}

function extractCoordinates(text: string) {
  const normalized = text
    .replace(/[º˚]/g, "°")
    .replace(/[′`]/g, "'")
    .replace(/[″]/g, '"');

  const latMatch = normalized.match(
    /lat\.?\s*([0-9]{1,2})\s*[°' ]+\s*([0-9]{1,2})?\s*[' ]*\s*([0-9.]+)?\s*"?\s*([NS])?/i,
  );

  const lngMatch = normalized.match(
    /(?:long\.?|lon\.?)\s*([0-9]{2,3})\s*[°' ]+\s*([0-9]{1,2})?\s*[' ]*\s*([0-9.]+)?\s*"?\s*([EW])?/i,
  );

  if (!latMatch || !lngMatch) return undefined;

  const latDeg = Number(latMatch[1]);
  const latMin = Number(latMatch[2] || 0);
  const latSec = Number(latMatch[3] || 0);
  const lngDeg = Number(lngMatch[1]);
  const lngMin = Number(lngMatch[2] || 0);
  const lngSec = Number(lngMatch[3] || 0);

  if (!Number.isFinite(latDeg) || !Number.isFinite(lngDeg)) return undefined;

  const lat = dmsToDecimal(latDeg, latMin, latSec, latMatch[4]?.toUpperCase() === "S");
  const lng = dmsToDecimal(lngDeg, lngMin, lngSec, true);

  if (lat < 17 || lat > 19 || lng < -66 || lng > -63) return undefined;

  return {
    lat: Number(lat.toFixed(7)),
    lng: Number(lng.toFixed(7)),
  };
}

function looksLikeEntryStart(line: string) {
  if (!line.includes(";")) return false;
  if (line.length < 4) return false;

  const beforeSemi = line.slice(0, line.indexOf(";")).trim();

  if (beforeSemi.length < 2 || beforeSemi.length > 90) return false;
  if (/^\d+$/.test(beforeSemi)) return false;
  if (/^(page|contents|bibliography|abbreviations)$/i.test(beforeSemi)) return false;

  return /^[A-Za-zÆØÅæøå0-9"'(). -]+$/.test(beforeSemi);
}

function splitGazetteerEntries(text: string) {
  const startMarkers = [
    "GAZETTEER OF THE VIRGIN ISLANDS OF THE UNITED STATES",
    "Gazetteer of the Virgin Islands of the United States",
  ];

  let gazetteer = text;
  for (const marker of startMarkers) {
    const idx = text.indexOf(marker);
    if (idx >= 0) {
      gazetteer = text.slice(idx + marker.length);
      break;
    }
  }

  const supplementIdx = gazetteer.search(/SUPPLEMENTARY LIST/i);
  if (supplementIdx > 0) {
    gazetteer = gazetteer.slice(0, supplementIdx);
  }

  const lines = gazetteer
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^GEOGRAPHIC DICTIONARY/i.test(line))
    .filter((line) => !/^U\.?\s*S\.?\s*COAST/i.test(line))
    .filter((line) => !/^\d+$/.test(line));

  const rawEntries: Array<{ name: string; description: string }> = [];
  let current: { name: string; description: string } | null = null;

  for (const line of lines) {
    if (looksLikeEntryStart(line)) {
      if (current) rawEntries.push(current);

      const semi = line.indexOf(";");
      current = {
        name: line.slice(0, semi).trim(),
        description: line.slice(semi + 1).trim(),
      };
    } else if (current) {
      current.description += " " + line;
    }
  }

  if (current) rawEntries.push(current);

  return rawEntries;
}

function confidenceFor(entry: DictionaryEntry): DictionaryEntry["extraction"]["confidence"] {
  if (entry.kind === "alias") return "medium";
  if (entry.island && entry.description.length > 40) return "high";
  if (entry.description.length > 20) return "medium";
  return "low";
}

async function main() {
  if (!existsSync(PDF_PATH)) {
    throw new Error(`PDF not found: ${PDF_PATH}`);
  }

  const buffer = readFileSync(PDF_PATH);
  const parsed = await parsePdfBuffer(buffer);

  const cleaned = cleanText(parsed.text);
  const rawEntries = splitGazetteerEntries(cleaned);

  const entries: DictionaryEntry[] = rawEntries
    .map((raw) => {
      const description = raw.description.replace(/\s+/g, " ").trim();
      const name = raw.name.replace(/\s+/g, " ").trim();
      const island = inferIsland(`${name} ${description}`);
      const kind = inferKind(description);
      const aliases = extractAliases(description);
      const coordinates = extractCoordinates(description);

      const notes: string[] = [];

      if (!island) notes.push("Island not inferred from entry text.");
      if (kind === "place") notes.push("Feature type is generic and may need review.");
      if (/same as|variant|spelling|metamorphosis|corruption/i.test(description)) {
        notes.push("Likely alias or variant-name entry.");
      }
      if (/[�￾]/.test(description)) {
        notes.push("OCR artifact detected.");
      }

      const entry: DictionaryEntry = {
        id: `gdvi-${slugify(name)}-${slugify(island || "unknown")}`,
        name,
        normalizedName: normalizeName(name),
        kind,
        island,
        description,
        aliases,
        ...(coordinates ? { coordinates } : {}),
        source: {
          title: "Geographic Dictionary of the Virgin Islands of the United States",
          publicationYear: 1925,
          file: path.relative(ROOT, PDF_PATH),
        },
        extraction: {
          confidence: "medium",
          needsReview: false,
          notes,
        },
      };

      entry.extraction.confidence = confidenceFor(entry);
      entry.extraction.needsReview =
        entry.extraction.confidence !== "high" ||
        entry.kind === "alias" ||
        !entry.island ||
        notes.length > 0;

      return entry;
    })
    .filter((entry) => entry.name.length >= 2)
    .filter((entry) => entry.description.length >= 5);

  const seen = new Set<string>();
  const uniqueEntries = entries.filter((entry) => {
    const key = `${entry.normalizedName}|${entry.island}|${entry.kind}|${entry.description.slice(0, 80)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  mkdirSync(path.dirname(OUT_JSON), { recursive: true });

  writeFileSync(OUT_JSON, JSON.stringify(uniqueEntries, null, 2));

  writeFileSync(
    OUT_TS,
    `// Auto-generated by scripts/extract-geographic-dictionary.ts
// Do not edit manually.

export type GeographicDictionaryEntry = ${JSON.stringify(
      {
        id: "string",
        name: "string",
        normalizedName: "string",
        kind: "string",
        island: "st_thomas | st_john | st_croix | water_island | ''",
        description: "string",
        aliases: ["string"],
      },
      null,
      2,
    )};

export const geographicDictionaryEntries = ${JSON.stringify(uniqueEntries, null, 2)} as const;
`,
  );

  const byKind = uniqueEntries.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.kind] = (acc[entry.kind] || 0) + 1;
    return acc;
  }, {});

  const byIsland = uniqueEntries.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.island || "unknown"] = (acc[entry.island || "unknown"] || 0) + 1;
    return acc;
  }, {});

  console.log("Geographic Dictionary extraction complete.");
  console.log({
    pdf: PDF_PATH,
    rawEntries: rawEntries.length,
    entries: uniqueEntries.length,
    byKind,
    byIsland,
    outJson: OUT_JSON,
    outTs: OUT_TS,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});