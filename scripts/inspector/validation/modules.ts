import { allModules } from "../graph";
import type { ModuleGraph, ValidationIssue } from "../types";

export function findEmptyModules(graph: ModuleGraph): ValidationIssue[] {
  return allModules(graph)
    .filter((m) => m.lines === 0)
    .map((m) => ({
      rule: "empty-module",
      level: "warning",
      module: m.path,
      message: `${m.path} is empty.`,
    }));
}

export function findOrphans(graph: ModuleGraph): ValidationIssue[] {
  return allModules(graph)
    .filter(
      (m) =>
        !shouldIgnoreOrphan(m.path) &&
        m.imports.length === 0 &&
        m.importedBy.length === 0
    )
    .map((m) => ({
      rule: "orphan-module",
      level: "warning",
      module: m.path,
      message: `${m.path} has no imports and no dependents.`,
    }));
}

export function findLargeModules(graph: ModuleGraph): ValidationIssue[] {
  return allModules(graph)
    .filter((m) => m.lines >= 500)
    .map((m) => ({
      rule: "large-module",
      level: "warning",
      module: m.path,
      message: `${m.path} contains ${m.lines.toLocaleString()} source lines.`,
    }));
}

export function findArchitecturalHubs(graph: ModuleGraph): ValidationIssue[] {
  return allModules(graph)
    .filter((m) => m.importedBy.length >= 15)
    .map((m) => ({
      rule: "architectural-hub",
      level: "warning",
      module: m.path,
      message: `${m.path} is referenced by ${m.importedBy.length} modules.`,
    }));
}

function shouldIgnoreOrphan(path: string): boolean {
  return (
    path.startsWith("app/") ||
    path.startsWith("scripts/") ||
    path.startsWith("reports/") ||
    path.endsWith(".test.ts") ||
    path.endsWith(".test.tsx") ||
    path.endsWith(".spec.ts") ||
    path.endsWith(".spec.tsx") ||
    path.endsWith(".stories.tsx") ||
    path.endsWith("/page.tsx") ||
    path.endsWith("/layout.tsx") ||
    path.endsWith("/loading.tsx") ||
    path.endsWith("/error.tsx") ||
    path.endsWith("/not-found.tsx") ||
    path.endsWith("/route.ts")
  );
}
