import { promises as fs } from "node:fs";
import path from "node:path";

import {
  allModules,
  largestModules,
  moduleCount,
  mostImported,
  totalLines,
} from "./graph";

import type {
  ModuleGraph,
  ValidationIssue,
} from "./types";

const OUTPUT_DIR = path.join(
  process.cwd(),
  "reports",
  "architecture",
);

export async function writeReports(
  graph: ModuleGraph,
  issues: ValidationIssue[],
): Promise<void> {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  await Promise.all([
    writeSummary(graph, issues),
    writeMetrics(graph),
    writeGraph(graph),
    writeInventoryJson(graph),
    writeInventoryMarkdown(graph),
    writeValidation(graph, issues),
  ]);
}

async function writeSummary(
  graph: ModuleGraph,
  issues: ValidationIssue[],
): Promise<void> {
  const edges = allModules(graph).reduce(
    (sum, module) => sum + module.imports.length,
    0,
  );

  const summary = {
    generated: new Date().toISOString(),
    modules: moduleCount(graph),
    dependencyEdges: edges,
    totalLines: totalLines(graph),
    warnings: issues.filter((i) => i.level === "warning").length,
    errors: issues.filter((i) => i.level === "error").length,
  };

  await writeJson("summary.json", summary);
}

async function writeMetrics(
  graph: ModuleGraph,
): Promise<void> {
  const modules = allModules(graph);

  const roleCounts = modules.reduce<Record<string, number>>(
    (acc, module) => {
      acc[module.role] ??= 0;
      acc[module.role]++;

      return acc;
    },
    {},
  );

  const metrics = {
    modules: moduleCount(graph),
    totalLines: totalLines(graph),
    averageLines:
      modules.length === 0
        ? 0
        : Math.round(totalLines(graph) / modules.length),
    largestModules: largestModules(graph).map((m) => ({
      path: m.path,
      lines: m.lines,
    })),
    architecturalHubs: mostImported(graph).map((m) => ({
      path: m.path,
      dependents: m.importedBy.length,
    })),
    roleCounts,
  };

  await writeJson("metrics.json", metrics);
}

async function writeGraph(
  graph: ModuleGraph,
): Promise<void> {
  const nodes = allModules(graph).map((m) => ({
    id: m.path,
    role: m.role,
    lines: m.lines,
  }));

  const edges = allModules(graph).flatMap((m) =>
    m.imports.map((target) => ({
      source: m.path,
      target,
    })),
  );

  await writeJson("graph.json", {
    nodes,
    edges,
  });
}

async function writeInventoryJson(
  graph: ModuleGraph,
): Promise<void> {
  const inventory = allModules(graph).map((m) => ({
    path: m.path,
    role: m.role,
    health: m.health,
    lines: m.lines,
    imports: m.imports,
    importedBy: m.importedBy,
    notes: m.notes,
  }));

  await writeJson(
    "inventory.json",
    inventory,
  );
}

async function writeInventoryMarkdown(
  graph: ModuleGraph,
): Promise<void> {
  const out: string[] = [];

  out.push("# Module Inventory");
  out.push("");

  for (const module of allModules(graph)) {
    out.push(`## ${module.path}`);
    out.push("");
    out.push(`- Role: ${module.role}`);
    out.push(`- Health: ${module.health}`);
    out.push(`- Lines: ${module.lines}`);
    out.push(`- Imports: ${module.imports.length}`);
    out.push(`- Imported By: ${module.importedBy.length}`);

    if (module.notes.length) {
      out.push("");
      out.push("Notes:");

      for (const note of module.notes) {
        out.push(`- ${note}`);
      }
    }

    out.push("");
  }

  await writeText(
    "inventory.md",
    out.join("\n"),
  );
}

async function writeValidation(
  graph: ModuleGraph,
  issues: ValidationIssue[],
): Promise<void> {
  const out: string[] = [];

  out.push("# Validation");
  out.push("");

  if (issues.length === 0) {
    out.push("No issues found.");
    out.push("");

    await writeText(
      "validation.md",
      out.join("\n"),
    );

    return;
  }

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
    out.push(`## ${rule}`);
    out.push("");

    for (const issue of entries) {
      out.push(`- ${issue.message}`);
    }

    out.push("");
  }

  await writeText(
    "validation.md",
    out.join("\n"),
  );
}

async function writeJson(
  file: string,
  value: unknown,
): Promise<void> {
  await fs.writeFile(
    path.join(OUTPUT_DIR, file),
    JSON.stringify(value, null, 2),
  );
}

async function writeText(
  file: string,
  contents: string,
): Promise<void> {
  await fs.writeFile(
    path.join(OUTPUT_DIR, file),
    contents,
  );
}