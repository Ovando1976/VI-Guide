import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const IN_JSON =
  "generated/history/historic-maps/rigsarkivet-west-indies-map-image-ids.json";

const OUT_DIR = "generated/history/historic-maps/images";
const OUT_JSON =
  "generated/history/historic-maps/rigsarkivet-west-indies-map-image-manifest.json";
const OUT_TS = "src/data/history/historicMaps.ts";
const OUT_REPORT =
  "reports/history/rigsarkivet-west-indies-map-image-download-report.md";

const KNOWN_BSID = 282887;
const KNOWN_IMAGE_ID = 55098907;
const IMAGE_OFFSET = KNOWN_IMAGE_ID - KNOWN_BSID;

const DELAY_MS = Number(process.env.RIGSARKIVET_DELAY_MS || 1200);
const LIMIT = Number(process.env.RIGSARKIVET_LIMIT || 0);
const START_AT = Number(process.env.RIGSARKIVET_START_AT || 1);

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync("generated/history/historic-maps", { recursive: true });
mkdirSync("reports/history", { recursive: true });
mkdirSync("src/data/history", { recursive: true });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clean(value) {
  return String(value ?? "")
    .replace(/&aring;/g, "å")
    .replace(/&Aring;/g, "Å")
    .replace(/&oslash;/g, "ø")
    .replace(/&Oslash;/g, "Ø")
    .replace(/&aelig;/g, "æ")
    .replace(/&AElig;/g, "Æ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function safeFileName(value) {
  return clean(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ø/g, "o")
    .replace(/æ/g, "ae")
    .replace(/å/g, "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 110);
}

function bsidFromViewerUrl(url) {
  const hash = String(url || "").split("#")[1] || "";
  const first = hash.split(",")[0];
  return /^\d+$/.test(first) ? Number(first) : null;
}

function deriveImageId(record) {
  if (record.aoImageId) return Number(record.aoImageId);

  const bsid = bsidFromViewerUrl(record.viewerUrl || record.sourceUrl);
  if (!bsid) return null;

  return bsid + IMAGE_OFFSET;
}

function detectImageExtension(buffer) {
  const hex = buffer.slice(0, 12).toString("hex");

  if (hex.startsWith("ffd8ff")) return "jpg";
  if (hex.startsWith("89504e470d0a1a0a")) return "png";
  if (hex.startsWith("52494646") && buffer.slice(8, 12).toString("ascii") === "WEBP") {
    return "webp";
  }

  return "bin";
}

async function fetchImage(imageId) {
  const url = `https://api.rigsarkivet.dk/ao/v1/images/${imageId}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "VI-Guide Virgin Islands historic maps research",
      Accept: "image/jpeg,image/png,image/webp,*/*",
    },
  });

  const buffer = Buffer.from(await res.arrayBuffer());

  return {
    url,
    ok: res.ok,
    status: res.status,
    contentType: res.headers.get("content-type"),
    contentLength: res.headers.get("content-length"),
    buffer,
  };
}

function islandName(value) {
  if (value === "st_thomas") return "St. Thomas";
  if (value === "st_john") return "St. John";
  if (value === "st_croix") return "St. Croix";
  if (value === "water_island") return "Water Island";
  return "All islands";
}

function statusLabel(value) {
  if (value === "identified") return "Identified";
  if (value === "needs-image") return "Needs image";
  if (value === "downloaded") return "Downloaded";
  if (value === "needs-georeference") return "Needs georeference";
  return "Ready";
}

if (!existsSync(IN_JSON)) {
  throw new Error(`Missing ${IN_JSON}. Run the discovery script first.`);
}

const source = JSON.parse(readFileSync(IN_JSON, "utf8"));
const allRecords = source.records || [];

const selected = allRecords.slice(
  Math.max(0, START_AT - 1),
  LIMIT > 0 ? Math.max(0, START_AT - 1) + LIMIT : undefined,
);

const downloaded = [];
const failed = [];
const patchedRecords = [];

console.log({
  totalRecords: allRecords.length,
  selectedForThisRun: selected.length,
  startAt: START_AT,
  limit: LIMIT || "all",
  delayMs: DELAY_MS,
  knownBsid: KNOWN_BSID,
  knownImageId: KNOWN_IMAGE_ID,
  offset: IMAGE_OFFSET,
});

for (const [index, record] of allRecords.entries()) {
  const imageId = deriveImageId(record);
  const bsid = bsidFromViewerUrl(record.viewerUrl || record.sourceUrl);

  patchedRecords.push({
    ...record,
    title: clean(record.title),
    shortTitle: clean(record.shortTitle),
    description: clean(record.description),
    collection: clean(record.collection),
    creator: record.creator ? clean(record.creator) : undefined,
    bsid: bsid ? String(bsid) : record.bsid,
    aoImageId: imageId ? String(imageId) : undefined,
    imageUrl: imageId
      ? `https://api.rigsarkivet.dk/ao/v1/images/${imageId}`
      : undefined,
    status: imageId ? "identified" : "needs-image",
  });
}

