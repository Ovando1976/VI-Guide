// @ts-nocheck

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { geographicIndex } from "../src/data/core/geographicIndex";

const ROOT = process.cwd();
const TARGET_FILE = path.join(ROOT, "src/data/core/geographicIndex.ts");
const REPORT_FILE = path.join(ROOT, "reports/fixed-frederiksfort-ocr-duplicate.json");
const BACKUP_DIR = path.join(ROOT, "reports/backups");

const KEEP = {
  index: 856,
  id: "st_thomas-historic-frederikalort",
  expectedName: "Frederiksfort",
};

const VARIANT = {
  index: 863,
  id: "st_thomas-historic-fredertksfort",
  oldName: "Frederiksfort",
  newName: "Frederiksfort OCR Variant",
  originalOcrName: "Fredertksfort",
};

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

const keepRecord: any = geographicIndex[KEEP.index];
const variantRecord: any = geographicIndex[VARIANT.index];

if (!keepRecord || keepRecord.id !== KEEP.id || keepRecord.name !== KEEP.expectedName) {
  throw new Error(
    `Keeper mismatch at ${KEEP.index}. Got ${JSON.stringify({
      id: keepRecord?.id,
      name: keepRecord?.name,
    })}`
  );
}

if (!variantRecord || variantRecord.id !== VARIANT.id || variantRecord.name !== VARIANT.oldName) {
  throw new Error(
    `Variant mismatch at ${VARIANT.index}. Got ${JSON.stringify({
      id: variantRecord?.id,
      name: variantRecord?.name,
    })}`
  );
}

mkdirSync(BACKUP_DIR, { recursive: true });
mkdirSync(path.dirname(REPORT_FILE), { recursive: true });

let text = readFileSync(TARGET_FILE, "utf8");

const backupFile = path.join(
  BACKUP_DIR,
  `geographicIndex.before-frederiksfort-duplicate-fix.${Date.now()}.ts`
);
writeFileSync(backupFile, text);

const { start, end, block } = findRecordBlock(text, VARIANT.id);

let nextBlock = block;

nextBlock = replaceOne(
  nextBlock,
  `"name": ${json(VARIANT.oldName)}`,
  `"name": ${json(VARIANT.newName)}`,
  "variant name"
);

if (!nextBlock.includes(json(VARIANT.originalOcrName))) {
  if (nextBlock.includes(`"aliases": []`)) {
    nextBlock = nextBlock.replace(
      `"aliases": []`,
      `"aliases": [\n      ${json(VARIANT.oldName)},\n      ${json(VARIANT.originalOcrName)}\n    ]`
    );
  } else if (nextBlock.includes(`"aliases": [`)) {
    nextBlock = nextBlock.replace(
      `"aliases": [`,
      `"aliases": [\n      ${json(VARIANT.oldName)},\n      ${json(VARIANT.originalOcrName)},`
    );
  }
}

nextBlock = nextBlock.replaceAll(
  `context=${encode(VARIANT.oldName)}`,
  `context=${encode(VARIANT.newName)}`
);

nextBlock = nextBlock.replaceAll(
  `q=${encode(VARIANT.oldName)}`,
  `q=${encode(VARIANT.newName)}`
);

text = text.slice(0, start) + nextBlock + text.slice(end);
writeFileSync(TARGET_FILE, text);

const report = {
  generatedAt: new Date().toISOString(),
  backupFile: path.relative(ROOT, backupFile),
  keeper: {
    index: KEEP.index,
    id: KEEP.id,
    name: KEEP.expectedName,
  },
  variant: {
    index: VARIANT.index,
    id: VARIANT.id,
    oldName: VARIANT.oldName,
    newName: VARIANT.newName,
    originalOcrName: VARIANT.originalOcrName,
  },
};

writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));

console.log("Frederiksfort OCR duplicate fixed.");
console.table([report.keeper, report.variant]);
console.log(`Report: ${path.relative(ROOT, REPORT_FILE)}`);
