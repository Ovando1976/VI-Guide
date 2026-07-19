import {
  moduleCount,
  totalLines,
} from "./graph";

import type {
  ModuleGraph,
  ValidationIssue,
} from "./types";

export interface CliOptions {
  check: boolean;
  json: boolean;
  verbose: boolean;
}

export function parseArgs(): CliOptions {
  const args = process.argv.slice(2);

  return {
    check: args.includes("--check"),
    json: args.includes("--json"),
    verbose: args.includes("--verbose"),
  };
}

export function printSummary(
  graph: ModuleGraph,
  issues: ValidationIssue[],
): void {
  const modules = moduleCount(graph);

  const lines = totalLines(graph);

  const edges = [...graph.modules.values()].reduce(
    (sum, module) => sum + module.imports.length,
    0,
  );

  const warnings = issues.filter(
    (i) => i.level === "warning",
  );

  const errors = issues.filter(
    (i) => i.level === "error",
  );

  console.log("");
  console.log("Architecture Inspector");
  console.log("======================");
  console.log("");

  console.log(
    `Modules ............. ${modules}`,
  );

  console.log(
    `Dependency Edges .... ${edges}`,
  );

  console.log(
    `Lines ............... ${lines.toLocaleString()}`,
  );

  console.log(
    `Warnings ............ ${warnings.length}`,
  );

  console.log(
    `Errors .............. ${errors.length}`,
  );

  console.log("");

  if (errors.length === 0) {
    console.log("Architecture Violations");
    console.log("-----------------------");
    console.log("✓ None");
    console.log("");
  }

  printGroup(
    "Architecture Violations",
    errors,
  );

  printGroup(
    "Maintainability",
    warnings.filter(
      (i) =>
        i.rule === "large-module" ||
        i.rule === "architectural-hub" ||
        i.rule === "empty-module",
    ),
  );

  printGroup(
    "Dead Code",
    warnings.filter(
      (i) => i.rule === "orphan-module",
    ),
  );

  printGroup(
    "Other Findings",
    warnings.filter(
      (i) =>
        ![
          "large-module",
          "architectural-hub",
          "empty-module",
          "orphan-module",
        ].includes(i.rule),
    ),
  );
}

function printGroup(
  title: string,
  issues: ValidationIssue[],
): void {
  if (issues.length === 0) {
    return;
  }

  console.log(title);
  console.log("-".repeat(title.length));

  const grouped = new Map<
    string,
    ValidationIssue[]
  >();

  for (const issue of issues) {
    if (!grouped.has(issue.rule)) {
      grouped.set(issue.rule, []);
    }

    grouped.get(issue.rule)!.push(issue);
  }

  for (const [rule, entries] of grouped) {
    console.log("");
    console.log(
      `${prettify(rule)} (${entries.length})`,
    );

    for (const issue of entries) {
      console.log(`  • ${issue.message}`);
    }
  }

  console.log("");
}

function prettify(rule: string): string {
  return rule
    .split("-")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}