// @ts-nocheck

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { geographicIndex } from "../src/data/core/geographicIndex";

const ROOT = process.cwd();
const TARGET_FILE = path.join(ROOT, "src/data/core/geographicIndex.ts");
const REPORT_FILE = path.join(
  ROOT,
  "reports/merged-judiths-fancy-geographic-index-duplicate.json"
);
const BACKUP_DIR = path.join(ROOT, "reports/backups");

const KEEP_ID = "st_croix-estate-judiths-fancy";
const REMOVE_ID = "st_croix-estate-judys-fancy";

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function findArrayBounds(source: string) {
  const marker = "export const geographicIndex: GeographicIndexRecord[] = [";
  const start = source.indexOf(marker);
  if (start < 0) throw new Error("Could not find geographicIndex export.");

  const arrayStart = source.indexOf("[", start);
  let depth = 0;
  let inString: string | null = null;
  let escaped = false;

  for (let i = arrayStart; i < source.length; i++) {
    const ch = source[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === inString) {
        inString = null;
      }
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      inString = ch;
      continue;
    }

    if (ch === "[") depth++;
    if (ch === "]") {
      depth--;
      if (depth === 0) {
        const semicolon = source.indexOf(";", i);
        if (semicolon < 0) throw new Error("Could not find geographicIndex semicolon.");
        return {
          before: source.slice(0, start),
          after: source.slice(semicolon + 1),
        };
      }
    }
  }

  throw new Error("Could not find geographicIndex array end.");
}

function uniqueStrings(values: unknown[]) {
  return Array.from(
    new Set(
      values
        .flat()
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        .map((value) => value.trim())
    )
  );
}

const keepIndex = geographicIndex.findIndex((r: any) => r.id === KEEP_ID);
const removeIndex = geographicIndex.findIndex((r: any) => r.id === REMOVE_ID);

if (keepIndex < 0) throw new Error(`Missing keep record: ${KEEP_ID}`);
if (removeIndex < 0) throw new Error(`Missing duplicate record: ${REMOVE_ID}`);

const keep: any = geographicIndex[keepIndex];
const remove: any = geographicIndex[removeIndex];

const merged = {
  ...keep,
  aliases: uniqueStrings([
    ...(keep.aliases || []),
    keep.name,
    remove.name,
    "Judith's Fancy",
    "Judy's Fancy",
    "Judas Fancy",
    "Iudiths",
    "Hemers plantation",
  ]),
  description: keep.description?.includes("Local pronunciation of Judith's Fancy")
    ? keep.description
    : `${keep.description || ""} Local pronunciation note: ${remove.description || "Judy's Fancy is a local pronunciation of Judith's Fancy."}`.trim(),
  sources: uniqueStrings([...(keep.sources || []), ...(remove.sources || [])]),
  sourceIds: {
    ...(keep.sourceIds || {}),
    geographicIndex: uniqueStrings([
      ...((keep.sourceIds || {}).geographicIndex || []),
      ...((remove.sourceIds || {}).geographicIndex || []),
      KEEP_ID,
      REMOVE_ID,
    ]),
  },
  relatedRecordIds: uniqueStrings([...(keep.relatedRecordIds || []), REMOVE_ID]),
};

const next = geographicIndex
  .map((record: any, index: number) => (index === keepIndex ? merged : record))
  .filter((record: any) => record.id !== REMOVE_ID);

mkdirSync(BACKUP_DIR, { recursive: true });
mkdirSync(path.dirname(REPORT_FILE), { recursive: true });

const source = readFileSync(TARGET_FILE, "utf8");
const backupFile = path.join(
  BACKUP_DIR,
  `geographicIndex.merge-judiths-fancy-duplicate.${timestamp()}.ts`
);
writeFileSync(backupFile, source);

const { before, after } = findArrayBounds(source);
const updated =
  `${before}export const geographicIndex: GeographicIndexRecord[] = ${JSON.stringify(next, null, 2)};${after}`;

writeFileSync(TARGET_FILE, updated);

const report = {
  action: "merged_judiths_fancy_duplicate",
  beforeCount: geographicIndex.length,
  afterCount: next.length,
  keepIndex,
  removeIndex,
  keepId: KEEP_ID,
  removedId: REMOVE_ID,
  backupFile,
  keptRecord: merged,
  removedRecord: remove,
};

writeFileSync(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`);

console.log("Merged Judith's Fancy duplicate.");
console.table([
  {
    keptIndex: keepIndex,
    removedIndex: removeIndex,
    beforeCount: geographicIndex.length,
    afterCount: next.length,
    kept: KEEP_ID,
    removed: REMOVE_ID,
  },
]);
console.log(`Report: ${path.relative(ROOT, REPORT_FILE)}`);
console.log(`Backup: ${path.relative(ROOT, backupFile)}`);
