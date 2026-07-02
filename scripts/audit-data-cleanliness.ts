import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

type AnyRecord = Record<string, any>;

type Severity = "high" | "medium" | "low";

type Issue = {
  severity: Severity;
  source: string;
  index: number;
  id?: string;
  name?: string;
  issue: string;
  detail: string;
  suggestion?: string;
};

type LoadedSource = {
  name: string;
  path: string;
  inferredType?: string;
  records: AnyRecord[];
  error?: string;
};

const ROOT = process.cwd();
const REPORT_DIR = path.join(ROOT, "reports");
const JSON_REPORT = path.join(REPORT_DIR, "data-cleanliness-report.json");
const MD_REPORT = path.join(REPORT_DIR, "data-cleanliness-report.md");

const args = new Set(process.argv.slice(2));
const INCLUDE_PARCELS = args.has("--include-parcels");
const STRICT = args.has("--strict");

const ISSUE_SAMPLE_LIMIT_PER_KIND = 200;

const VALID_ISLANDS = new Set([
  "st_thomas",
  "st_john",
  "st_croix",
  "water_island",
  "stt",
  "stj",
  "stx",
  "wat",
]);

const NAME_FIELDS = [
  "name",
  "title",
  "label",
  "term",
  "entry",
  "estate",
  "estateName",
  "fullName",
  "baseName",
  "displayName",
  "siteName",
  "placeName",
];

const TYPE_FIELDS = [
  "type",
  "kind",
  "category",
  "recordType",
  "itemType",
  "siteType",
  "class",
];

const ISLAND_FIELDS = [
  "island",
  "islandCode",
  "island_id",
  "islandId",
  "islandName",
  "Island",
];

const ID_FIELDS = [
  "id",
  "geoid",
  "geoId",
  "parcelId",
  "siteId",
  "slug",
  "key",
  "objectid",
  "OBJECTID",
];

const IMAGE_FIELDS = [
  "image",
  "imageUrl",
  "imageURL",
  "img",
  "photo",
  "photoUrl",
  "thumbnail",
  "heroImage",
  "src",
];

const BAD_TEXT_RE =
  /\b(unknown|undefined|null|n\/a|todo|tbd|placeholder|lorem ipsum|extensive cane fields|croix road fragment|wildhagen estate fragment)\b/i;

const LOCATION_TYPES = new Set([
  "estate",
  "estates",
  "beach",
  "beaches",
  "historicSite",
  "historic-site",
  "historic_site",
  "historic",
  "site",
  "place",
  "places",
  "point",
  "civicPlace",
  "civic-place",
  "civic_place",
  "parcel",
  "restaurant",
  "event",
  "attraction",
]);

const IMAGE_EXPECTED_TYPES = new Set([
  "beach",
  "beaches",
  "historicSite",
  "historic-site",
  "historic_site",
  "historic",
  "site",
  "place",
  "places",
  "restaurant",
  "event",
  "attraction",
]);

function rel(absPath: string) {
  return path.relative(ROOT, absPath).replaceAll("\\", "/");
}

function cleanString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return undefined;
}

function getFirstString(record: AnyRecord, fields: string[]): string | undefined {
  for (const field of fields) {
    const value = record[field];
    const clean = cleanString(value);
    if (clean) return clean;
  }

  return undefined;
}

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeIsland(value?: string): string | undefined {
  if (!value) return undefined;

  const s = value
    .toLowerCase()
    .replace(/[\s.-]+/g, "_")
    .replace(/^saint_/, "st_");

  if (s === "stt" || s.includes("thomas")) return "st_thomas";
  if (s === "stj" || s.includes("john")) return "st_john";
  if (s === "stx" || s.includes("croix")) return "st_croix";
  if (s === "wat" || s.includes("water")) return "water_island";

  return s;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) return parsed;
  }

  return undefined;
}

