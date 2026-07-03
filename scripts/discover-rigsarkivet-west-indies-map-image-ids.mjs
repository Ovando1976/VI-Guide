import { mkdirSync, writeFileSync } from "node:fs";

const INDEX_URL =
  "https://arkivalieronline.rigsarkivet.dk/en/other/index-creator/153/2354827/20104126";

const OUT_JSON =
  "generated/history/historic-maps/rigsarkivet-west-indies-map-image-ids.json";
const OUT_TS = "src/data/history/historicMaps.ts";
const OUT_REPORT =
  "reports/history/rigsarkivet-west-indies-map-image-ids.md";

mkdirSync("generated/history/historic-maps", { recursive: true });
mkdirSync("reports/history", { recursive: true });
mkdirSync("src/data/history", { recursive: true });

function clean(value) {
  return String(value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value) {
  return clean(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ø/g, "o")
    .replace(/æ/g, "ae")
    .replace(/å/g, "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function absoluteUrl(href) {
  if (!href) return "";
  if (href.startsWith("http")) return href;
  if (href.startsWith("/")) return `https://arkivalieronline.rigsarkivet.dk${href}`;
  if (href.startsWith("#")) {
    return `https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126${href}`;
  }
  return new URL(href, INDEX_URL).toString();
}

function extractIds(url) {
  const match = url.match(/#(\d+),(\d+)/);
  return {
    bsid: match?.[1],
    aoImageId: match?.[2],
  };
}

function inferIsland(title) {
  const t = title.toLowerCase();

  if (t.includes("st. croix") || t.includes("sct. croix") || t.includes("saint croix")) {
    return "st_croix";
  }

  if (
    t.includes("st. thomas") ||
    t.includes("sct. thomas") ||
    t.includes("saint thomas") ||
    t.includes("charlotte amalie") ||
    t.includes("hassel island")
  ) {
    return "st_thomas";
  }

  if (t.includes("st. jan") || t.includes("st. john") || t.includes("sct. jan") || t.includes("cruz bay")) {
    return "st_john";
  }

  if (t.includes("dansk vestindien") || t.includes("vestindien") || t.includes("jomfru")) {
    return "all";
  }

  return "all";
}

function inferYearLabel(title) {
  const years = [...title.matchAll(/\b(17|18|19)\d{2}\b/g)].map((m) => Number(m[0]));
  const unique = [...new Set(years)].sort((a, b) => a - b);

  if (unique.length === 0) return /udateret/i.test(title) ? "Undated" : "Unknown";
  if (unique.length === 1) return String(unique[0]);

  return `${unique[0]}–${unique[unique.length - 1]}`;
}

function inferCreator(title) {
  const patterns = [
    /tegnet af ([^,]+)$/i,
    /tegnet af ([^,]+),/i,
    /tegnet af (.+)$/i,
    /skrevet af ([^,]+)$/i,
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match?.[1]) return clean(match[1]);
  }

  if (/tegner uoplyst/i.test(title)) return "Unknown";
  return undefined;
}

function inferShortTitle(title) {
  const cleaned = title
    .replace(/^Kort over /i, "")
    .replace(/^Bykort over /i, "")
    .replace(/^Foto af /i, "Photo of ")
    .replace(/, tegnet af .+$/i, "")
    .replace(/, tegner uoplyst.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.length > 92 ? `${cleaned.slice(0, 89).trim()}...` : cleaned;
}

function inferEvidenceUse(title, island) {
  const t = title.toLowerCase();
  const uses = new Set(["Historic source image", "Atlas crosswalk candidate"]);

  if (island !== "all") uses.add("Island geography");
  if (t.includes("kort")) uses.add("Map evidence");
  if (t.includes("bykort")) uses.add("Town plan");
  if (t.includes("havn")) uses.add("Harbor evidence");
  if (t.includes("landtoning")) uses.add("Coastal profile");
  if (t.includes("jernbane")) uses.add("Railway evidence");
  if (t.includes("nivellement")) uses.add("Elevation / leveling evidence");
  if (t.includes("vej") || t.includes("gade")) uses.add("Road / street plan");
  if (t.includes("fyr")) uses.add("Lighthouse evidence");
  if (t.includes("foto")) uses.add("Historic photo");
  if (t.includes("grundplan") || t.includes("facade") || t.includes("snit")) {
    uses.add("Architectural drawing");
  }

  return [...uses];
}

const res = await fetch(INDEX_URL, {
  headers: {
    "User-Agent": "VI-Guide historic maps research",
    Accept: "text/html,application/xhtml+xml",
  },
});

if (!res.ok) {
  throw new Error(`Failed to fetch index: ${res.status}`);
}

const html = await res.text();

writeFileSync(
  "generated/history/historic-maps/rigsarkivet-west-indies-index.html",
  html,
);

const anchorPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
const candidates = [];

for (const match of html.matchAll(anchorPattern)) {
  const href = clean(match[1]);
  const label = clean(match[2]);

  if (!/^\d+\s+\d+\s+/.test(label)) continue;

  const codeMatch = label.match(/^(\d+\s+\d+)\s+(.+)$/);
  if (!codeMatch) continue;

  const archiveCode = clean(codeMatch[1]);
  const title = clean(codeMatch[2]);
  const viewerUrl = absoluteUrl(href);
  const { bsid, aoImageId } = extractIds(viewerUrl);
  const island = inferIsland(title);
  const yearLabel = inferYearLabel(title);

  candidates.push({
    id: `${slugify(archiveCode)}-${slugify(title)}`,
    archiveCode,
    title,
    shortTitle: inferShortTitle(title),
    island,
    yearLabel,
    archive: "Rigsarkivet",
    collection:
      "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    creator: inferCreator(title),
    description:
      "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    evidenceUse: inferEvidenceUse(title, island),
    status: aoImageId ? "identified" : "needs-image",
    sourceUrl: viewerUrl,
    viewerUrl,
    bsid,
    aoImageId,
    imageUrl: aoImageId
      ? `https://api.rigsarkivet.dk/ao/v1/images/${aoImageId}`
      : undefined,
    tags: [
      "rigsarkivet",
      "west-indies-maps",
      archiveCode.replace(/\s+/g, "-").toLowerCase(),
      island,
      yearLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    ].filter(Boolean),
  });
}

const seen = new Set();
const records = candidates.filter((record) => {
  const key = `${record.archiveCode}|${record.title}|${record.aoImageId || ""}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

records.sort((a, b) => {
  const aNum = Number(a.archiveCode.split(/\s+/)[1] || 0);
  const bNum = Number(b.archiveCode.split(/\s+/)[1] || 0);
  return aNum - bNum || a.title.localeCompare(b.title);
});

const identified = records.filter((r) => r.aoImageId).length;
const missing = records.length - identified;

writeFileSync(
  OUT_JSON,
  JSON.stringify(
    {
      sourceUrl: INDEX_URL,
      generatedAt: new Date().toISOString(),
      total: records.length,
      identified,
      missing,
      records,
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

export const historicMapRecords: HistoricMapRecord[] = ${JSON.stringify(records, null, 2)} as HistoricMapRecord[];

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
  `# Rigsarkivet West Indies Map Image IDs

Source: ${INDEX_URL}

Total records: ${records.length}
Identified image IDs: ${identified}
Missing image IDs: ${missing}

## First 80 records

${records
  .slice(0, 80)
  .map(
    (record) =>
      `- ${record.archiveCode}: ${record.title}
  - bsid: ${record.bsid || ""}
  - image: ${record.aoImageId || ""}
  - viewer: ${record.viewerUrl}`,
  )
  .join("\n")}

## Missing image IDs

${records
  .filter((record) => !record.aoImageId)
  .map((record) => `- ${record.archiveCode}: ${record.title}`)
  .join("\n") || "None"}
`,
);

console.log({
  total: records.length,
  identified,
  missing,
  outJson: OUT_JSON,
  outTs: OUT_TS,
  report: OUT_REPORT,
});

if (records.length === 0) {
  console.log("Saved HTML to generated/history/historic-maps/rigsarkivet-west-indies-index.html");
}
