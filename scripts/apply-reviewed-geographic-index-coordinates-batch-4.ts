// @ts-nocheck

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { geographicIndex } from "../src/data/core/geographicIndex";

const ROOT = process.cwd();
const TARGET_FILE = path.join(ROOT, "src/data/core/geographicIndex.ts");
const REPORT_FILE = path.join(
  ROOT,
  "reports/applied-reviewed-geographic-index-coordinates-batch-4.json"
);
const BACKUP_DIR = path.join(ROOT, "reports/backups");

const SAFE_FIXES = [
  { expectedName: "Grange Gut", expectedType: "estate", expectedIsland: "st_croix", candidate: "The Grange", lat: 17.7313643710483, lng: -64.72092022272085 },
  { expectedName: "La Princesse", expectedType: "estate", expectedIsland: "st_croix", candidate: "Princess", lat: 17.757271983688298, lng: -64.73523993211084 },
  { expectedName: "Maria Hill", expectedType: "hill", expectedIsland: "st_thomas", candidate: "Santa Maria Hill", lat: 18.359333337383298, lng: -64.98905345449211 },
  { expectedName: "Petroglyphs", expectedType: "point", expectedIsland: "st_john", candidate: "Reef Bay Petroglyphs", lat: 18.3241492592502, lng: -64.7379062541914 },
  { expectedName: "Rattan Hills", expectedType: "estate", expectedIsland: "st_croix", candidate: "Rattan", lat: 17.749739825071998, lng: -64.74981364350225 },
  { expectedName: "Reef Bay Estate and Sugar Works Records", expectedType: "archive_record", expectedIsland: "st_john", candidate: "REEF BAY", lat: 18.3241492592502, lng: -64.7379062541914 },
  { expectedName: "Retreat", expectedType: "estate", expectedIsland: "st_thomas", candidate: "ANNA'S RETREAT", lat: 18.34264445784635, lng: -64.88706827427085 },
  { expectedName: "Robe Hill", expectedType: "estate", expectedIsland: "st_croix", candidate: "ROSE HILL", lat: 17.7515172839017, lng: -64.85901212227861 },
  { expectedName: "Saint Georges Ilccli", expectedType: "estate", expectedIsland: "st_croix", candidate: "ST GEORGES", lat: 17.720338285889298, lng: -64.83058165781915 },
  { expectedName: "Sprat Hole", expectedType: "point", expectedIsland: "st_croix", candidate: "Sprat", lat: 17.74306767792325, lng: -64.88348586636539 },
  { expectedName: "Turtledove Cay", expectedType: "island", expectedIsland: "st_thomas", candidate: "Turtle Dove Cay", lat: 18.3086275618696, lng: -65.0003906549153 },
  { expectedName: "Two Brothers", expectedType: "estate", expectedIsland: "st_croix", candidate: "TWO BROTHERS / SMITHFIELD / HESSELBERG", lat: 17.70046990000005, lng: -64.88458695770751 },
  { expectedName: "Two-Friends Hill", expectedType: "estate", expectedIsland: "st_croix", candidate: "TWO FRIENDS", lat: 17.740684267348, lng: -64.8376442242562 },
  { expectedName: "Walberggaard", expectedType: "estate", expectedIsland: "st_croix", candidate: "WALDBERGGAARD", lat: 17.72065511736185, lng: -64.84334261000215 },
  { expectedName: "White's Bay", expectedType: "bay", expectedIsland: "st_croix", candidate: "WHITES BAY (East)", lat: 17.686901929189702, lng: -64.87381669603064 },
  { expectedName: "William valley", expectedType: "estate", expectedIsland: "st_croix", candidate: "WILLIAM", lat: 17.7361947584054, lng: -64.88053609237156 },
  { expectedName: "Windsor Forest", expectedType: "estate", expectedIsland: "st_croix", candidate: "WINDSOR", lat: 17.7603909805568, lng: -64.77313377370525 },
  { expectedName: "Yellow Cliff Bay", expectedType: "bay", expectedIsland: "st_croix", candidate: "YELLOW CLIFF (North)", lat: 17.7474816855347, lng: -64.6188717208027 },
];

const BLOCKED = [
  { name: "Buck Bay", candidate: "BUCK ISLAND", reason: "bay-to-island match is unsafe" },
  { name: "Grove", candidate: "GROVE PLACE", reason: "generic historic fragment" },
  { name: "Hope Point", candidate: "HOPE", reason: "generic Hope match" },
  { name: "Beck Grove", candidate: "GROVE PLACE", reason: "generic Grove match" },
  { name: "Catharina's Hope", candidate: "HOPE", reason: "generic Hope match" },
  { name: "Catherine's Hope", candidate: "HOPE", reason: "generic Hope match" },
  { name: "Cottongrove Hill", candidate: "GROVE PLACE", reason: "wrong Grove candidate" },
  { name: "Orangegrove", candidate: "GROVE PLACE", reason: "wrong Grove candidate" },
  { name: "Orangegrove Road", candidate: "GROVE PLACE", reason: "wrong Grove candidate" },
  { name: "Thatch Hill", candidate: "Thatch Cay", reason: "hill-to-cay match is unsafe" },
  { name: "Valley", candidate: "CANE VALLEY", reason: "generic fragment" },
  { name: "White", candidate: "WHITE LADY", reason: "generic fragment" },
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
  `geographicIndex.reviewed-coordinate-batch-4.${timestamp()}.ts`
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
    coordinateSource: "reviewed_geographic_index_coordinate_batch_4",
    coordinateSourceName: fix.candidate,
    coordinateConfidence: "reviewed",
    coordinateReviewNote: `Reviewed batch 4: matched "${record.name}" to "${fix.candidate}".`,
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

console.log("Reviewed geographic index coordinate batch 4 complete.");
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
