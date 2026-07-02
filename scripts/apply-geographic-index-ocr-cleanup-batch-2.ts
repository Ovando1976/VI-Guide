// @ts-nocheck

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { geographicIndex } from "../src/data/core/geographicIndex";

const ROOT = process.cwd();
const TARGET_FILE = path.join(ROOT, "src/data/core/geographicIndex.ts");
const REPORT_FILE = path.join(ROOT, "reports/applied-geographic-index-ocr-cleanup-batch-2.json");
const BACKUP_DIR = path.join(ROOT, "reports/backups");

const FIXES = [
  {
    index: 72,
    oldName: "Bcotch Reef",
    newName: "Scotch Reef",
    type: "dictionaryEntry",
    island: "st_thomas",
    reason: "Bcotch is likely OCR for Scotch.",
  },
  {
    index: 74,
    oldName: "Beaehing Spit",
    newName: "Beaching Spit",
    type: "point",
    island: "st_john",
    reason: "Beaehing is likely OCR for Beaching.",
  },
  {
    index: 417,
    oldName: "Cehterline Road",
    newName: "Centerline Road",
    type: "point",
    island: "st_croix",
    reason: "Cehterline is likely OCR for Centerline.",
  },
];

function json(value: string) {
  return JSON.stringify(value);
}

function encode(value: string) {
  return encodeURIComponent(value);
}

function findRecordBlock(text: string, id: string) {
  const idNeedle = `"id": ${json(id)}`;
  const idAt = text.indexOf(idNeedle);

  if (idAt < 0) {
    throw new Error(`Could not find record id ${id}`);
  }

  const start = text.lastIndexOf("\n  {", idAt);
  const next = text.indexOf("\n  },\n  {", idAt);
  const finalNext = text.indexOf("\n  }\n];", idAt);
  const end = next >= 0 ? next + "\n  }".length : finalNext + "\n  }".length;

  if (start < 0 || end < 0 || end <= start) {
    throw new Error(`Could not locate full record block for ${id}`);
  }

  return { start, end, block: text.slice(start, end) };
}

function replaceOne(block: string, from: string, to: string, label: string) {
  const count = block.split(from).length - 1;
  if (count !== 1) {
    throw new Error(`Expected exactly one ${label}; found ${count}. Pattern: ${from}`);
  }
  return block.replace(from, to);
}

mkdirSync(BACKUP_DIR, { recursive: true });
mkdirSync(path.dirname(REPORT_FILE), { recursive: true });

let text = readFileSync(TARGET_FILE, "utf8");

const backupFile = path.join(
  BACKUP_DIR,
  `geographicIndex.before-ocr-cleanup-batch-2.${Date.now()}.ts`
);
writeFileSync(backupFile, text);

const applied = [];

for (const fix of FIXES) {
  const record: any = geographicIndex[fix.index];

  if (!record) {
    throw new Error(`Missing record at index ${fix.index}`);
  }

  if (record.name !== fix.oldName) {
    throw new Error(
      `Index ${fix.index} name mismatch. Expected ${fix.oldName}, got ${record.name}`
    );
  }

  if (record.type !== fix.type) {
    throw new Error(
      `Index ${fix.index} type mismatch. Expected ${fix.type}, got ${record.type}`
    );
  }

  if (record.island !== fix.island) {
    throw new Error(
      `Index ${fix.index} island mismatch. Expected ${fix.island}, got ${record.island}`
    );
  }

  const { start, end, block } = findRecordBlock(text, record.id);
  let nextBlock = block;

  nextBlock = replaceOne(
    nextBlock,
    `"name": ${json(fix.oldName)}`,
    `"name": ${json(fix.newName)}`,
    `${fix.oldName} name field`
  );

  if (nextBlock.includes(`"aliases": []`)) {
    nextBlock = nextBlock.replace(
      `"aliases": []`,
      `"aliases": [\n      ${json(fix.oldName)}\n    ]`
    );
  } else if (
    nextBlock.includes(`"aliases": [`) &&
    !nextBlock.includes(json(fix.oldName))
  ) {
    nextBlock = nextBlock.replace(
      `"aliases": [`,
      `"aliases": [\n      ${json(fix.oldName)},`
    );
  }

  const oldEncoded = encode(fix.oldName);
  const newEncoded = encode(fix.newName);

  nextBlock = nextBlock.replaceAll(`context=${oldEncoded}`, `context=${newEncoded}`);
  nextBlock = nextBlock.replaceAll(`q=${oldEncoded}`, `q=${newEncoded}`);

  text = text.slice(0, start) + nextBlock + text.slice(end);

  applied.push({
    index: fix.index,
    id: record.id,
    oldName: fix.oldName,
    newName: fix.newName,
    type: fix.type,
    island: fix.island,
    reason: fix.reason,
  });
}

writeFileSync(TARGET_FILE, text);

writeFileSync(
  REPORT_FILE,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      backupFile: path.relative(ROOT, backupFile),
      targetFile: path.relative(ROOT, TARGET_FILE),
      appliedCount: applied.length,
      applied,
      skippedManualReviewCount: 24,
      note: "Applied only strong OCR corrections from batch 2. Manual review records were intentionally not changed.",
    },
    null,
    2
  ) + "\n"
);

console.log("OCR cleanup batch 2 applied.");
console.log(`Applied: ${applied.length}`);
console.log(`Report: ${path.relative(ROOT, REPORT_FILE)}`);
console.table(
  applied.map((row) => ({
    index: row.index,
    oldName: row.oldName,
    newName: row.newName,
    type: row.type,
    island: row.island,
  }))
);
