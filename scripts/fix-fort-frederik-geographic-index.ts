// @ts-nocheck

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { geographicIndex } from "../src/data/core/geographicIndex";

const ROOT = process.cwd();
const TARGET_FILE = path.join(ROOT, "src/data/core/geographicIndex.ts");
const REPORT_FILE = path.join(ROOT, "reports/fixed-fort-frederik-geographic-index.json");

mkdirSync(path.join(ROOT, "reports"), { recursive: true });

const FORT_FREDERIK_COORDS = {
  // Fort Frederik / Frederiksted, St. Croix
  lat: 17.7129,
  lng: -64.8832,
};

const targets = [
  "st_thomas-historic-frederikalort",
  "st_thomas-historic-fredertksfort",
];

const before = geographicIndex.map((record: any) => ({ ...record }));

const matched = geographicIndex
  .map((record: any, index: number) => ({ record, index }))
  .filter(({ record }) => targets.includes(record.id));

if (matched.length === 0) {
  throw new Error("No Fort Frederik OCR records found.");
}

const keep = matched[0];
const removeIds = new Set(matched.slice(1).map(({ record }) => record.id));

const mergedAliases = new Set<string>();
const mergedSourceIds = new Set<string>();
const mergedDescriptions: string[] = [];

for (const { record } of matched) {
  mergedAliases.add(record.name);
  mergedAliases.add("Frederiksfort");
  mergedAliases.add("Fort Frederik");
  mergedAliases.add("Fort Frederick");
  mergedAliases.add("Fort Frederiksted");

  for (const alias of record.aliases || []) mergedAliases.add(alias);

  for (const sourceId of record.sourceIds?.geographicIndex || []) {
    mergedSourceIds.add(sourceId);
  }

  if (record.id) mergedSourceIds.add(record.id);
  if (record.description && !mergedDescriptions.includes(record.description)) {
    mergedDescriptions.push(record.description);
  }
}

const updated = geographicIndex
  .filter((record: any) => !removeIds.has(record.id))
  .map((record: any) => {
    if (record.id !== keep.record.id) return record;

    return {
      ...record,
      id: "st_croix-historic-fort-frederik",
      name: "Fort Frederik",
      type: "historic",
      island: "st_croix",
      aliases: Array.from(mergedAliases).filter(Boolean).sort(),
      description:
        mergedDescriptions.join(" ") ||
        "Fort Frederik, also known historically as Frederiksfort, is located in Frederiksted, St. Croix.",
      coordinates: FORT_FREDERIK_COORDS,
      routes: {
        knowledge:
          "/history/knowledge?estate=st-croix-historic-fort-frederik&island=st_croix&context=Fort%20Frederik",
        map: "/map?q=Fort%20Frederik&island=st_croix",
      },
      evidence: {
        ...(record.evidence || {}),
        estateLayer: false,
        geographicIndex: true,
        starterGazetteer: false,
        dictionary: true,
        archive: false,
        historicMap: false,
      },
      sources: Array.from(new Set([...(record.sources || []), "geographicIndex"])),
      sourceIds: {
        ...(record.sourceIds || {}),
        geographicIndex: Array.from(mergedSourceIds).sort(),
      },
    };
  });

const report = {
  fixedAt: new Date().toISOString(),
  action: "Corrected Fort Frederik/Frederiksfort OCR records from St. Thomas to St. Croix and merged duplicate records.",
  keptOriginalIndex: keep.index,
  keptOriginalId: keep.record.id,
  removedIds: Array.from(removeIds),
  before: matched.map(({ record, index }) => ({
    index,
    id: record.id,
    name: record.name,
    type: record.type,
    island: record.island,
    coordinates: record.coordinates,
  })),
  after: updated
    .map((record: any, index: number) => ({ record, index }))
    .filter(({ record }) => record.id === "st_croix-historic-fort-frederik")
    .map(({ record, index }) => ({
      index,
      id: record.id,
      name: record.name,
      type: record.type,
      island: record.island,
      coordinates: record.coordinates,
      aliases: record.aliases,
    })),
  removedCount: geographicIndex.length - updated.length,
};

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
writeFileSync(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`);

console.log("Fort Frederik geographic index fix complete.");
console.log(`Removed duplicate records: ${report.removedCount}`);
console.log(`Report: ${path.relative(ROOT, REPORT_FILE)}`);
console.table(report.after);