for (const [runIndex, record] of selected.entries()) {
  const globalIndex = START_AT + runIndex;
  const imageId = deriveImageId(record);
  const bsid = bsidFromViewerUrl(record.viewerUrl || record.sourceUrl);

  if (!imageId) {
    failed.push({
      archiveCode: record.archiveCode,
      title: clean(record.title),
      error: "Could not derive image ID",
    });
    continue;
  }

  const baseName = `${String(globalIndex).padStart(4, "0")}-${safeFileName(
    record.archiveCode || record.id,
  )}-${safeFileName(record.shortTitle || record.title)}`;

  const existing = ["jpg", "png", "webp", "bin"]
    .map((ext) => path.join(OUT_DIR, `${baseName}.${ext}`))
    .find((candidate) => existsSync(candidate));

  if (existing) {
    const stats = statSync(existing);

    downloaded.push({
      id: record.id,
      archiveCode: record.archiveCode,
      title: clean(record.title),
      shortTitle: clean(record.shortTitle),
      island: record.island,
      yearLabel: record.yearLabel,
      bsid: bsid ? String(bsid) : undefined,
      aoImageId: String(imageId),
      imageApiUrl: `https://api.rigsarkivet.dk/ao/v1/images/${imageId}`,
      viewerUrl: record.viewerUrl,
      localPath: existing,
      extension: path.extname(existing).replace(".", ""),
      bytes: stats.size,
      status: "already-downloaded",
    });

    console.log(
      `${globalIndex}/${allRecords.length} already | ${record.archiveCode} | bsid ${bsid} | image ${imageId}`,
    );
    continue;
  }

  try {
    const result = await fetchImage(imageId);
    const ext = detectImageExtension(result.buffer);

    if (!result.ok) {
      throw new Error(`HTTP ${result.status}`);
    }

    if (ext === "bin") {
      throw new Error(
        `Unknown image signature ${result.buffer.slice(0, 24).toString("hex")}`,
      );
    }

    const outPath = path.join(OUT_DIR, `${baseName}.${ext}`);
    writeFileSync(outPath, result.buffer);

    downloaded.push({
      id: record.id,
      archiveCode: record.archiveCode,
      title: clean(record.title),
      shortTitle: clean(record.shortTitle),
      island: record.island,
      yearLabel: record.yearLabel,
      bsid: bsid ? String(bsid) : undefined,
      aoImageId: String(imageId),
      imageApiUrl: result.url,
      viewerUrl: record.viewerUrl,
      localPath: outPath,
      extension: ext,
      bytes: result.buffer.length,
      contentType: result.contentType,
      status: "downloaded",
    });

    console.log(
      `${globalIndex}/${allRecords.length} downloaded | ${record.archiveCode} | bsid ${bsid} | image ${imageId} | ${ext} | ${result.buffer.length} bytes`,
    );
  } catch (error) {
    failed.push({
      archiveCode: record.archiveCode,
      title: clean(record.title),
      bsid: bsid ? String(bsid) : undefined,
      aoImageId: String(imageId),
      error: String(error?.message || error),
    });

    console.log(
      `${globalIndex}/${allRecords.length} FAILED | ${record.archiveCode} | bsid ${bsid} | image ${imageId} | ${String(
        error?.message || error,
      )}`,
    );
  }

  if (runIndex < selected.length - 1) {
    await sleep(DELAY_MS);
  }
}

