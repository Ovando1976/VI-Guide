// @ts-nocheck

import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const INDEX_FILE = path.join(ROOT, "src/data/core/geographicIndex.ts");
const BACKUP_DIR = path.join(ROOT, "reports/backups");
const REPORT_FILE = path.join(
  ROOT,
  "reports/repaired-all-geographic-index-duplicate-aliases.json"
);

type ObjSpan = {
  start: number;
  end: number;
};

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

function findMatchingBracket(text: string, openIndex: number) {
  let depth = 0;
  let quote = "";
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = openIndex; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (lineComment) {
      if (ch === "\n") lineComment = false;
      continue;
    }

    if (blockComment) {
      if (ch === "*" && next === "/") {
        blockComment = false;
        i += 1;
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
      i += 1;
      continue;
    }

    if (ch === "/" && next === "*") {
      blockComment = true;
      i += 1;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }

    if (ch === "[") depth += 1;

    if (ch === "]") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }

  return -1;
}

function findTopLevelObjectSpans(text: string, arrayStart: number, arrayEnd: number): ObjSpan[] {
  const spans: ObjSpan[] = [];

  let quote = "";
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  let objectDepth = 0;
  let bracketDepth = 0;
  let objectStart = -1;

  for (let i = arrayStart + 1; i < arrayEnd; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (lineComment) {
      if (ch === "\n") lineComment = false;
      continue;
    }

    if (blockComment) {
      if (ch === "*" && next === "/") {
        blockComment = false;
        i += 1;
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
      i += 1;
      continue;
    }

    if (ch === "/" && next === "*") {
      blockComment = true;
      i += 1;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }

    if (ch === "[") {
      bracketDepth += 1;
      continue;
    }

    if (ch === "]") {
      bracketDepth -= 1;
      continue;
    }

    if (ch === "{") {
      if (objectDepth === 0 && bracketDepth === 0) objectStart = i;
      objectDepth += 1;
      continue;
    }

    if (ch === "}") {
      objectDepth -= 1;

      if (objectDepth === 0 && bracketDepth === 0 && objectStart >= 0) {
        spans.push({ start: objectStart, end: i + 1 });
        objectStart = -1;
      }
    }
  }

  return spans;
}

function bracketPositionsOutsideStrings(text: string): number[] {
  const positions: number[] = [];

  let quote = "";
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (lineComment) {
      if (ch === "\n") lineComment = false;
      continue;
    }

    if (blockComment) {
      if (ch === "*" && next === "/") {
        blockComment = false;
        i += 1;
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
      i += 1;
      continue;
    }

    if (ch === "/" && next === "*") {
      blockComment = true;
      i += 1;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }

    if (ch === "[") positions.push(i);
  }

  return positions;
}

function findLargestObjectArray(text: string) {
  let best = {
    start: -1,
    end: -1,
    spans: [] as ObjSpan[],
  };

  for (const start of bracketPositionsOutsideStrings(text)) {
    const end = findMatchingBracket(text, start);
    if (end < 0) continue;

    const spans = findTopLevelObjectSpans(text, start, end);

    if (spans.length > best.spans.length) {
      best = { start, end, spans };
    }
  }

  if (!best.spans.length) {
    throw new Error("Could not find object array in geographicIndex.ts");
  }

  return best;
}

function extractStringValues(value: string) {
  const matches = value.match(/"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'/g) || [];
  const out = [];

  for (const raw of matches) {
    try {
      if (raw.startsWith('"')) out.push(JSON.parse(raw));
      else out.push(raw.slice(1, -1));
    } catch {
      out.push(raw.slice(1, -1));
    }
  }

  return out.filter(Boolean);
}

function getRecordName(objectText: string) {
  const match = objectText.match(/["']name["']\s*:\s*("([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)')/);
  if (!match) return "";

  try {
    if (match[1].startsWith('"')) return JSON.parse(match[1]);
    return match[1].slice(1, -1);
  } catch {
    return match[1].slice(1, -1);
  }
}

function getRecordId(objectText: string) {
  const match = objectText.match(/["']id["']\s*:\s*("([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)')/);
  if (!match) return "";

  try {
    if (match[1].startsWith('"')) return JSON.parse(match[1]);
    return match[1].slice(1, -1);
  } catch {
    return match[1].slice(1, -1);
  }
}

function repairObjectAliases(objectText: string) {
  const aliasRegex = /(^[ \t]*["']aliases["']\s*:\s*$begin:math:display$\[\\s\\S\]\*\?$end:math:display$\s*,?\n?)/gm;
  const matches = [...objectText.matchAll(aliasRegex)];

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
    for (const alias of extractStringValues(match[0])) {
      if (!aliases.some((existing) => normalize(existing) === normalize(alias))) {
        aliases.push(alias);
      }
    }
  }

  const firstMatch = matches[0];
  const indent = firstMatch[0].match(/^[ \t]*/)?.[0] || "    ";
  const mergedLine = `${indent}"aliases": ${JSON.stringify(aliases)},\n`;

  let repaired = objectText;

  for (let i = matches.length - 1; i >= 0; i -= 1) {
    const match = matches[i];
    const start = match.index || 0;
    const end = start + match[0].length;

    if (i === 0) {
      repaired = repaired.slice(0, start) + mergedLine + repaired.slice(end);
    } else {
      repaired = repaired.slice(0, start) + repaired.slice(end);
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
  mkdirSync(BACKUP_DIR, { recursive: true });

  const text = readFileSync(INDEX_FILE, "utf8");
  const array = findLargestObjectArray(text);
  const spans = array.spans;

  const backupFile = path.join(
    BACKUP_DIR,
    `geographicIndex.all-duplicate-alias-repair.${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.ts`
  );

  copyFileSync(INDEX_FILE, backupFile);

  const repairedRecords = [];
  const replacements = [];

  for (const span of spans) {
    const before = text.slice(span.start, span.end);
    const repaired = repairObjectAliases(before);

    if (!repaired.changed) continue;

    repairedRecords.push({
      id: getRecordId(before),
      name: getRecordName(before),
      aliases: repaired.aliases,
      duplicateProperties: repaired.duplicateProperties,
    });

    replacements.push({
      start: span.start,
      end: span.end,
      replacement: repaired.objectText,
    });
  }

  replacements.sort((a, b) => b.start - a.start);

  let nextText = text;

  for (const replacement of replacements) {
    nextText =
      nextText.slice(0, replacement.start) +
      replacement.replacement +
      nextText.slice(replacement.end);
  }

  writeFileSync(INDEX_FILE, nextText);

  writeFileSync(
    REPORT_FILE,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        updatedFile: path.relative(ROOT, INDEX_FILE),
        backupFile: path.relative(ROOT, backupFile),
        objectCount: spans.length,
        repaired: repairedRecords.length,
        repairedRecords,
      },
      null,
      2
    )
  );

  console.log("All duplicate alias properties repaired.");
  console.log(`Object count: ${spans.length}`);
  console.log(`Repaired: ${repairedRecords.length}`);
  console.log(`Backup: ${path.relative(ROOT, backupFile)}`);
  console.log(`Report: ${path.relative(ROOT, REPORT_FILE)}`);

  console.table(
    repairedRecords.map((record) => ({
      id: record.id,
      name: record.name,
      aliases: record.aliases.join(" | "),
      duplicateProperties: record.duplicateProperties,
    }))
  );
}

main();
