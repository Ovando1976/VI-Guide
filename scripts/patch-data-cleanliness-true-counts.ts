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

const TARGET_FILE = path.join(ROOT, "scripts/audit-data-cleanliness.ts");
const BACKUP_DIR = path.join(ROOT, "reports/backups");
const REPORT_FILE = path.join(ROOT, "reports/patched-data-cleanliness-true-counts.json");

function findMatchingBrace(text: string, openIndex: number) {
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
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) quote = "";
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

    if (ch === "{") depth += 1;

    if (ch === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }

  return -1;
}

function replaceFunction(text: string, functionName: string, replacement: string) {
  const marker = `function ${functionName}(`;
  const start = text.indexOf(marker);

  if (start < 0) {
    throw new Error(`Could not find function ${functionName}`);
  }

  const openBrace = text.indexOf("{", start);

  if (openBrace < 0) {
    throw new Error(`Could not find opening brace for function ${functionName}`);
  }

  const closeBrace = findMatchingBrace(text, openBrace);

  if (closeBrace < 0) {
    throw new Error(`Could not find closing brace for function ${functionName}`);
  }

  return text.slice(0, start) + replacement.trimEnd() + text.slice(closeBrace + 1);
}

function main() {
  if (!existsSync(TARGET_FILE)) {
    throw new Error(`Missing file: ${TARGET_FILE}`);
  }

  mkdirSync(BACKUP_DIR, { recursive: true });

  const backupFile = path.join(
    BACKUP_DIR,
    `audit-data-cleanliness.true-counts.${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.ts`
  );

  let text = readFileSync(TARGET_FILE, "utf8");
  copyFileSync(TARGET_FILE, backupFile);

  const addIssueFactoryReplacement = `
function addIssueFactory() {
  const issues: Issue[] = [];

  const counts = new Map<
    string,
    {
      severity: Severity;
      source: string;
      issue: string;
      count: number;
      sampled: number;
    }
  >();

  function add(issue: Issue) {
    const key = issueKeyParts(issue);
    const existing = counts.get(key);

    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, {
        severity: issue.severity,
        source: issue.source,
        issue: issue.issue,
        count: 1,
        sampled: 0,
      });
    }

    const row = counts.get(key);

    if (row && row.sampled < ISSUE_SAMPLE_LIMIT_PER_KIND) {
      issues.push(issue);
      row.sampled += 1;
    }
  }

  return {
    issues,
    counts,
    add,
  };
}
`;

  text = replaceFunction(text, "addIssueFactory", addIssueFactoryReplacement);

  const startMarker = `  const severityTotals = {
    high: 0,
    medium: 0,
    low: 0,
  };`;

  const endMarker = "  const totalRecords = sources.reduce";

  const start = text.indexOf(startMarker);

  if (start < 0) {
    throw new Error("Could not find severityTotals block.");
  }

  const end = text.indexOf(endMarker, start);

  if (end < 0) {
    throw new Error("Could not find totalRecords marker after severityTotals block.");
  }

  const trueCountsBlock = `
  const issueGroups = [...counts.values()]
    .map((row) => ({
      severity: row.severity,
      source: row.source,
      issue: row.issue,
      count: row.count,
      sampled: row.sampled,
      sampleLimit: ISSUE_SAMPLE_LIMIT_PER_KIND,
    }))
    .sort((a, b) => {
      const severityDiff = severityRank(b.severity) - severityRank(a.severity);
      if (severityDiff !== 0) return severityDiff;
      return b.count - a.count;
    });

  const severityTotals = {
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const row of issueGroups) {
    severityTotals[row.severity] += row.count;
  }

`;

  text = text.slice(0, start) + trueCountsBlock + text.slice(end);

  const reportTotalsMarker = `    totals: {
      publicImages: publicImages.length,
    },`;

  const reportTotalsReplacement = `    totals: {
      publicImages: publicImages.length,
      issuesActual: severityTotals.high + severityTotals.medium + severityTotals.low,
      issuesSampled: issues.length,
      issueSampleLimitPerKind: ISSUE_SAMPLE_LIMIT_PER_KIND,
    },`;

  if (!text.includes(reportTotalsMarker)) {
    throw new Error("Could not find report totals block.");
  }

  text = text.replace(reportTotalsMarker, reportTotalsReplacement);

  writeFileSync(TARGET_FILE, text);

  writeFileSync(
    REPORT_FILE,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        updatedFile: path.relative(ROOT, TARGET_FILE),
        backupFile: path.relative(ROOT, backupFile),
        changes: [
          "addIssueFactory now tracks actual counts and sampled counts separately",
          "severityTotals now uses actual counts from counts map",
          "issueGroups now uses actual counts from counts map",
          "report totals now includes issuesActual, issuesSampled, and issueSampleLimitPerKind",
        ],
      },
      null,
      2
    )
  );

  console.log("Data cleanliness audit true-count patch applied.");
  console.log(`Updated file: ${path.relative(ROOT, TARGET_FILE)}`);
  console.log(`Backup: ${path.relative(ROOT, backupFile)}`);
  console.log(`Report: ${path.relative(ROOT, REPORT_FILE)}`);
}

main();