writeFileSync(
  OUT_JSON,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      source: IN_JSON,
      totalRecords: allRecords.length,
      selectedForThisRun: selected.length,
      downloadedOrExisting: downloaded.length,
      failed: failed.length,
      imageOffset: IMAGE_OFFSET,
      knownPair: {
        bsid: KNOWN_BSID,
        imageId: KNOWN_IMAGE_ID,
      },
      downloaded,
      failed,
    },
    null,
    2,
  ),
);

const ts = `import type { IslandCode } from "../../types";

export type HistoricMapStatus =
  | "identified"
  | "needs-image"
  | "downloaded"
  | "needs-georeference"
  | "ready";

export type HistoricMapRecord = {
  id: string;
  archiveCode?: string;
  title: string;
  shortTitle: string;
  island: IslandCode | "all";
  yearLabel: string;
  dateStart?: number;
  dateEnd?: number;
  archive: "Rigsarkivet" | "Royal Danish Library" | "NARA" | "Local archive" | "Other";
  collection: string;
  creator?: string;
  description: string;
  evidenceUse: string[];
  status: HistoricMapStatus;
  sourceUrl?: string;
  viewerUrl?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  aoImageId?: string;
  bsid?: string;
  tags: string[];
  notes?: string;
};

export const historicMapRecords: HistoricMapRecord[] = ${JSON.stringify(
  patchedRecords,
  null,
  2,
)} as HistoricMapRecord[];

export function islandName(value: HistoricMapRecord["island"]) {
  if (value === "st_thomas") return "St. Thomas";
  if (value === "st_john") return "St. John";
  if (value === "st_croix") return "St. Croix";
  if (value === "water_island") return "Water Island";
  return "All islands";
}

export function statusLabel(value: HistoricMapStatus) {
  if (value === "identified") return "Identified";
  if (value === "needs-image") return "Needs image";
  if (value === "downloaded") return "Downloaded";
  if (value === "needs-georeference") return "Needs georeference";
  return "Ready";
}
`;

writeFileSync(OUT_TS, ts);

writeFileSync(
  OUT_REPORT,
  `# Rigsarkivet West Indies Map Image Download Report

Generated: ${new Date().toISOString()}

Known mapping:
- bsid ${KNOWN_BSID} -> image ${KNOWN_IMAGE_ID}
- offset: ${IMAGE_OFFSET}

Total records: ${allRecords.length}
Selected for this run: ${selected.length}
Downloaded or already present: ${downloaded.length}
Failed: ${failed.length}

## Downloaded / Existing

${downloaded
  .map(
    (item) =>
      `- ${item.archiveCode}: ${item.shortTitle}
  - bsid: ${item.bsid}
  - image: ${item.aoImageId}
  - file: \`${item.localPath}\`
  - bytes: ${item.bytes}
  - status: ${item.status}`,
  )
  .join("\n")}

## Failures

${
  failed.length
    ? failed
        .map(
          (item) =>
            `- ${item.archiveCode}: ${item.title}
  - bsid: ${item.bsid || ""}
  - image: ${item.aoImageId || ""}
  - error: ${item.error}`,
        )
        .join("\n")
    : "None"
}
`,
);

console.log({
  totalRecords: allRecords.length,
  selectedForThisRun: selected.length,
  downloadedOrExisting: downloaded.length,
  failed: failed.length,
  manifest: OUT_JSON,
  data: OUT_TS,
  report: OUT_REPORT,
});
