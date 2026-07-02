// @ts-nocheck

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { geographicIndex } from "../src/data/core/geographicIndex";

const ROOT = process.cwd();
const TARGET_FILE = path.join(ROOT, "src/data/core/geographicIndex.ts");
const REPORT_FILE = path.join(
  ROOT,
  "reports/applied-geographic-index-ocr-cleanup-next.json"
);
const BACKUP_DIR = path.join(ROOT, "reports/backups");

const FIXES = [
  { index: 138, oldName: "Blg Faat Cay", newName: "Big Flat Cay", type: "point", island: "st_thomas" },
  { index: 163, oldName: "Bonne EspBrance", newName: "Bonne Esperance", type: "estate", island: "st_croix" },
  { index: 188, oldName: "Bordeouo plantation", newName: "Bordeaux plantation", type: "dictionaryEntry", island: "st_thomas" },
  { index: 190, oldName: "Borpenfrei", newName: "Borgenfrei", type: "estate", island: "st_thomas" },
  { index: 251, oldName: "Buona Viata", newName: "Buona Vista", type: "estate", island: "st_john" },
  { index: 257, oldName: "Busna Eaperanza", newName: "Buena Esperanza", type: "estate", island: "st_thomas" },
  { index: 274, oldName: "Cabriteberg P o C t", newName: "Cabriteberg Point", type: "point", island: "st_thomas" },
  { index: 281, oldName: "Caetelpolnt", newName: "Castle Point", type: "point", island: "st_thomas" },
  { index: 282, oldName: "Cahritahorn Point", newName: "Cabritahorn Point", type: "point", island: "st_john" },
  { index: 687, oldName: "Durloe Channd", newName: "Durloe Channel", type: "point", island: "st_john" },
  { index: 695, oldName: "E'ostcnd Cape", newName: "Eastend Cape", type: "point", island: "st_john" },
  { index: 793, oldName: "Flag H i l l", newName: "Flag Hill", type: "point", island: "st_thomas" },
  { index: 805, oldName: "Flanagan Pasw ge", newName: "Flanagan Passage", type: "point", island: "st_john" },
  { index: 810, oldName: "Fointe dol Nordoueete", newName: "Pointe du Nordoueste", type: "point", island: "st_thomas" },
  { index: 855, oldName: "Frederik P o i n t", newName: "Frederik Point", type: "point", island: "st_thomas" },
  { index: 856, oldName: "Frederikalort", newName: "Frederiksfort", type: "historic", island: "st_thomas" },
  { index: 863, oldName: "Fredertksfort", newName: "Frederiksfort", type: "historic", island: "st_thomas" },
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

const startedAt = new Date().toISOString();
let text = readFileSync(TARGET_FILE, "utf8");

const backupFile = path.join(
  BACKUP_DIR,
  `geographicIndex.before-ocr-cleanup-next.${Date.now()}.ts`
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
    oldEncoded,
    newEncoded,
  });
}

writeFileSync(TARGET_FILE, text);

writeFileSync(
  REPORT_FILE,
  JSON.stringify(
    {
      startedAt,
      finishedAt: new Date().toISOString(),
      backupFile: path.relative(ROOT, backupFile),
      targetFile: path.relative(ROOT, TARGET_FILE),
      appliedCount: applied.length,
      applied,
    },
    null,
    2
  )
);

console.log("Safe OCR cleanup applied.");
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
