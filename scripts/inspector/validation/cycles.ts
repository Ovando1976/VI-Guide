import { allModules } from "../graph";
import type { ModuleGraph, ModuleInfo, ValidationIssue } from "../types";

export function findCycles(graph: ModuleGraph): ValidationIssue[] {
  const visited = new Set<string>();
  const active = new Set<string>();

  const issues: ValidationIssue[] = [];

  for (const module of allModules(graph)) {
    walk(module, graph, visited, active, [], issues);
  }

  return deduplicate(issues);
}

function walk(
  module: ModuleInfo,
  graph: ModuleGraph,
  visited: Set<string>,
  active: Set<string>,
  stack: string[],
  issues: ValidationIssue[]
): void {
  if (active.has(module.path)) {
    const start = stack.indexOf(module.path);

    const cycle = [...stack.slice(start), module.path];

    issues.push({
      rule: "cycles",
      level: "error",
      module: module.path,
      message: cycle.join(" → "),
    });

    return;
  }

  if (visited.has(module.path)) {
    return;
  }

  visited.add(module.path);
  active.add(module.path);
  stack.push(module.path);

  for (const dependency of module.imports) {
    const next = graph.modules.get(dependency);

    if (next) {
      walk(next, graph, visited, active, stack, issues);
    }
  }

  stack.pop();
  active.delete(module.path);
}

function deduplicate(issues: ValidationIssue[]): ValidationIssue[] {
  const seen = new Set<string>();

  return issues.filter((issue) => {
    if (seen.has(issue.message)) {
      return false;
    }

    seen.add(issue.message);
    return true;
  });
}
