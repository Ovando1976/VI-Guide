// @ts-nocheck

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const INDEX_FILE = path.join(ROOT, "src/data/core/geographicIndex.ts");
const MERGE_REPORT_FILE = path.join(
  ROOT,
  "reports/merged-geographic-index-ocr-duplicates.json"
);
const REPAIR_REPORT_FILE = path.join(
  ROOT,
  "reports/repaired-geographic-index-duplicate-aliases.json"
);
const BACKUP_DIR = path.join(ROOT, "reports/backups");

function stripDiacritics(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalize(value: unknown) {
  return stripDiacritics(String(value || ""))
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9']+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findObjectAround(text: string, id: string) {
  const idPos = text.indexOf(JSON.stringify(id));

  if (idPos < 0) {
    return null;
  }

  let start = idPos;
  let quote = "";
  let escaped = false;

  for (; start >= 0; start -= 1) {
    const ch = text[start];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === quote) {
        quote = "";
      }
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }

    if (ch === "{") break;
  }

  if (start < 0) return null;

  let depth = 0;
  quote = "";
  escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let end = start; end < text.length; end += 1) {
    const ch = text[end];
    const next = text[end + 1];

    if (lineComment) {
      if (ch === "\n") lineComment = false;
      continue;
    }

    if (blockComment) {
      if (ch === "*" && next === "/") {
        blockComment = false;
        end += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === quote) {
        quote = "";
      }
      continue;
    }

    if (ch === "/" && next === "/") {
      lineComment = true;
      end += 1;
      continue;
    }

    if (ch === "/" && next === "*") {
      blockComment = true;
      end += 1;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }

    if (ch === "{") depth += 1;

    if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        return { start, end: end + 1 };
      }
    }
  }

  return null;
}

function parseAliasValues(aliasPropertyText: string) {
  const values = [];
  const stringMatches =
    aliasPropertyText.match(/"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'/g) || [];

  for (const raw of stringMatches) {
    try {
      if (raw.startsWith('"')) {
        values.push(JSON.parse(raw));
      } else {
        values.push(raw.slice(1, -1));
      }
    } catch {
      values.push(raw.slice(1, -1));
    }
  }

  return values.filter(Boolean);
}

function repairAliasesInObject(objectText: string) {
  const matches = [...objectText.matchAll(/["']aliases["']\s*:\s*\[[\s\S]*?\]\s*,?/g)];

  if (matches.length <= 1) {
    return {
      changed: false,
      objectText,
      aliases: [],
      duplicateProperties: matches.length,
    };
  }

  const aliases = [];

  for (const match of matches) {
    for (const alias of parseAliasValues(match[0])) {
      if (!aliases.some((existing) => normalize(existing) === normalize(alias))) {
        aliases.push(alias);
      }
    }
  }

  const mergedAliasLine = `"aliases": ${JSON.stringify(aliases)},`;

  let repaired = objectText;
  const ranges = matches
    .map((match, i) => ({
      index: i,
      start: match.index || 0,
      end: (match.index || 0) + match[0].length,
      text: match[0],
    }))
    .sort((a, b) => b.start - a.start);

  for (const range of ranges) {
    if (range.index === 0) {
      repaired =
        repaired.slice(0, range.start) +
        mergedAliasLine +
        repaired.slice(range.end);
    } else {
      let removeStart = range.start;
      let removeEnd = range.end;

      while (removeStart > 0 && /[ \t]/.test(repaired[removeStart - 1])) {
        removeStart -= 1;
      }

      if (removeStart > 0 && repaired[removeStart - 1] === "\n") {
        removeStart -= 1;
      }

      repaired = repaired.slice(0, removeStart) + repaired.slice(removeEnd);
    }
  }

  return {
    changed: repaired !== objectText,
    objectText: repaired,
    aliases,
    duplicateProperties: matches.length,
  };
}

function main() {
  if (!existsSync(INDEX_FILE)) {
    throw new Error(`Missing file: ${INDEX_FILE}`);
  }

  if (!existsSync(MERGE_REPORT_FILE)) {
    throw new Error(`Missing merge report: ${MERGE_REPORT_FILE}`);
  }

  mkdirSync(BACKUP_DIR, { recursive: true });

  const text = readFileSync(INDEX_FILE, "utf8");
  const mergeReport = JSON.parse(readFileSync(MERGE_REPORT_FILE, "utf8"));
  const mergedRecords = mergeReport.mergedRecords || [];

  const backupFile = path.join(
    BACKUP_DIR,
    `geographicIndex.duplicate-alias-repair.${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.ts`
  );

  copyFileSync(INDEX_FILE, backupFile);

  const repairs = [];
  const skipped = [];

  const replacements = mergedRecords
    .map((record: any) => {
      const targetId = record.targetId || record.keep || record.targetID;

      if (!targetId) {
        skipped.push({
          record,
          reason: "missing_target_id",
        });
        return null;
      }

      const span = findObjectAround(text, targetId);

      if (!span) {
        skipped.push({
          targetId,
          reason: "target_object_not_found",
        });
        return null;
      }

      const before = text.slice(span.start, span.end);
      const repaired = repairAliasesInObject(before);

      if (!repaired.changed) {
        skipped.push({
          targetId,
          reason: "no_duplicate_aliases_found",
          duplicateProperties: repaired.duplicateProperties,
        });
        return null;
      }

      repairs.push({
        targetId,
        targetName: record.targetName,
        sourceId: record.sourceId,
        sourceName: record.sourceName,
        aliases: repaired.aliases,
        duplicateProperties: repaired.duplicateProperties,
      });

      return {
        start: span.start,
        end: span.end,
        replacement: repaired.objectText,
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.start - a.start);

  let nextText = text;

  for (const replacement of replacements) {
    nextText =
      nextText.slice(0, replacement.start) +
      replacement.replacement +
      nextText.slice(replacement.end);
  }

  writeFileSync(INDEX_FILE, nextText);

  writeFileSync(
    REPAIR_REPORT_FILE,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        updatedFile: path.relative(ROOT, INDEX_FILE),
        backupFile: path.relative(ROOT, backupFile),
        sourceMergeReport: path.relative(ROOT, MERGE_REPORT_FILE),
        attempted: mergedRecords.length,
        repaired: repairs.length,
        skipped: skipped.length,
        repairedRecords: repairs,
        skippedRecords: skipped,
      },
      null,
      2
    )
  );

  console.log("Geographic index duplicate alias properties repaired.");
  console.log(`Attempted: ${mergedRecords.length}`);
  console.log(`Repaired: ${repairs.length}`);
  console.log(`Skipped: ${skipped.length}`);
  console.log(`Backup: ${path.relative(ROOT, backupFile)}`);
  console.log(`Report: ${path.relative(ROOT, REPAIR_REPORT_FILE)}`);

  console.table(
    repairs.map((item) => ({
      targetId: item.targetId,
      aliases: item.aliases.join(" | "),
      duplicateProperties: item.duplicateProperties,
    }))
  );

  if (skipped.length) {
    console.log("\nSkipped:");
    console.table(skipped);
  }
}

main();
