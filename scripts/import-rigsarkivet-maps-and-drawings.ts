// scripts/import-rigsarkivet-maps-and-drawings.ts
// @ts-nocheck

/**
 * Rigsarkivet / Arkivalieronline importer for:
 * Central Directorate for the Colonies, The Colonial Office: Maps and drawings (1760-1916)
 *
 * What it does:
 *  1. Reads the official collection index.
 *  2. Extracts every archive item link and label.
 *  3. Labels each item with archive number, island, place tags, year, creator, and record type.
 *  4. Extracts Arkivalieronline image IDs from the viewer.
 *  5. Writes app-ready JSON + TypeScript data files.
 *  6. Optionally downloads the images into public/images/archive/rigsarkivet/maps-and-drawings.
 *
 * IMPORTANT:
 * Rigsarkivet allows individual downloads through the viewer, but asks users to contact
 * the National Archives before downloading more than a few pictures from Arkivalieronline.
 * This script is manifest-only by default. Do not run --download in bulk until you have
 * permission or have confirmed your allowed use.
 *
 * Usage:
 *   npx tsx scripts/import-rigsarkivet-maps-and-drawings.ts --manifest-only
 *
 *   # Browser extraction is more reliable because the viewer is JS-driven:
 *   npm i -D playwright
 *   npx playwright install chromium
 *   npx tsx scripts/import-rigsarkivet-maps-and-drawings.ts --manifest-only --browser
 *
 *   # After permission / allowed-use review:
 *   RIGSARKIVET_BULK_DOWNLOAD_OK=1 npx tsx scripts/import-rigsarkivet-maps-and-drawings.ts --download --browser --delay-ms 2500
 */

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");

const COLLECTION_URL =
  "https://arkivalieronline.rigsarkivet.dk/en/other/index-creator/153/2354827/20104126";
const COLLECTION_ID = "20104126";
const SOURCE_NAME = "Rigsarkivet / Arkivalieronline";
const ARCHIVE_CREATOR = "Central Directorate for the Colonies, The Colonial Office";
const SERIES_TITLE = "Maps and drawings";
const SERIES_YEARS = "1760-1916";
const IMAGE_API_BASE = "https://api.rigsarkivet.dk/ao/v1/images";

const DEFAULT_IMAGE_DIR = "public/images/archive/rigsarkivet/maps-and-drawings";
const DEFAULT_JSON_OUT = "src/data/history/generated/rigsarkivetMapsAndDrawings.json";
const DEFAULT_TS_OUT = "src/data/history/generated/rigsarkivetMapsAndDrawings.ts";
const DEFAULT_RAW_OUT = "reports/rigsarkivet-maps-and-drawings/raw-collection-index.html";
const DEFAULT_REPORT_OUT = "reports/rigsarkivet-maps-and-drawings/import-report.json";

const DEFAULT_DELAY_MS = 1800;
const DEFAULT_RETRY_COUNT = 3;

const ISLAND_PATTERNS = [
  {
    island: "st_croix",
    label: "St. Croix",
    patterns: [/st\.\s*croix/i, /sankt\s*croix/i, /saint\s*croix/i, /christiansted/i, /frederiksted/i, /kingshill/i, /buck\s+island/i, /richmond/i, /la\s*grange/i],
  },
  {
    island: "st_thomas",
    label: "St. Thomas",
    patterns: [/st\.\s*thomas/i, /sankt\s*thomas/i, /saint\s*thomas/i, /charlotte\s+amalie/i, /christiansfort/i, /hassel\s+island/i, /cowell\s+point/i, /long\s+bay/i, /emancipation\s+garden/i, /n[oø]rregade/i, /domini\s+tværgade/i, /kommandantbakken/i],
  },
  {
    island: "st_john",
    label: "St. John",
    patterns: [/st\.\s*jan/i, /sankt\s*jan/i, /st\.\s*john/i, /saint\s*john/i, /cruz\s+bay/i, /betania/i],
  },
  {
    island: "water_island",
    label: "Water Island",
    patterns: [/water\s+island/i, /vand\s*[øo]/i],
  },
];

const PLACE_PATTERNS = [
  ["Christiansted", /christiansted/i],
  ["Frederiksted", /frederiksted/i],
  ["Charlotte Amalie", /charlotte\s+amalie/i],
  ["Cruz Bay", /cruz\s+bay/i],
  ["Christiansværn", /christiansv[æa]rn/i],
  ["Christiansfort", /christiansfort/i],
  ["Kingshill", /kingshill/i],
  ["Buck Island", /buck\s+island/i],
  ["Hassel Island", /hassel\s+island/i],
  ["Cowell Point", /cowell\s+point/i],
  ["Long Bay", /long\s+bay/i],
  ["Richmond", /richmond/i],
  ["La Grange", /la\s*grange/i],
  ["Peter Farm", /peter\s+farm/i],
  ["Corn Hill", /corn\s+hill/i],
  ["Adventure Gut", /adventure\s+gut/i],
  ["Centerline Road", /centerline\s+road/i],
  ["Nørregade", /n[oø]rregade/i],
  ["Domini Tværgade", /domini\s+tværgade/i],
  ["Emancipation Garden", /emancipation\s+garden/i],
  ["Kommandantbakken", /kommandantbakken/i],
  ["Ross Estate", /ross\s+estate/i],
  ["Fort Frederik", /fort\s+frederik/i],
  ["Fort Frederiksværn", /frederiksv[æa]rn/i],
];