function extractLatLng(record: AnyRecord): { lat: number; lng: number } | undefined {
  const lat =
    toNumber(record.lat) ??
    toNumber(record.latitude) ??
    toNumber(record.Latitude) ??
    toNumber(record.LAT);

  const lng =
    toNumber(record.lng) ??
    toNumber(record.lon) ??
    toNumber(record.long) ??
    toNumber(record.longitude) ??
    toNumber(record.Longitude) ??
    toNumber(record.LNG) ??
    toNumber(record.LON);

  if (lat !== undefined && lng !== undefined) {
    return { lat, lng };
  }

  const coords = record.coords ?? record.coordinates ?? record.center ?? record.centroid;

  if (Array.isArray(coords) && coords.length >= 2) {
    const a = toNumber(coords[0]);
    const b = toNumber(coords[1]);

    if (a !== undefined && b !== undefined) {
      if (a < -60 && b > 10) return { lng: a, lat: b };
      return { lat: a, lng: b };
    }
  }

  if (coords && typeof coords === "object") {
    const cLat = toNumber(coords.lat) ?? toNumber(coords.latitude);
    const cLng =
      toNumber(coords.lng) ??
      toNumber(coords.lon) ??
      toNumber(coords.long) ??
      toNumber(coords.longitude);

    if (cLat !== undefined && cLng !== undefined) {
      return { lat: cLat, lng: cLng };
    }
  }

  if (record.geometry?.type === "Point" && Array.isArray(record.geometry.coordinates)) {
    const gLng = toNumber(record.geometry.coordinates[0]);
    const gLat = toNumber(record.geometry.coordinates[1]);

    if (gLat !== undefined && gLng !== undefined) {
      return { lat: gLat, lng: gLng };
    }
  }

  return undefined;
}

function hasUsableGeometry(record: AnyRecord): boolean {
  const geometry = record.geometry;
  return Boolean(
    geometry &&
      typeof geometry === "object" &&
      typeof geometry.type === "string" &&
      Array.isArray(geometry.coordinates),
  );
}

function isInsideUsviBounds(lat: number, lng: number) {
  return lat >= 17.45 && lat <= 18.65 && lng >= -65.45 && lng <= -64.2;
}

