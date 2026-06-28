import { atlasMetadata, atlasRecords } from "../src/data/atlas/masterAtlas";

type AtlasRecord = {
  id: string;
  name: string;
  type: string;
  island: string;
  sources?: readonly string[];
  aliases?: readonly string[];
  description?: string;
  routes?: Record<string, string | undefined>;
};

const records = atlasRecords as readonly AtlasRecord[];
const errors: string[] = [];
const warnings: string[] = [];

const VALID_ISLANDS = new Set([
  "st_thomas",
  "st_john",
  "st_croix",
  "water_island",
]);

function fail(message: string) {
  errors.push(message);
}

function warn(message: string) {
  warnings.push(message);
}

function norm(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/^estate\s+/i, "")
    .replace(/['’]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const officialEstateSourceCount = Number(atlasMetadata.bySource.estates ?? 0);

const canonicalEstateRecords = records.filter((record) =>
  record.sources?.includes("estates"),
);

if (officialEstateSourceCount !== 420) {
  fail(
    `Official estate source count must be 420. Found ${officialEstateSourceCount}.`,
  );
}

if (canonicalEstateRecords.length > 420) {
  fail(
    `Canonical estate records cannot exceed 420. Found ${canonicalEstateRecords.length}.`,
  );
}

const seenIds = new Set<string>();
const seenPlaceKeys = new Set<string>();

for (const record of records) {
  if (!record.id) fail("Record missing id.");
  if (!record.name) fail(`Record ${record.id} missing name.`);
  if (!record.type) fail(`Record ${record.id} missing type.`);
  if (!record.island) fail(`Record ${record.id} missing island.`);

  if (record.id && seenIds.has(record.id)) {
    fail(`Duplicate atlas id: ${record.id}`);
  }

  seenIds.add(record.id);

  if (!VALID_ISLANDS.has(record.island)) {
    warn(`Record ${record.id} has unusual island value: ${record.island}`);
  }

  const placeKey = `${record.island}:${record.type}:${norm(record.name)}`;

  if (seenPlaceKeys.has(placeKey)) {
    warn(`Possible duplicate place key: ${placeKey}`);
  }

  seenPlaceKeys.add(placeKey);

  if (!record.sources?.length) {
    warn(`Record ${record.id} has no sources.`);
  }

  if (record.routes) {
    for (const [routeName, route] of Object.entries(record.routes)) {
      if (route && !route.startsWith("/")) {
        warn(`Record ${record.id} has suspicious ${routeName} route: ${route}`);
      }
    }
  }
}

console.log("Atlas Audit");
console.log("===========");
console.log(`Records: ${records.length}`);
console.log(`Official estate source records: ${officialEstateSourceCount}`);
console.log(`Canonical estate records: ${canonicalEstateRecords.length}`);
console.log(`Warnings: ${warnings.length}`);
console.log(`Errors: ${errors.length}`);

if (warnings.length) {
  console.log("\nWarnings:");
  for (const warning of warnings.slice(0, 50)) console.log(`- ${warning}`);
}

if (errors.length) {
  console.log("\nErrors:");
  for (const error of errors) console.log(`- ${error}`);
  process.exit(1);
}

console.log("\nAtlas data passed.");
