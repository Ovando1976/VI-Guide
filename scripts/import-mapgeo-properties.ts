import fs from "node:fs";
import path from "node:path";

const MAPGEO_SEARCH_URL =
  "https://usvi.mapgeo.io/api/datasets/properties/search?format=json";

const INPUT_PARCELS = path.resolve("public/data/usvi-parcels-addressed.geojson");
const OUTPUT_DIR = path.resolve("generated/mapgeo");
const OUTPUT_RECORDS = path.join(OUTPUT_DIR, "mapgeo-property-records.json");
const OUTPUT_PROGRESS = path.join(OUTPUT_DIR, "mapgeo-import-progress.json");
const OUTPUT_GEOJSON = path.resolve("public/data/usvi-parcels-mapgeo-enriched.geojson");

const LIMIT = Number(process.env.MAPGEO_LIMIT ?? 0);
const OFFSET = Number(process.env.MAPGEO_OFFSET ?? 0);
const DELAY_MS = Number(process.env.MAPGEO_DELAY_MS ?? 250);
const MAX_RETRIES = Number(process.env.MAPGEO_MAX_RETRIES ?? 3);
const CHECKPOINT_EVERY = Number(process.env.MAPGEO_CHECKPOINT_EVERY ?? 10);
const RESUME = process.env.MAPGEO_RESUME !== "false";

type MapGeoRecord = {
  id: string;
  displayName?: string;
  ownerName?: string;
  geometry?: string;
  centroid?: string;
  mapGeoSearchRank?: number;
};

type Feature = {
  type: "Feature";
  properties: Record<string, any>;
  geometry: any;
};

type FeatureCollection = {
  type: "FeatureCollection";
  features: Feature[];
};