function localImageExists(imagePath: string): boolean {
  const clean = imagePath.split("?")[0].split("#")[0].trim();

  if (!clean) return false;

  if (/^https?:\/\//i.test(clean)) return true;
  if (clean.startsWith("data:")) return true;

  const relative = clean.startsWith("/") ? clean.slice(1) : clean;
  const abs = path.join(ROOT, "public", relative);

  return existsSync(abs);
}

function readJsonFile(absPath: string): any {
  const text = readFileSync(absPath, "utf8");
  return JSON.parse(text);
}

function recordsFromUnknown(raw: any): AnyRecord[] {
  if (Array.isArray(raw)) return raw;

  if (Array.isArray(raw?.features)) {
    return raw.features.map((feature: AnyRecord, index: number) => ({
      ...(feature.properties ?? {}),
      id: feature.id ?? feature.properties?.id,
      geometry: feature.geometry,
      __featureIndex: index,
    }));
  }

  for (const key of ["items", "entries", "records", "data", "results"]) {
    if (Array.isArray(raw?.[key])) return raw[key];
  }

  return [];
}

function loadJsonSource(
  name: string,
  relativePath: string,
  inferredType?: string,
): LoadedSource | undefined {
  const abs = path.join(ROOT, relativePath);

  if (!existsSync(abs)) return undefined;

  try {
    const raw = readJsonFile(abs);
    return {
      name,
      path: relativePath,
      inferredType,
      records: recordsFromUnknown(raw),
    };
  } catch (error) {
    return {
      name,
      path: relativePath,
      inferredType,
      records: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function loadTsSource(
  name: string,
  relativePathCandidates: string[],
  exportNameCandidates: string[],
  inferredType?: string,
): Promise<LoadedSource | undefined> {
  const relativePath = relativePathCandidates.find((candidate) =>
    existsSync(path.join(ROOT, candidate)),
  );

  if (!relativePath) return undefined;

  const abs = path.join(ROOT, relativePath);

  try {
    const mod = await import(`${pathToFileURL(abs).href}?cacheBust=${Date.now()}`);

    for (const exportName of exportNameCandidates) {
      if (Array.isArray(mod[exportName])) {
        return {
          name,
          path: relativePath,
          inferredType,
          records: mod[exportName],
        };
      }
    }

    for (const value of Object.values(mod)) {
      if (Array.isArray(value)) {
        return {
          name,
          path: relativePath,
          inferredType,
          records: value as AnyRecord[],
        };
      }
    }

    return {
      name,
      path: relativePath,
      inferredType,
      records: [],
      error: `No array export found. Tried: ${exportNameCandidates.join(", ")}`,
    };
  } catch (error) {
    return {
      name,
      path: relativePath,
      inferredType,
      records: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function listFilesRecursive(dir: string): string[] {
  if (!existsSync(dir)) return [];

  const out: string[] = [];

  for (const entry of readdirSync(dir)) {
    const abs = path.join(dir, entry);
    const stat = statSync(abs);

    if (stat.isDirectory()) {
      out.push(...listFilesRecursive(abs));
    } else {
      out.push(abs);
    }
  }

  return out;
}


function addIssueFactory() {
  const issues: Issue[] = [];

  const counts = new Map<
    string,
    {
      severity: Severity;
      source: string;
      issue: string;
      count: number;
      sampled: number;
    }
  >();

  function add(issue: Issue) {
    const key = issueKeyParts(issue);
    const existing = counts.get(key);

    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, {
        severity: issue.severity,
        source: issue.source,
        issue: issue.issue,
        count: 1,
        sampled: 0,
      });
    }

    const row = counts.get(key);

    if (row && row.sampled < ISSUE_SAMPLE_LIMIT_PER_KIND) {
      issues.push(issue);
      row.sampled += 1;
    }
  }

  return {
    issues,
    counts,
    add,
  };
}

function issueKeyParts(issue: Issue) {
  return `${issue.severity}|${issue.source}|${issue.issue}`;
}

function severityRank(severity: Severity) {
  if (severity === "high") return 3;
  if (severity === "medium") return 2;
  return 1;
}

function auditRecord(params: {
  source: LoadedSource;
  record: AnyRecord;
  index: number;
  addIssue: (issue: Issue) => void;
}) {
  const { source, record, index, addIssue } = params;

  const name = getFirstString(record, NAME_FIELDS);
  const id = getFirstString(record, ID_FIELDS);
  const rawType = getFirstString(record, TYPE_FIELDS);
  const type = rawType ?? source.inferredType;
  const rawIsland = getFirstString(record, ISLAND_FIELDS);
  const normalizedIsland = normalizeIsland(rawIsland);
  const coords = extractLatLng(record);
  const image = getFirstString(record, IMAGE_FIELDS);

  const safeName = name ?? id ?? `record ${index}`;

  if (!name) {
    addIssue({
      severity: "high",
      source: source.name,
      index,
      id,
      issue: "missing_name",
      detail: "Record has no usable name/title/label field.",
      suggestion: "Add a name, title, label, term, estateName, or siteName field.",
    });
  } else {
    if (name.length <= 1) {
      addIssue({
        severity: "high",
        source: source.name,
        index,
        id,
        name,
        issue: "name_too_short",
        detail: `Name is only ${name.length} character(s).`,
        suggestion: "Replace with the full canonical display name.",
      });
    }

    if (BAD_TEXT_RE.test(name)) {
      addIssue({
        severity: "high",
        source: source.name,
        index,
        id,
        name,
        issue: "placeholder_or_fragment_name",
        detail: `Suspicious display name: "${name}".`,
        suggestion: "Replace the fragment with a real canonical record or remove the bad record.",
      });
    }
  }

  if (!type) {
    addIssue({
      severity: "medium",
      source: source.name,
      index,
      id,
      name,
      issue: "missing_type",
      detail: "Record has no usable type/kind/category.",
      suggestion: `Add a stable type such as "${source.inferredType ?? "dictionaryEntry"}".`,
    });
  }

  if (rawIsland && normalizedIsland && !VALID_ISLANDS.has(normalizedIsland)) {
    addIssue({
      severity: "medium",
      source: source.name,
      index,
      id,
      name,
      issue: "invalid_island",
      detail: `Island value "${rawIsland}" normalized to "${normalizedIsland}", which is not recognized.`,
      suggestion: "Use st_thomas, st_john, st_croix, or water_island.",
    });
  }

  const typeKey = type ?? "";
  const isLocation = LOCATION_TYPES.has(typeKey) || hasUsableGeometry(record);

  if (isLocation && !rawIsland && source.name !== "parcels_geojson") {
    addIssue({
      severity: "medium",
      source: source.name,
      index,
      id,
      name,
      issue: "missing_island",
      detail: "Location-like record has no island field.",
      suggestion: "Add island: st_thomas, st_john, st_croix, or water_island.",
    });
  }

  if (isLocation && !coords && !hasUsableGeometry(record)) {
    addIssue({
      severity: "medium",
      source: source.name,
      index,
      id,
      name: safeName,
      issue: "missing_coordinates",
      detail: "Location-like record has no lat/lng, coordinates, center, centroid, or geometry.",
      suggestion: "Add coordinates or attach a valid GeoJSON geometry.",
    });
  }

  if (coords && !isInsideUsviBounds(coords.lat, coords.lng)) {
    addIssue({
      severity: "high",
      source: source.name,
      index,
      id,
      name: safeName,
      issue: "coordinates_outside_usvi",
      detail: `Coordinates appear outside USVI bounds: lat=${coords.lat}, lng=${coords.lng}.`,
      suggestion: "Check whether lat/lng are reversed or whether the point is incorrect.",
    });
  }

  if (image) {
    if (!localImageExists(image)) {
      addIssue({
        severity: "low",
        source: source.name,
        index,
        id,
        name: safeName,
        issue: "missing_local_image_file",
        detail: `Image path does not exist under public/: ${image}`,
        suggestion: "Add the file to public/ or update the image path.",
      });
    }
  } else if (type && IMAGE_EXPECTED_TYPES.has(type)) {
    addIssue({
      severity: "low",
      source: source.name,
      index,
      id,
      name: safeName,
      issue: "missing_image",
      detail: `Record type "${type}" normally needs an image for the UI.`,
      suggestion: "Add image, imageUrl, thumbnail, or heroImage.",
    });
  }
}

function makeMarkdown(report: any) {
  const lines: string[] = [];

  lines.push("# VI Guide Data Cleanliness Report");
  lines.push("");
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Sources scanned: ${report.sources.length}`);
  lines.push(`- Records scanned: ${report.totalRecords}`);
  lines.push(`- High severity issues: ${report.severityTotals.high}`);
  lines.push(`- Medium severity issues: ${report.severityTotals.medium}`);
  lines.push(`- Low severity issues: ${report.severityTotals.low}`);
  lines.push("");

  lines.push("## Sources");
  lines.push("");
  lines.push("| Source | Path | Records | Status |");
  lines.push("|---|---:|---:|---|");

  for (const source of report.sources) {
    lines.push(
      `| ${source.name} | ${source.path} | ${source.records} | ${
        source.error ? `ERROR: ${source.error.replace(/\|/g, "\\|")}` : "OK"
      } |`,
    );
  }

  lines.push("");
  lines.push("## Top Issue Groups");
  lines.push("");
  lines.push("| Severity | Source | Issue | Count |");
  lines.push("|---|---|---|---:|");

  for (const row of report.issueGroups.slice(0, 40)) {
    lines.push(`| ${row.severity} | ${row.source} | ${row.issue} | ${row.count} |`);
  }

  lines.push("");
  lines.push("## Sample Issues");
  lines.push("");
  lines.push("| Severity | Source | Index | Name | Issue | Detail | Suggestion |");
  lines.push("|---|---|---:|---|---|---|---|");

  for (const issue of report.issues.slice(0, 120)) {
    const escape = (value: unknown) =>
      String(value ?? "")
        .replace(/\n/g, " ")
        .replace(/\|/g, "\\|");

    lines.push(
      `| ${issue.severity} | ${escape(issue.source)} | ${issue.index} | ${escape(
        issue.name ?? issue.id ?? "",
      )} | ${escape(issue.issue)} | ${escape(issue.detail)} | ${escape(
        issue.suggestion ?? "",
      )} |`,
    );
  }

  lines.push("");
  lines.push("## Recommended Fix Order");
  lines.push("");
  lines.push("1. Fix `coordinates_outside_usvi` first. These can break map fly-to and routing.");
  lines.push("2. Fix `missing_name`, `name_too_short`, and `placeholder_or_fragment_name`.");
  lines.push("3. Fix `missing_type` and `missing_island`.");
  lines.push("4. Fix `missing_coordinates` for beaches, historic sites, estates, and civic places.");
  lines.push("5. Fix missing local images after the records themselves are clean.");
  lines.push("");
  lines.push("Run with parcels included when needed:");
  lines.push("");
  lines.push("```bash");
  lines.push("npx tsx scripts/audit-data-cleanliness.ts --include-parcels");
  lines.push("```");
  lines.push("");

  return lines.join("\n");
}

async function main() {
  mkdirSync(REPORT_DIR, { recursive: true });

  const sources: LoadedSource[] = [];

  const dictionary = loadJsonSource(
    "dictionary_json",
    "src/data/vi-dictionary.json",
    "dictionaryEntry",
  );
  if (dictionary) sources.push(dictionary);

  const estatesGeo =
    loadJsonSource("estates_geojson", "public/geo/usvi-estates.geojson", "estate") ??
    loadJsonSource("estates_geojson", "public/data/usvi-estates.geojson", "estate");

  if (estatesGeo) sources.push(estatesGeo);

  if (INCLUDE_PARCELS) {
    const parcelsGeo =
      loadJsonSource("parcels_geojson", "public/geo/usvi-parcels.geojson", "parcel") ??
      loadJsonSource("parcels_geojson", "public/data/usvi-parcels.geojson", "parcel") ??
      loadJsonSource(
        "parcels_geojson",
        "public/data/usvi-parcels-addressed.geojson",
        "parcel",
      );

    if (parcelsGeo) sources.push(parcelsGeo);
  }

  const geographicIndex = await loadTsSource(
    "geographic_index",
    ["src/data/core/geographicIndex.ts"],
    ["geographicIndex", "GEOGRAPHIC_INDEX", "items", "records"],
  );

  if (geographicIndex) sources.push(geographicIndex);

  const historicSites = await loadTsSource(
    "historic_sites",
    [
      "src/data/historicSites.ts",
      "src/data/history/historicSites.ts",
      "src/data/core/historicSites.ts",
      "src/data/core/historic-sites.ts",
    ],
    ["historicSites", "HISTORIC_SITES", "historicSiteRecords", "records"],
    "historicSite",
  );

  if (historicSites) sources.push(historicSites);

  const publicImages = listFilesRecursive(path.join(ROOT, "public", "images")).map(rel);

  const { issues, counts, add } = addIssueFactory();
  const duplicateMap = new Map<string, { source: string; index: number; name: string }>();

  for (const source of sources) {
    if (source.error) {
      add({
        severity: "high",
        source: source.name,
        index: -1,
        issue: "source_load_error",
        detail: source.error,
        suggestion: `Open ${source.path} and fix parse/import errors first.`,
      });
      continue;
    }

    source.records.forEach((record, index) => {
      auditRecord({
        source,
        record,
        index,
        addIssue: add,
      });

      const name = getFirstString(record, NAME_FIELDS);
      const type = getFirstString(record, TYPE_FIELDS) ?? source.inferredType ?? "";
      const island = normalizeIsland(getFirstString(record, ISLAND_FIELDS)) ?? "";
      const normalizedName = name ? normalizeName(name) : "";

      if (normalizedName) {
        const duplicateKey = `${source.name}|${type}|${island}|${normalizedName}`;
        const previous = duplicateMap.get(duplicateKey);

        if (previous) {
          add({
            severity: "low",
            source: source.name,
            index,
            name,
            issue: "duplicate_name_type_island",
            detail: `Duplicate of ${previous.source} record index ${previous.index}.`,
            suggestion:
              "Confirm whether these are true duplicate records or whether one needs a more specific name.",
          });
        } else {
          duplicateMap.set(duplicateKey, {
            source: source.name,
            index,
            name,
          });
        }
      }
    });
  }


  const issueGroups = [...counts.values()]
    .map((row) => ({
      severity: row.severity,
      source: row.source,
      issue: row.issue,
      count: row.count,
      sampled: row.sampled,
      sampleLimit: ISSUE_SAMPLE_LIMIT_PER_KIND,
    }))
    .sort((a, b) => {
      const severityDiff = severityRank(b.severity) - severityRank(a.severity);
      if (severityDiff !== 0) return severityDiff;
      return b.count - a.count;
    });

  const severityTotals = {
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const row of issueGroups) {
    severityTotals[row.severity] += row.count;
  }

  const totalRecords = sources.reduce((sum, source) => sum + source.records.length, 0);

  const report = {
    generatedAt: new Date().toISOString(),
    options: {
      includeParcels: INCLUDE_PARCELS,
      strict: STRICT,
    },
    totals: {
      publicImages: publicImages.length,
      issuesActual: severityTotals.high + severityTotals.medium + severityTotals.low,
      issuesSampled: issues.length,
      issueSampleLimitPerKind: ISSUE_SAMPLE_LIMIT_PER_KIND,
    },
    sources: sources.map((source) => ({
      name: source.name,
      path: source.path,
      records: source.records.length,
      inferredType: source.inferredType,
      error: source.error,
    })),
    totalRecords,
    severityTotals,
    issueGroups,
    issues,
  };

  writeFileSync(JSON_REPORT, JSON.stringify(report, null, 2));
  writeFileSync(MD_REPORT, makeMarkdown(report));

  console.log("Data cleanliness audit complete.");
  console.log(`Records scanned: ${totalRecords}`);
  console.log(`High: ${severityTotals.high}`);
  console.log(`Medium: ${severityTotals.medium}`);
  console.log(`Low: ${severityTotals.low}`);
  console.log(`JSON report: ${rel(JSON_REPORT)}`);
  console.log(`Markdown report: ${rel(MD_REPORT)}`);

  if (STRICT && severityTotals.high > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