const APPROX_CENTERS: Record<string, { lat: number; lng: number }> = {
  st_croix: { lat: 17.7356, lng: -64.7460 },
  st_thomas: { lat: 18.3428, lng: -64.9307 },
  st_john: { lat: 18.3330, lng: -64.7350 },
  water_island: { lat: 18.3186, lng: -64.9547 },
  Christiansted: { lat: 17.7466, lng: -64.7032 },
  Frederiksted: { lat: 17.7125, lng: -64.8824 },
  "Charlotte Amalie": { lat: 18.3419, lng: -64.9307 },
  "Cruz Bay": { lat: 18.3317, lng: -64.7938 },
  "Buck Island": { lat: 17.7892, lng: -64.6223 },
  "Hassel Island": { lat: 18.3305, lng: -64.9368 },
  Kingshill: { lat: 17.7246, lng: -64.7787 },
  Richmond: { lat: 17.7483, lng: -64.7220 },
  "La Grange": { lat: 17.7028, lng: -64.8570 },
  "Fort Frederik": { lat: 17.7129, lng: -64.8834 },
  "Fort Frederiksværn": { lat: 17.7129, lng: -64.8834 },
  Christiansværn: { lat: 17.7467, lng: -64.7018 },
  Christiansfort: { lat: 18.3424, lng: -64.9312 },
};

type CliOptions = {
  manifestOnly: boolean;
  download: boolean;
  useBrowser: boolean;
  limit: number | null;
  start: number;
  delayMs: number;
  collectionUrl: string;
  imageDir: string;
  jsonOut: string;
  tsOut: string;
  reportOut: string;
  rawOut: string;
  overwrite: boolean;
  includeNonVi: boolean;
};

type CollectionItem = {
  archiveRef: string;
  archiveNumber: string;
  originalLabel: string;
  originalTitle: string;
  viewerUrl: string;
  bsid: string | null;
  indexPosition: number;
};

type ArchivePage = {
  pageIndex: number;
  imageId: string;
  imageApiUrl: string;
  imageUrl: string | null;
  fileName: string | null;
  downloaded: boolean;
};

type ArchiveRecord = {
  id: string;
  archiveRef: string;
  archiveNumber: string;
  title: string;
  originalTitle: string;
  originalLabel: string;
  island: string;
  islandLabel: string;
  places: string[];
  coordinates: { lat: number; lng: number } | null;
  type: string;
  typeLabel: string;
  yearLabel: string | null;
  yearStart: number | null;
  yearEnd: number | null;
  creator: string | null;
  source: string;
  archiveCreator: string;
  collection: string;
  collectionId: string;
  seriesYears: string;
  viewerUrl: string;
  bsid: string | null;
  imageIds: string[];
  primaryImageUrl: string | null;
  pages: ArchivePage[];
  tags: string[];
  rightsNote: string;
  appCategory: string;
  generatedAt: string;
};

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    manifestOnly: true,
    download: false,
    useBrowser: false,
    limit: null,
    start: 0,
    delayMs: DEFAULT_DELAY_MS,
    collectionUrl: process.env.RIGSARKIVET_COLLECTION_URL || COLLECTION_URL,
    imageDir: DEFAULT_IMAGE_DIR,
    jsonOut: DEFAULT_JSON_OUT,
    tsOut: DEFAULT_TS_OUT,
    reportOut: DEFAULT_REPORT_OUT,
    rawOut: DEFAULT_RAW_OUT,
    overwrite: false,
    includeNonVi: true,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === "--download") {
      opts.download = true;
      opts.manifestOnly = false;
    } else if (arg === "--manifest-only") {
      opts.manifestOnly = true;
      opts.download = false;
    } else if (arg === "--browser") {
      opts.useBrowser = true;
    } else if (arg === "--overwrite") {
      opts.overwrite = true;
    } else if (arg === "--vi-only") {
      opts.includeNonVi = false;
    } else if (arg === "--include-non-vi") {
      opts.includeNonVi = true;
    } else if (arg === "--limit" && next) {
      opts.limit = Number(next);
      i += 1;
    } else if (arg === "--start" && next) {
      opts.start = Number(next);
      i += 1;
    } else if (arg === "--delay-ms" && next) {
      opts.delayMs = Number(next);
      i += 1;
    } else if (arg === "--collection-url" && next) {
      opts.collectionUrl = next;
      i += 1;
    } else if (arg === "--image-dir" && next) {
      opts.imageDir = next;
      i += 1;
    } else if (arg === "--json-out" && next) {
      opts.jsonOut = next;
      i += 1;
    } else if (arg === "--ts-out" && next) {
      opts.tsOut = next;
      i += 1;
    } else if (arg === "--report-out" && next) {
      opts.reportOut = next;
      i += 1;
    } else if (arg === "--raw-out" && next) {
      opts.rawOut = next;
      i += 1;
    } else if (arg === "--help" || arg === "-h") {
      printHelpAndExit();
    }
  }

  if (!Number.isFinite(opts.delayMs) || opts.delayMs < 250) opts.delayMs = DEFAULT_DELAY_MS;
  if (opts.limit !== null && (!Number.isFinite(opts.limit) || opts.limit <= 0)) opts.limit = null;
  if (!Number.isFinite(opts.start) || opts.start < 0) opts.start = 0;

  return opts;
}