type ProgressFile = {
  startedAt: string;
  updatedAt: string;
  totalUniqueIds: number;
  targetCount: number;
  processedCount: number;
  matchedCount: number;
  emptyCount: number;
  failedCount: number;
  lastParcelId?: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clean(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const text = String(value).replace(/\s+/g, " ").trim();
  return text.length ? text : undefined;
}

function ensureDir() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const text = fs.readFileSync(filePath, "utf8").trim();
    if (!text) return fallback;
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

function writeJsonAtomic(filePath: string, value: unknown) {
  const tmp = `${filePath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
  fs.renameSync(tmp, filePath);
}

function parseJsonField(value?: string) {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function getParcelId(feature: Feature): string | undefined {
  const p = feature.properties ?? {};
  return (
    clean(p.propertyId) ??
    clean(p.PropertyID) ??
    clean(p.PROPERTYID) ??
    clean(p.parcelId) ??
    clean(p.sourceParcelNo) ??
    clean(p.PARCELID) ??
    clean(p.PARCEL_ID)
  );
}

function buildSearchableText(props: Record<string, any>) {
  return Array.from(
    new Set(
      [
        props.parcelId,
        props.propertyId,
        props.mapGeoAddress,
        props.displayAddress,
        props.ownerName,
        props.island,
        props.estateName,
        props.quarterName,
        props.addressSource,
      ]
        .filter(Boolean)
        .map(String)
    )
  );
}

async function fetchMapGeoRecords(parcelId: string): Promise<MapGeoRecord[]> {
  const body = {
    attributes: ["displayName", "ownerName", "id"],
    quickSearch: parcelId,
    page: 1,
  };

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(MAPGEO_SEARCH_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "user-agent": "VI-Guide-MapGeo-Importer/1.0",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`MapGeo HTTP ${res.status}`);

      const data = await res.json();
      if (!Array.isArray(data)) return [];

      return data.filter(
        (item): item is MapGeoRecord =>
          item &&
          typeof item === "object" &&
          typeof item.id === "string"
      );
    } catch (err) {
      console.warn(
        `MapGeo fetch failed for ${parcelId}, attempt ${attempt}/${MAX_RETRIES}`,
        err
      );

      if (attempt < MAX_RETRIES) {
        await sleep(DELAY_MS * attempt * 2);
      }
    }
  }

  return [];
}

function chooseBestRecord(parcelId: string, records: MapGeoRecord[]) {
  const exact = records.find((record) => record.id === parcelId);
  if (exact) return exact;

  const rankOne = records.find((record) => record.mapGeoSearchRank === 1);
  if (rankOne) return rankOne;

  return records[0];
}

function makeProgress(
  totalUniqueIds: number,
  targetCount: number,
  recordsById: Record<string, MapGeoRecord[]>,
  lastParcelId?: string
): ProgressFile {
  const values = Object.values(recordsById);

  return {
    startedAt: readJsonFile<ProgressFile | null>(OUTPUT_PROGRESS, null)?.startedAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalUniqueIds,
    targetCount,
    processedCount: values.length,
    matchedCount: values.filter((records) => records.length > 0).length,
    emptyCount: values.filter((records) => records.length === 0).length,
    failedCount: 0,
    lastParcelId,
  };
}

function saveCheckpoint(
  recordsById: Record<string, MapGeoRecord[]>,
  totalUniqueIds: number,
  targetCount: number,
  lastParcelId?: string
) {
  writeJsonAtomic(OUTPUT_RECORDS, recordsById);
  writeJsonAtomic(
    OUTPUT_PROGRESS,
    makeProgress(totalUniqueIds, targetCount, recordsById, lastParcelId)
  );
}

function enrichGeojson(
  parcels: FeatureCollection,
  recordsById: Record<string, MapGeoRecord[]>
) {
  let enrichedCount = 0;

  for (const feature of parcels.features) {
    const parcelId = getParcelId(feature);
    if (!parcelId) continue;

    const records = recordsById[parcelId] ?? [];
    const best = chooseBestRecord(parcelId, records);
    if (!best) continue;

    const parsedCentroid = parseJsonField(best.centroid);
    const parsedGeometry = parseJsonField(best.geometry);

    feature.properties = {
      ...feature.properties,
      propertyId: best.id,
      parcelId: best.id,
      mapGeoAddress: clean(best.displayName),
      displayAddress: clean(best.displayName) ?? feature.properties.displayAddress,
      ownerName: clean(best.ownerName) ?? feature.properties.ownerName,
      mapGeoSearchRank: best.mapGeoSearchRank,
      mapGeoCentroid: parsedCentroid,
      mapGeoGeometryType: parsedGeometry?.type,
      mapGeoRecordCount: records.length,
      addressSource: "mapgeo-direct-api",
    };

    feature.properties.searchableText = buildSearchableText(feature.properties);
    enrichedCount++;
  }

  return enrichedCount;
}

async function main() {
  ensureDir();

  const parcels = JSON.parse(
    fs.readFileSync(INPUT_PARCELS, "utf8")
  ) as FeatureCollection;

  const ids = Array.from(
    new Set(parcels.features.map(getParcelId).filter(Boolean) as string[])
  );

  const slicedIds = ids.slice(OFFSET);
  const targetIds = LIMIT > 0 ? slicedIds.slice(0, LIMIT) : slicedIds;

  let recordsById: Record<string, MapGeoRecord[]> = {};

  if (RESUME && fs.existsSync(OUTPUT_RECORDS)) {
    recordsById = readJsonFile<Record<string, MapGeoRecord[]>>(OUTPUT_RECORDS, {});
    console.log(`Resuming from checkpoint: ${Object.keys(recordsById).length} IDs already saved`);
  }

  console.log(`Unique parcel/property IDs: ${ids.length}`);
  console.log(`Offset: ${OFFSET}`);
  console.log(`Importing target IDs: ${targetIds.length}`);
  console.log(`Resume: ${RESUME}`);
  console.log(`Checkpoint every: ${CHECKPOINT_EVERY}`);

  let fetchedThisRun = 0;
  let skippedThisRun = 0;
  let lastParcelId: string | undefined;

  const saveAndExit = () => {
    console.log("\nSaving checkpoint before exit...");
    saveCheckpoint(recordsById, ids.length, targetIds.length, lastParcelId);
    const enrichedCount = enrichGeojson(parcels, recordsById);
    writeJsonAtomic(OUTPUT_GEOJSON, parcels);
    console.log(`Saved checkpoint. Enriched parcel features: ${enrichedCount}`);
    process.exit(0);
  };

  process.once("SIGINT", saveAndExit);
  process.once("SIGTERM", saveAndExit);

  for (let i = 0; i < targetIds.length; i++) {
    const parcelId = targetIds[i];
    lastParcelId = parcelId;

    if (RESUME && Object.prototype.hasOwnProperty.call(recordsById, parcelId)) {
      skippedThisRun++;
      console.log(`[${i + 1}/${targetIds.length}] ${parcelId} skipped`);
      continue;
    }

    console.log(`[${i + 1}/${targetIds.length}] ${parcelId}`);

    const records = await fetchMapGeoRecords(parcelId);
    recordsById[parcelId] = records;
    fetchedThisRun++;

    if (fetchedThisRun % CHECKPOINT_EVERY === 0) {
      saveCheckpoint(recordsById, ids.length, targetIds.length, parcelId);
      console.log(`Checkpoint saved at ${fetchedThisRun} fetched this run.`);
    }

    await sleep(DELAY_MS);
  }

  saveCheckpoint(recordsById, ids.length, targetIds.length, lastParcelId);

  const enrichedCount = enrichGeojson(parcels, recordsById);
  writeJsonAtomic(OUTPUT_GEOJSON, parcels);

  const allRecords = Object.values(recordsById);
  const matched = allRecords.filter((records) => records.length > 0).length;
  const empty = allRecords.filter((records) => records.length === 0).length;

  console.log("MapGeo import complete.");
  console.log(`Fetched this run: ${fetchedThisRun}`);
  console.log(`Skipped this run: ${skippedThisRun}`);
  console.log(`Checkpoint IDs saved: ${Object.keys(recordsById).length}`);
  console.log(`Matched IDs: ${matched}`);
  console.log(`Empty IDs: ${empty}`);
  console.log(`Enriched parcel features: ${enrichedCount}`);
  console.log(`Records: ${OUTPUT_RECORDS}`);
  console.log(`Progress: ${OUTPUT_PROGRESS}`);
  console.log(`GeoJSON: ${OUTPUT_GEOJSON}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});