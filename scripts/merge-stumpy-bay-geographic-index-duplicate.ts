// @ts-nocheck

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { geographicIndex } from "../src/data/core/geographicIndex";

const ROOT = process.cwd();
const TARGET_FILE = path.join(ROOT, "src/data/core/geographicIndex.ts");
const REPORT_FILE = path.join(ROOT, "reports/merged-stumpy-bay-geographic-index-duplicate.json");
const BACKUP_DIR = path.join(ROOT, "reports/backups");

mkdirSync(path.join(ROOT, "reports"), { recursive: true });
mkdirSync(BACKUP_DIR, { recursive: true });

const matches = geographicIndex
  .map((record: any, index: number) => ({ index, record }))
  .filter(
    ({ record }) =>
      record?.name === "Stumpy Bay" &&
      record?.type === "bay" &&
      record?.island === "st_thomas"
  );

if (matches.length < 2) {
  throw new Error(`Expected at least two Stumpy Bay duplicates; found ${matches.length}`);
}

const keeper =
  matches.find(({ record }) => String(record.id || "").includes("stumpy-bay")) ||
  matches[matches.length - 1];

const removals = matches.filter(({ record }) => record.id !== keeper.record.id);

if (removals.length === 0) {
  throw new Error("No Stumpy Bay duplicate removal candidates found.");
}

function json(value: string) {
  return JSON.stringify(value);
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

function addAliases(block: string, aliases: string[]) {
  const uniqueAliases = [...new Set(aliases.filter(Boolean))];

  for (const alias of uniqueAliases) {
    if (block.includes(json(alias))) continue;

    if (block.includes(`"aliases": []`)) {
      block = block.replace(
        `"aliases": []`,
        `"aliases": [\n      ${json(alias)}\n    ]`
      );
      continue;
    }

    if (block.includes(`"aliases": [`)) {
      block = block.replace(
        `"aliases": [`,
        `"aliases": [\n      ${json(alias)},`
      );
      continue;
    }

    block = block.replace(
      /(\n    "description": )/,
      `\n    "aliases": [\n      ${json(alias)}\n    ],$1`
    );
  }

  return block;
}

function appendDescriptionNote(block: string, notes: string[]) {
  const uniqueNotes = [...new Set(notes.filter(Boolean))];

  if (!uniqueNotes.length) return block;

  const note = uniqueNotes.join(" ");
  if (block.includes(note)) return block;

  const descriptionMatch = block.match(/"description": "((?:\\"|[^"])*)"/);

  if (!descriptionMatch) {
    return block.replace(
      /(\n    "coordinates": )/,
      `\n    "description": ${json(note)},$1`
    );
  }

  const oldEncodedDescription = descriptionMatch[1];
  const oldDescription = JSON.parse(`"${oldEncodedDescription}"`);
  const nextDescription = `${oldDescription} ${note}`.replace(/\s+/g, " ").trim();

  return block.replace(
    `"description": ${json(oldDescription)}`,
    `"description": ${json(nextDescription)}`
  );
}

let text = readFileSync(TARGET_FILE, "utf8");

const backupFile = path.join(
  BACKUP_DIR,
  `geographicIndex.before-merge-stumpy-bay.${Date.now()}.ts`
);
writeFileSync(backupFile, text);

const mergedAliases = [];
const mergedNotes = [];

for (const { record } of removals) {
  mergedAliases.push(record.name);
  mergedAliases.push(...(record.aliases || []));
  mergedAliases.push(record.id);
  if (record.description) {
    mergedNotes.push(`Merged duplicate OCR entry ${record.id}: ${record.description}`);
  }
}

const keeperBlockInfo = findRecordBlock(text, keeper.record.id);
let keeperBlock = keeperBlockInfo.block;

keeperBlock = addAliases(keeperBlock, mergedAliases);
keeperBlock = appendDescriptionNote(keeperBlock, mergedNotes);

text =
  text.slice(0, keeperBlockInfo.start) +
  keeperBlock +
  text.slice(keeperBlockInfo.end);

for (const { record } of [...removals].sort((a, b) => b.index - a.index)) {
  const removalBlockInfo = findRecordBlock(text, record.id);
  let removeStart = removalBlockInfo.start;
  let removeEnd = removalBlockInfo.end;

  if (text.slice(removeEnd, removeEnd + 2) === ",\n") {
    removeEnd += 2;
  } else if (text.slice(removeStart - 2, removeStart) === ",\n") {
    removeStart -= 2;
  }

  text = text.slice(0, removeStart) + text.slice(removeEnd);
}

writeFileSync(TARGET_FILE, text);

const report = {
  generatedAt: new Date().toISOString(),
  targetFile: path.relative(ROOT, TARGET_FILE),
  backupFile: path.relative(ROOT, backupFile),
  keeper: {
    index: keeper.index,
    id: keeper.record.id,
    name: keeper.record.name,
    type: keeper.record.type,
    island: keeper.record.island,
    aliasesBefore: keeper.record.aliases || [],
    coordinates: keeper.record.coordinates ?? null,
  },
  removed: removals.map(({ index, record }) => ({
    index,
    id: record.id,
    name: record.name,
    type: record.type,
    island: record.island,
    aliases: record.aliases || [],
    description: record.description || null,
    coordinates: record.coordinates ?? null,
  })),
};

writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2) + "\n");

console.log("Stumpy Bay duplicate merged.");
console.log(`Keeper: ${keeper.record.id}`);
console.log(`Removed: ${removals.length}`);
console.log(`Report: ${path.relative(ROOT, REPORT_FILE)}`);
console.table([
  {
    action: "keep",
    index: keeper.index,
    id: keeper.record.id,
    name: keeper.record.name,
    type: keeper.record.type,
    island: keeper.record.island,
  },
  ...removals.map(({ index, record }) => ({
    action: "remove",
    index,
    id: record.id,
    name: record.name,
    type: record.type,
    island: record.island,
  })),
]);
