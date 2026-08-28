import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const APP_DIR = path.join(process.cwd(), "app");
const ENTRY_NAMES = new Set(["page.tsx", "layout.tsx", "default.tsx", "route.ts"]);

type Finding = {
  file: string;
  line: number;
  kind: "params" | "searchParams" | "cookies" | "headers" | "draftMode";
  source: string;
};

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(full);
      return ENTRY_NAMES.has(entry.name) ? [full] : [];
    }),
  );
  return nested.flat();
}

function hasPromiseTypeNearby(lines: string[], index: number, key: string) {
  const start = Math.max(0, index - 4);
  const end = Math.min(lines.length, index + 7);
  const window = lines.slice(start, end).join("\n");
  const keyIndex = window.indexOf(key);
  if (keyIndex < 0) return false;
  const nearby = window.slice(keyIndex, keyIndex + 220);
  return /Promise\s*</.test(nearby);
}

function usesAwaitNearby(lines: string[], index: number, api: string) {
  const start = Math.max(0, index - 2);
  const end = Math.min(lines.length, index + 3);
  const window = lines.slice(start, end).join(" ");
  return new RegExp(`await\\s+${api}\\s*\\(`).test(window);
}

async function main() {
  const files = await walk(APP_DIR);
  const findings: Finding[] = [];

  for (const file of files.sort()) {
    const text = await readFile(file, "utf8");
    const lines = text.split(/\r?\n/);
    const relative = path.relative(process.cwd(), file).replaceAll(path.sep, "/");

    lines.forEach((line, index) => {
      if (/\bsearchParams\s*[?:]/.test(line) && !hasPromiseTypeNearby(lines, index, "searchParams")) {
        findings.push({
          file: relative,
          line: index + 1,
          kind: "searchParams",
          source: line.trim(),
        });
      }

      if (/\bparams\s*[?:]/.test(line) && !hasPromiseTypeNearby(lines, index, "params")) {
        findings.push({
          file: relative,
          line: index + 1,
          kind: "params",
          source: line.trim(),
        });
      }

      for (const api of ["cookies", "headers", "draftMode"] as const) {
        if (new RegExp(`\\b${api}\\s*\\(`).test(line) && !usesAwaitNearby(lines, index, api)) {
          findings.push({
            file: relative,
            line: index + 1,
            kind: api,
            source: line.trim(),
          });
        }
      }
    });
  }

  const unique = findings.filter(
    (finding, index) =>
      findings.findIndex(
        (candidate) =>
          candidate.file === finding.file &&
          candidate.line === finding.line &&
          candidate.kind === finding.kind,
      ) === index,
  );

  if (!unique.length) {
    console.log("Next 15 async request API audit: passed");
    return;
  }

  console.error("NEXT15_ASYNC_API_AUDIT_START");
  for (const finding of unique) {
    console.error(
      `${finding.file}:${finding.line} [${finding.kind}] ${finding.source}`,
    );
  }
  console.error("NEXT15_ASYNC_API_AUDIT_END");
  process.exitCode = 1;
}

void main();
