// @ts-nocheck

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { geographicIndex } from "../src/data/core/geographicIndex";

const ROOT = process.cwd();
const TARGET_FILE = path.join(ROOT, "src/data/core/geographicIndex.ts");
const REPORT_FILE = path.join(
  ROOT,
  "reports/applied-reviewed-geographic-index-coordinates-batch-5.json"
);
const BACKUP_DIR = path.join(ROOT, "reports/backups");

const SAFE_FIXES = [
  {
    expectedName: "Magen",
    expectedType: "estate",
    expectedIsland: "st_thomas",
    candidate: "Magens Bay",
    lat: 18.3626,
    lng: -64.9307,
  },
  {
    expectedName: "Maho Ball",
    expectedType: "estate",
    expectedIsland: "st_john",
    candidate: "Maho",
    lat: 18.3588,
    lng: -64.7432,
  },
  {
    expectedName: "Mary's Point Buy",
    expectedType: "bay",
    expectedIsland: "st_john",
    candidate: "Mary-Point Estate",
    lat: 18.368333,
    lng: -64.741389,
  },
  {
    expectedName: "North Side",
    expectedType: "estate",
    expectedIsland: "st_croix",
    candidate: "NORTHSIDE",
    lat: 17.75974688135625,
    lng: -64.8840756495307,
  },
  {
    expectedName: "South Bay",
    expectedType: "estate",
    expectedIsland: "st_croix",
    candidate: "BONNE ESPERANCE (SOUTH)",
    lat: 17.74356362461915,
    lng: -64.7692203635706,
  },
  {
    expectedName: "Stewart Bay",
    expectedType: "estate",
    expectedIsland: "st_croix",
    candidate: "MOUNT STEWART",
    lat: 17.747914595970848,
    lng: -64.84303041392059,
  },
];

const BLOCKED = [
  { name: "Buck Bay", candidate: "BUCK ISLAND", reason: "bay-to-island match is unsafe" },
  { name: "Grove", candidate: "GROVE PLACE", reason: "generic historic fragment" },
  { name: "Hope Point", candidate: "HOPE", reason: "generic Hope match" },
  { name: "Beck Grove", candidate: "GROVE PLACE", reason: "generic Grove match" },
  { name: "Catharina's Hope", candidate: "HOPE", reason: "generic Hope match" },
  { name: "Catherine's Hope", candidate: "HOPE", reason: "generic Hope match" },
  { name: "Goodhope Bay", candidate: "HOPE", reason: "generic Hope match" },
  { name: "Nancy's Hope", candidate: "HOPE", reason: "generic Hope match" },
  { name: "Cottongrove Hill", candidate: "GROVE PLACE", reason: "wrong Grove candidate" },
  { name: "Orangegrove", candidate: "GROVE PLACE", reason: "wrong Grove candidate" },
  { name: "Orangegrove Road", candidate: "GROVE PLACE", reason: "wrong Grove candidate" },
  { name: "Thatch Hill", candidate: "Thatch Cay", reason: "hill-to-cay match is unsafe" },
  { name: "Valley", candidate: "CANE VALLEY", reason: "generic fragment" },
  { name: "White", candidate: "WHITE LADY", reason: "generic fragment" },
  { name: "Thomas Harbor", candidate: "THOMAS", reason: "generic Thomas match" },
  { name: "Thomas Hill", candidate: "THOMAS", reason: "generic Thomas match" },
  { name: "Harbor", candidate: "Charlotte Amalie Harbor Historic Maps", reason: "generic harbor fragment" },
];

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function hasCoordinates(record: any) {
  return (
    record?.coordinates &&
    typeof record.coordinates.lat === "number" &&
    typeof record.coordinates.lng === "number"
  );
}

mkdirSync(BACKUP_DIR, { recursive: true });

const originalText = readFileSync(TARGET_FILE, "utf8");
const backupFile = path.join(
  BACKUP_DIR,
  `geographicIndex.reviewed-coordinate-batch-5.${timestamp()}.ts`
);
writeFileSync(backupFile, originalText);

const applied: any[] = [];
const skipped: any[] = [];

const updated = geographicIndex.map((record: any, index: number) => {
  const fix = SAFE_FIXES.find(
    (item) =>
      record.name === item.expectedName &&
      record.type === item.expectedType &&
      record.island === item.expectedIsland
  );

  if (!fix) return record;

  if (hasCoordinates(record)) {
    skipped.push({ index, ...fix, reason: "already has coordinates" });
    return record;
  }

  const next = {
    ...record,
    coordinates: { lat: fix.lat, lng: fix.lng },
    coordinateSource: "reviewed_geographic_index_coordinate_batch_5",
    coordinateSourceName: fix.candidate,
    coordinateConfidence: "reviewed",
    coordinateReviewNote: `Reviewed batch 5: matched "${record.name}" to "${fix.candidate}".`,
  };

  applied.push({
    index,
    name: record.name,
    type: record.type,
    island: record.island,
    candidate: fix.candidate,
    lat: fix.lat,
    lng: fix.lng,
  });

  return next;
});

for (const fix of SAFE_FIXES) {
  const found = geographicIndex.some(
    (record: any) =>
      record.name === fix.expectedName &&
      record.type === fix.expectedType &&
      record.island === fix.expectedIsland
  );

  if (!found) {
    skipped.push({ ...fix, reason: "record not found" });
  }
}

const fileText = `export type GeographicIndexRecord = {
  id?: string;
  name: string;
  type?: string;
  island?: string;
  description?: string;
  aliases?: string[];
  coordinates?: any;
  image?: string;
  imageUrl?: string;
  [key: string]: any;
};

export const geographicIndex: GeographicIndexRecord[] = ${JSON.stringify(updated, null, 2)};

export type GeographicIndexItem = GeographicIndexRecord;

export const geographicIndexItems: GeographicIndexItem[] = geographicIndex;

export default geographicIndex;
`;

writeFileSync(TARGET_FILE, fileText);

const report = {
  generatedAt: new Date().toISOString(),
  backupFile,
  appliedCount: applied.length,
  skippedCount: skipped.length,
  applied,
  skipped,
  blocked: BLOCKED,
};

writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2) + "\n");

console.log("Reviewed geographic index coordinate batch 5 complete.");
console.log(`Applied: ${applied.length}`);
console.log(`Skipped: ${skipped.length}`);
console.log(`Report: ${path.relative(ROOT, REPORT_FILE)}`);
console.table(applied);
if (skipped.length) {
  console.log("Skipped records:");
  console.table(skipped);
}
console.log("Blocked unsafe/generic matches:");
console.table(BLOCKED);
