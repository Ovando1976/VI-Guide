import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TARGET_FILE = path.join(ROOT, "src/data/core/geographicIndex.ts");
const REPORT_FILE = path.join(
  ROOT,
  "reports/renamed-judys-fancy-local-pronunciation.json"
);

const text = readFileSync(TARGET_FILE, "utf8");

const id = `"id": "st_croix-estate-judys-fancy"`;
const idAt = text.indexOf(id);

if (idAt < 0) {
  throw new Error("Could not find st_croix-estate-judys-fancy record.");
}

const nextRecordAt = text.indexOf('\n  },\n  {', idAt);
if (nextRecordAt < 0) {
  throw new Error("Could not find end of Judy's Fancy record.");
}

const before = text.slice(0, idAt);
let record = text.slice(idAt, nextRecordAt);
const after = text.slice(nextRecordAt);

const originalRecord = record;

record = record.replace(
  `"name": "Judith's Fancy"`,
  `"name": "Judy's Fancy"`
);

record = record.replace(
  `"aliases": []`,
  `"aliases": [
    "Judith's Fancy",
    "Judas Fancy",
    "local pronunciation of Judith's Fancy"
  ]`
);

if (record === originalRecord) {
  throw new Error("Record was found, but no change was applied.");
}

const updated = before + record + after;
writeFileSync(TARGET_FILE, updated);

mkdirSync(path.dirname(REPORT_FILE), { recursive: true });
writeFileSync(
  REPORT_FILE,
  JSON.stringify(
    {
      action: "renamed_duplicate_pronunciation_record",
      id: "st_croix-estate-judys-fancy",
      oldName: "Judith's Fancy",
      newName: "Judy's Fancy",
      reason:
        "Avoid duplicate_name_type_island with the official Judiths Fancy estate record while preserving the local pronunciation record.",
    },
    null,
    2
  ) + "\n"
);

console.log("Renamed duplicate pronunciation record:");
console.table([
  {
    id: "st_croix-estate-judys-fancy",
    oldName: "Judith's Fancy",
    newName: "Judy's Fancy",
  },
]);
console.log(`Report: ${path.relative(ROOT, REPORT_FILE)}`);