function printHelpAndExit(): never {
  console.log(`\nRigsarkivet Maps and Drawings importer\n\nOptions:\n  --manifest-only           Build metadata only. Default.\n  --download                Download image files too. Requires RIGSARKIVET_BULK_DOWNLOAD_OK=1.\n  --browser                 Use Playwright to extract JS-rendered image IDs from the viewer.\n  --limit N                 Process only N records. Useful for testing.\n  --start N                 Skip the first N records.\n  --delay-ms N              Delay between network requests. Default ${DEFAULT_DELAY_MS}.\n  --overwrite               Re-download existing image files.\n  --vi-only                 Skip records that cannot be tied to a VI island/place.\n  --include-non-vi          Include every collection item. Default.\n  --image-dir PATH          Output image directory. Default ${DEFAULT_IMAGE_DIR}.\n  --json-out PATH           Output JSON. Default ${DEFAULT_JSON_OUT}.\n  --ts-out PATH             Output TS data module. Default ${DEFAULT_TS_OUT}.\n\nExamples:\n  npx tsx scripts/import-rigsarkivet-maps-and-drawings.ts --manifest-only --browser --limit 3\n  RIGSARKIVET_BULK_DOWNLOAD_OK=1 npx tsx scripts/import-rigsarkivet-maps-and-drawings.ts --download --browser --delay-ms 2500\n`);
  process.exit(0);
}

function repoPath(relativeOrAbsolute: string): string {
  if (path.isAbsolute(relativeOrAbsolute)) return relativeOrAbsolute;
  return path.join(REPO_ROOT, relativeOrAbsolute);
}

function ensureDir(dirPath: string) {
  if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function decodeHtml(input: string): string {
  return input
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function stripTags(html: string): string {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function slugify(input: string, maxLength = 92): string {
  const ascii = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/æ/gi, "ae")
    .replace(/ø/gi, "o")
    .replace(/å/gi, "a")
    .replace(/þ/gi, "th")
    .replace(/ð/gi, "d");

  const slug = ascii
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return (slug || "untitled").slice(0, maxLength).replace(/-+$/g, "");
}

function uniq<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

function compact<T>(arr: (T | null | undefined | false | "")[]): T[] {
  return arr.filter(Boolean) as T[];
}

function asAbsoluteUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return href;
  }
}

async function fetchWithRetry(url: string, init: RequestInit = {}, retryCount = DEFAULT_RETRY_COUNT): Promise<Response> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= retryCount; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...init,
        headers: {
          "User-Agent": "VI-Guide historical atlas importer; contact: ovandorawlins@gmail.com",
          Accept: "text/html,application/json,image/avif,image/webp,image/jpeg,image/png,*/*;q=0.8",
          ...(init.headers || {}),
        },
      });

      if (response.ok) return response;

      lastError = new Error(`HTTP ${response.status} ${response.statusText}`);
      if (![408, 425, 429, 500, 502, 503, 504].includes(response.status)) {
        throw lastError;
      }
    } catch (error) {
      lastError = error;
    }

    await sleep(750 * attempt);
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function fetchText(url: string): Promise<string> {
  const response = await fetchWithRetry(url);
  return response.text();
}

async function fetchArrayBuffer(url: string): Promise<ArrayBuffer> {
  const response = await fetchWithRetry(url, {
    headers: {
      Accept: "image/jpeg,image/png,image/*,*/*;q=0.8",
    },
  });

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/") && !contentType.includes("octet-stream")) {
    const preview = (await response.text()).slice(0, 300);
    throw new Error(`Expected image response from ${url}, got ${contentType}: ${preview}`);
  }

  return response.arrayBuffer();
}

function parseArchiveRef(label: string): { archiveRef: string; archiveNumber: string } | null {
  const match = label.match(/\b(337)\s+([0-9]+[a-z]?)\b/i);
  if (!match) return null;
  return {
    archiveRef: `${match[1]} ${match[2]}`,
    archiveNumber: match[2],
  };
}

function cleanOriginalTitle(label: string): string {
  return label
    .replace(/^\s*337\s+[0-9]+[a-z]?\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}


function parseBsid(urlOrHref: string): string | null {
  const bsidQuery = urlOrHref.match(/[?&]bsid=(\d+)/i)?.[1];
  if (bsidQuery) return bsidQuery;

  const hashPair = urlOrHref.match(/#(\d+),\d+/)?.[1];
  if (hashPair) return hashPair;

  const hashOnly = urlOrHref.match(/#(\d{4,})(?:$|[/?&])/i)?.[1];
  if (hashOnly) return hashOnly;

  return null;
}

function extractViewerHashImageIds(urlOrHref: string): string[] {
  const hash = urlOrHref.match(/#([^?#]+)/)?.[1] || "";
  if (!hash) return [];

  const pair = hash.match(/^(\d+),(\d+)/);
  if (pair?.[2]) return [pair[2]];

  return hash.match(/\d{4,}/g) || [];
}

function parseCollectionIndex(html: string, baseUrl: string): CollectionItem[] {
  const items: CollectionItem[] = [];
  const seen = new Set<string>();

  const anchorRe = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorRe.exec(html))) {
    const attrs = match[1];
    const body = match[2];
    const href = attrs.match(/href=["']([^"']+)["']/i)?.[1];
    if (!href) continue;
    if (!/billedviser/i.test(href)) continue;

    const label = stripTags(body);
    const ref = parseArchiveRef(label);
    if (!ref) continue;

    const viewerUrl = asAbsoluteUrl(href, baseUrl);
    const bsid = parseBsid(viewerUrl);
    const key = `${ref.archiveRef}|${viewerUrl}|${label}`;
    if (seen.has(key)) continue;
    seen.add(key);

    items.push({
      archiveRef: ref.archiveRef,
      archiveNumber: ref.archiveNumber,
      originalLabel: label,
      originalTitle: cleanOriginalTitle(label),
      viewerUrl,
      bsid,
      indexPosition: items.length,
    });
  }

  // Fallback for rare stripped HTML: parse text lines. This gives metadata but not viewer URLs.
  if (items.length === 0) {
    const text = stripTags(html);
    const lineRe = /\b337\s+([0-9]+[a-z]?)\s+([^]*?)(?=\s+337\s+[0-9]+[a-z]?\s+|$)/gi;
    let lineMatch: RegExpExecArray | null;
    while ((lineMatch = lineRe.exec(text))) {
      const archiveNumber = lineMatch[1];
      const originalTitle = lineMatch[2].replace(/\s+/g, " ").trim();
      const archiveRef = `337 ${archiveNumber}`;
      items.push({
        archiveRef,
        archiveNumber,
        originalLabel: `${archiveRef} ${originalTitle}`,
        originalTitle,
        viewerUrl: COLLECTION_URL,
        bsid: null,
        indexPosition: items.length,
      });
    }
  }

  return items;
}

function inferIsland(text: string): { island: string; islandLabel: string } {
  for (const candidate of ISLAND_PATTERNS) {
    if (candidate.patterns.some((pattern) => pattern.test(text))) {
      return { island: candidate.island, islandLabel: candidate.label };
    }
  }

  if (/dansk\s+vestindien|vestindiske|virgin\s+islands|jomfru[øo]er/i.test(text)) {
    return { island: "usvi", islandLabel: "U.S. Virgin Islands" };
  }

  if (/guinea|guineiske|volta/i.test(text)) {
    return { island: "non_vi", islandLabel: "Non-VI / Guinea Coast" };
  }

  return { island: "unknown", islandLabel: "Unknown" };
}

function inferPlaces(text: string): string[] {
  const places = PLACE_PATTERNS.filter(([, pattern]) => pattern.test(text)).map(([place]) => place);
  return uniq(places);
}

function inferCoordinates(island: string, places: string[]): { lat: number; lng: number } | null {
  for (const place of places) {
    if (APPROX_CENTERS[place]) return APPROX_CENTERS[place];
  }
  return APPROX_CENTERS[island] || null;
}

function inferType(text: string): { type: string; typeLabel: string; appCategory: string } {
  if (/\bbykort\b/i.test(text)) return { type: "town_map", typeLabel: "Town map", appCategory: "historic_map" };
  if (/\bkort\b/i.test(text)) return { type: "map", typeLabel: "Map", appCategory: "historic_map" };
  if (/\bfoto\b|photograph/i.test(text)) return { type: "photograph", typeLabel: "Photograph", appCategory: "archive_image" };
  if (/tekstdokument|translation|udgiftsberegning|overslag/i.test(text)) return { type: "text_document", typeLabel: "Text document", appCategory: "archive_document" };
  if (/facade|grundplan|situationsplan|snit|planer|tegning|projekt|skitse|nivellement|arbejdstegning/i.test(text)) {
    return { type: "architectural_plan", typeLabel: "Architectural plan / drawing", appCategory: "architectural_archive" };
  }
  return { type: "archive_drawing", typeLabel: "Archive drawing", appCategory: "archive_image" };
}

function inferYear(text: string): { yearLabel: string | null; yearStart: number | null; yearEnd: number | null } {
  if (/udateret/i.test(text)) return { yearLabel: "Undated", yearStart: null, yearEnd: null };

  const range = text.match(/\b(17\d{2}|18\d{2}|19\d{2})\s*[-–]\s*(17\d{2}|18\d{2}|19\d{2})\b/);
  if (range) {
    return {
      yearLabel: `${range[1]}-${range[2]}`,
      yearStart: Number(range[1]),
      yearEnd: Number(range[2]),
    };
  }

  const years = uniq((text.match(/\b(17\d{2}|18\d{2}|19\d{2})\b/g) || []).map(Number)).sort((a, b) => a - b);
  if (years.length === 0) return { yearLabel: null, yearStart: null, yearEnd: null };
  if (years.length === 1) return { yearLabel: String(years[0]), yearStart: years[0], yearEnd: years[0] };
  return { yearLabel: years.join(", "), yearStart: years[0], yearEnd: years[years.length - 1] };
}

function inferCreator(text: string): string | null {
  const normalized = text.replace(/\s+/g, " ").trim();

  const unknown = /tegner\s+uoplyst|forfatter\s+uoplyst/i.test(normalized);
  if (unknown) return null;

  const patterns = [
    /tegnet\s+af\s+(.+?)(?:\s+\d{4}|\s+Udateret|\s+\(|$)/i,
    /formentlig\s+tegnet\s+af\s+(.+?)(?:\s+\d{4}|\s+Udateret|\s+\(|$)/i,
    /skrevet\s+af\s+(.+?)(?:\s+\d{4}|\s+Udateret|\s+\(|$)/i,
    /\baf\s+([A-ZÆØÅ][^,;]+?)(?:\s+\d{4}|\s+\d{3,}|,|$)/,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (!match?.[1]) continue;
    const creator = match[1]
      .replace(/\s+og\s+nyere\s+tilføjelse.*$/i, "")
      .replace(/\s+og\s+Nares.*$/i, " og Nares")
      .replace(/\s+\(.*$/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (creator && !/st\.\s*croix|st\.\s*thomas|st\.\s*jan/i.test(creator)) return creator;
  }

  return null;
}

function titleCaseFromDanish(originalTitle: string): string {
  // Keep the Danish title as the authoritative label, but clean spacing.
  // The app can add manual English translations later for the important records.
  return originalTitle.replace(/\s+/g, " ").trim();
}

function buildTags(input: {
  archiveRef: string;
  islandLabel: string;
  places: string[];
  typeLabel: string;
  yearLabel: string | null;
  creator: string | null;
}): string[] {
  return uniq(
    compact([
      "Rigsarkivet",
      "Arkivalieronline",
      "Danish West Indies",
      input.archiveRef,
      input.islandLabel !== "Unknown" ? input.islandLabel : null,
      ...input.places,
      input.typeLabel,
      input.yearLabel,
      input.creator,
    ])
  );
}


function extractImageIdsFromText(text: string, bsid: string | null): string[] {
  const imageIds = new Set<string>();

  const addFrom = (value: string | null | undefined) => {
    if (!value) return;

    const patterns = [
      /api\.rigsarkivet\.dk\/ao\/v1\/images\/(\d{4,})/gi,
      /\/ao\/v1\/images\/(\d{4,})/gi,
      /\/images\/(\d{4,})(?=[/?#&\s"']|$)/gi,
      /#\d+,(\d{4,})/g,
      /[?&]imageId=(\d{4,})/gi,
      /imageId["'\s:=]+(\d{4,})/gi,
      /billedid["'\s:=]+(\d{4,})/gi,
      /billedeid["'\s:=]+(\d{4,})/gi,
      /image_id["'\s:=]+(\d{4,})/gi,
      /"id"\s*:\s*"?(\d{6,})"?/gi,
    ];

    for (const pattern of patterns) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(value))) {
        const id = match[1];
        if (id) imageIds.add(id);
      }
    }
  };

  addFrom(text);

  return [...imageIds];
}

async function getPlaywrightChromium() {
  const dynamicImport = new Function("specifier", "return import(specifier)") as (specifier: string) => Promise<any>;
  try {
    const mod = await dynamicImport("playwright");
    return mod.chromium;
  } catch (error) {
    throw new Error(
      "Playwright is required for --browser extraction. Run: npm i -D playwright && npx playwright install chromium"
    );
  }
}


async function extractImageIdsWithBrowser(items: CollectionItem[], opts: CliOptions): Promise<Map<string, string[]>> {
  const chromium = await getPlaywrightChromium();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const results = new Map<string, string[]>();

  try {
    for (const item of items) {
      const extracted = new Set<string>();
      const addFrom = (value: string | null | undefined) => {
        for (const id of extractImageIdsFromText(String(value || ""), item.bsid)) extracted.add(id);
      };

      const candidateUrls = uniq(
        compact([
          item.viewerUrl,
          item.bsid ? `https://arkivalieronline.rigsarkivet.dk/en/billedviser?bsid=${item.bsid}` : null,
          item.bsid ? `https://arkivalieronline.rigsarkivet.dk/da/billedviser?bsid=${item.bsid}` : null,
        ])
      );

      console.log(`Browser extracting image IDs: ${item.archiveRef} ${item.originalTitle}`);

      for (const url of candidateUrls) {
        const requestHandler = (request: any) => addFrom(request.url());
        const responseHandler = async (response: any) => {
          addFrom(response.url());
          const contentType = String(response.headers()?.["content-type"] || "");
          if (/json|text|javascript|html/i.test(contentType)) {
            try {
              const body = await response.text();
              addFrom(body.slice(0, 250000));
            } catch {
              // Image/tile responses often cannot be read here.
            }
          }
        };

        page.on("request", requestHandler);
        page.on("response", responseHandler);

        try {
          addFrom(url);
          await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
          await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => undefined);
          await page.waitForTimeout(2500);

          const domExtracted = await page.evaluate(() => {
            const values: string[] = [];
            values.push(String(window.location.href || ""));
            values.push(document.documentElement.outerHTML || "");

            for (const node of Array.from(document.querySelectorAll("a, img, source, button, div, span, canvas"))) {
              const element = node as HTMLElement;
              values.push(String((element as HTMLAnchorElement).href || ""));
              values.push(String((element as HTMLImageElement).src || ""));

              for (const attr of [
                "href",
                "src",
                "data-src",
                "data-image-id",
                "data-billedid",
                "data-billedeid",
                "data-id",
                "onclick",
                "style",
              ]) {
                values.push(String(element.getAttribute(attr) || ""));
              }
            }

            return values;
          });

          for (const value of domExtracted) addFrom(value);
        } catch (error) {
          console.warn(`Could not browser-extract ${item.archiveRef} at ${url}: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
          page.off("request", requestHandler);
          page.off("response", responseHandler);
        }

        if (extracted.size > 0) break;
        await sleep(opts.delayMs);
      }

      let cleaned = uniq([...extracted].filter(Boolean));

      if (cleaned.length === 0) cleaned = extractViewerHashImageIds(item.viewerUrl);

      results.set(item.archiveRef, cleaned);
      await sleep(opts.delayMs);
    }
  } finally {
    await page.close().catch(() => undefined);
    await browser.close().catch(() => undefined);
  }

  return results;
}


async function extractImageIdsForItem(item: CollectionItem, opts: CliOptions): Promise<string[]> {
  const candidateUrls = uniq(
    compact([
      item.viewerUrl,
      item.bsid ? `https://arkivalieronline.rigsarkivet.dk/en/billedviser?bsid=${item.bsid}` : null,
      item.bsid ? `https://arkivalieronline.rigsarkivet.dk/da/billedviser?bsid=${item.bsid}` : null,
    ])
  );

  const ids = new Set<string>();

  for (const url of candidateUrls) {
    try {
      const html = await fetchText(url);
      for (const id of extractImageIdsFromText(html, item.bsid)) ids.add(id);
      await sleep(opts.delayMs);
    } catch (error) {
      console.warn(`Could not fetch viewer HTML for ${item.archiveRef}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (ids.size === 0) {
    for (const id of extractViewerHashImageIds(item.viewerUrl)) ids.add(id);
  }

  return [...ids];
}

function buildRecordSkeleton(item: CollectionItem, imageIds: string[], generatedAt: string): ArchiveRecord {
  const labelText = `${item.archiveRef} ${item.originalTitle}`;
  const { island, islandLabel } = inferIsland(labelText);
  const places = inferPlaces(labelText);
  const coordinates = inferCoordinates(island, places);
  const { type, typeLabel, appCategory } = inferType(labelText);
  const { yearLabel, yearStart, yearEnd } = inferYear(labelText);
  const creator = inferCreator(labelText);
  const title = titleCaseFromDanish(item.originalTitle);

  const baseId = `rigsarkivet-${slugify(item.archiveRef)}-${slugify(title, 72)}`;
  const tags = buildTags({ archiveRef: item.archiveRef, islandLabel, places, typeLabel, yearLabel, creator });

  return {
    id: baseId,
    archiveRef: item.archiveRef,
    archiveNumber: item.archiveNumber,
    title,
    originalTitle: item.originalTitle,
    originalLabel: item.originalLabel,
    island,
    islandLabel,
    places,
    coordinates,
    type,
    typeLabel,
    yearLabel,
    yearStart,
    yearEnd,
    creator,
    source: SOURCE_NAME,
    archiveCreator: ARCHIVE_CREATOR,
    collection: SERIES_TITLE,
    collectionId: COLLECTION_ID,
    seriesYears: SERIES_YEARS,
    viewerUrl: item.viewerUrl,
    bsid: item.bsid,
    imageIds,
    primaryImageUrl: null,
    pages: [],
    tags,
    rightsNote:
      "Source: Rigsarkivet / Arkivalieronline. Confirm reuse and bulk-download permissions with Rigsarkivet for your intended use.",
    appCategory,
    generatedAt,
  };
}

function buildImageFileName(record: ArchiveRecord, imageId: string, pageIndex: number): string {
  const placeSlug = record.places[0] ? slugify(record.places[0], 32) : slugify(record.islandLabel, 32);
  const yearSlug = record.yearStart ? String(record.yearStart) : record.yearLabel ? slugify(record.yearLabel, 20) : "undated";
  const refSlug = slugify(record.archiveRef, 20);
  const titleSlug = slugify(record.title, 68);
  const pageSlug = record.imageIds.length > 1 ? `-p${String(pageIndex + 1).padStart(2, "0")}` : "";
  return `${refSlug}-${placeSlug}-${yearSlug}-${titleSlug}${pageSlug}-${imageId}.jpg`;
}

async function downloadRecordImages(record: ArchiveRecord, opts: CliOptions): Promise<ArchiveRecord> {
  const outDirAbs = repoPath(opts.imageDir);
  ensureDir(outDirAbs);

  const pages: ArchivePage[] = [];

  for (let pageIndex = 0; pageIndex < record.imageIds.length; pageIndex += 1) {
    const imageId = record.imageIds[pageIndex];
    const fileName = buildImageFileName(record, imageId, pageIndex);
    const absPath = path.join(outDirAbs, fileName);
    const imageUrl = `/${opts.imageDir.replace(/^public\//, "").replace(/\\/g, "/")}/${fileName}`;
    const imageApiUrl = `${IMAGE_API_BASE}/${imageId}`;

    const pageRecord: ArchivePage = {
      pageIndex,
      imageId,
      imageApiUrl,
      imageUrl,
      fileName,
      downloaded: false,
    };

    if (!opts.overwrite && existsSync(absPath) && statSync(absPath).size > 0) {
      pageRecord.downloaded = true;
      pages.push(pageRecord);
      continue;
    }

    console.log(`Downloading ${record.archiveRef} page ${pageIndex + 1}/${record.imageIds.length}: ${imageApiUrl}`);
    const data = await fetchArrayBuffer(imageApiUrl);
    writeFileSync(absPath, Buffer.from(data));
    pageRecord.downloaded = true;
    pages.push(pageRecord);
    await sleep(opts.delayMs);
  }

  const primaryImageUrl = pages.find((page) => page.imageUrl)?.imageUrl || null;
  return { ...record, pages, primaryImageUrl };
}

function attachManifestPages(record: ArchiveRecord): ArchiveRecord {
  const pages: ArchivePage[] = record.imageIds.map((imageId, pageIndex) => ({
    pageIndex,
    imageId,
    imageApiUrl: `${IMAGE_API_BASE}/${imageId}`,
    imageUrl: null,
    fileName: null,
    downloaded: false,
  }));

  return {
    ...record,
    pages,
    primaryImageUrl: null,
  };
}

function writeJson(filePath: string, data: unknown) {
  const abs = repoPath(filePath);
  ensureDir(path.dirname(abs));
  writeFileSync(abs, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function writeText(filePath: string, data: string) {
  const abs = repoPath(filePath);
  ensureDir(path.dirname(abs));
  writeFileSync(abs, data, "utf8");
}

function writeTsDataModule(filePath: string, records: ArchiveRecord[]) {
  const ts = `// ${filePath}\n// Auto-generated by scripts/import-rigsarkivet-maps-and-drawings.ts\n// Do not edit by hand. Re-run the importer instead.\n\nexport type RigsarkivetArchivePage = {\n  pageIndex: number;\n  imageId: string;\n  imageApiUrl: string;\n  imageUrl: string | null;\n  fileName: string | null;\n  downloaded: boolean;\n};\n\nexport type RigsarkivetArchiveMapRecord = {\n  id: string;\n  archiveRef: string;\n  archiveNumber: string;\n  title: string;\n  originalTitle: string;\n  originalLabel: string;\n  island: string;\n  islandLabel: string;\n  places: string[];\n  coordinates: { lat: number; lng: number } | null;\n  type: string;\n  typeLabel: string;\n  yearLabel: string | null;\n  yearStart: number | null;\n  yearEnd: number | null;\n  creator: string | null;\n  source: string;\n  archiveCreator: string;\n  collection: string;\n  collectionId: string;\n  seriesYears: string;\n  viewerUrl: string;\n  bsid: string | null;\n  imageIds: string[];\n  primaryImageUrl: string | null;\n  pages: RigsarkivetArchivePage[];\n  tags: string[];\n  rightsNote: string;\n  appCategory: string;\n  generatedAt: string;\n};\n\nexport const rigsarkivetMapsAndDrawings = ${JSON.stringify(records, null, 2)} as const satisfies readonly RigsarkivetArchiveMapRecord[];\n\nexport const rigsarkivetMapsAndDrawingsById = Object.fromEntries(\n  rigsarkivetMapsAndDrawings.map((record) => [record.id, record])\n) as Record<string, (typeof rigsarkivetMapsAndDrawings)[number]>;\n\nexport function getRigsarkivetMapsByIsland(island: string) {\n  return rigsarkivetMapsAndDrawings.filter((record) => record.island === island);\n}\n`;

  writeText(filePath, ts);
}

function readExistingRecords(jsonOut: string): ArchiveRecord[] {
  const abs = repoPath(jsonOut);
  if (!existsSync(abs)) return [];
  try {
    return JSON.parse(readFileSync(abs, "utf8")) as ArchiveRecord[];
  } catch {
    return [];
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.download && process.env.RIGSARKIVET_BULK_DOWNLOAD_OK !== "1") {
    throw new Error(
      "Refusing bulk image download. Rigsarkivet asks users to contact the National Archives before downloading more than a few Arkivalieronline pictures. After permission / allowed-use review, rerun with RIGSARKIVET_BULK_DOWNLOAD_OK=1."
    );
  }

  console.log(`Fetching collection index: ${opts.collectionUrl}`);
  const html = await fetchText(opts.collectionUrl);
  writeText(opts.rawOut, html);

  let items = parseCollectionIndex(html, opts.collectionUrl);
  console.log(`Found ${items.length} collection items.`);

  if (!opts.includeNonVi) {
    items = items.filter((item) => {
      const island = inferIsland(`${item.archiveRef} ${item.originalTitle}`).island;
      return !["unknown", "non_vi"].includes(island);
    });
    console.log(`After --vi-only filter: ${items.length} items.`);
  }

  if (opts.start > 0) items = items.slice(opts.start);
  if (opts.limit !== null) items = items.slice(0, opts.limit);

  const generatedAt = new Date().toISOString();
  const existing = readExistingRecords(opts.jsonOut);
  const existingByArchiveRef = new Map(existing.map((record) => [record.archiveRef, record]));

  let browserImageIds = new Map<string, string[]>();
  if (opts.useBrowser && items.length > 0) {
    browserImageIds = await extractImageIdsWithBrowser(items, opts);
  }

  const records: ArchiveRecord[] = [];
  const unresolved: CollectionItem[] = [];

  for (const item of items) {
    console.log(`Processing ${item.indexPosition + 1}: ${item.archiveRef} ${item.originalTitle}`);

    const existingRecord = existingByArchiveRef.get(item.archiveRef);
    let imageIds = uniq([
      ...(browserImageIds.get(item.archiveRef) || []),
      ...(existingRecord?.imageIds || []),
    ]);

    if (imageIds.length === 0) {
      imageIds = await extractImageIdsForItem(item, opts);
    }

    if (imageIds.length === 0) unresolved.push(item);

    let record = buildRecordSkeleton(item, imageIds, generatedAt);

    if (opts.download && imageIds.length > 0) {
      record = await downloadRecordImages(record, opts);
    } else {
      record = attachManifestPages(record);
    }

    records.push(record);
  }

  records.sort((a, b) => Number(a.archiveNumber.replace(/\D+/g, "")) - Number(b.archiveNumber.replace(/\D+/g, "")));

  writeJson(opts.jsonOut, records);
  writeTsDataModule(opts.tsOut, records);

  const report = {
    generatedAt,
    collectionUrl: opts.collectionUrl,
    totalRecords: records.length,
    recordsWithImages: records.filter((record) => record.imageIds.length > 0).length,
    totalImageIds: records.reduce((sum, record) => sum + record.imageIds.length, 0),
    downloadedImages: records.reduce((sum, record) => sum + record.pages.filter((page) => page.downloaded).length, 0),
    unresolved: unresolved.map((item) => ({
      archiveRef: item.archiveRef,
      title: item.originalTitle,
      bsid: item.bsid,
      viewerUrl: item.viewerUrl,
    })),
    outputs: {
      json: opts.jsonOut,
      ts: opts.tsOut,
      imageDir: opts.download ? opts.imageDir : null,
      rawIndex: opts.rawOut,
    },
    notes: [
      "Manifest generation is safe to run first.",
      "If unresolved records remain, rerun with --browser after installing Playwright.",
      "Bulk download is intentionally gated by RIGSARKIVET_BULK_DOWNLOAD_OK=1.",
    ],
  };

  writeJson(opts.reportOut, report);

  console.log("\nRigsarkivet maps/drawings import complete.");
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error("\nImport failed:");
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
