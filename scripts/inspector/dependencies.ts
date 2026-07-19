import { promises as fs } from "node:fs";
import path from "node:path";

import type { ModuleGraph, ModuleInfo } from "./types";

const IMPORT_PATTERNS = [
  /^\s*import\s+(?:type\s+)?[\s\S]*?\sfrom\s+["'](.+?)["']/gm,
  /^\s*export\s+[\s\S]*?\sfrom\s+["'](.+?)["']/gm,
  /^\s*import\s+["'](.+?)["']/gm,
];

export async function buildDependencies(graph: ModuleGraph): Promise<void> {
  clearEdges(graph);

  for (const module of graph.modules.values()) {
    const source = await fs.readFile(module.absolutePath, "utf8");

    module.imports = extractImports(graph, module, source);
  }

  buildReverseEdges(graph);
}

function extractImports(
  graph: ModuleGraph,
  module: ModuleInfo,
  source: string
): string[] {
  const imports = new Set<string>();

  for (const pattern of IMPORT_PATTERNS) {
    pattern.lastIndex = 0;

    let match: RegExpExecArray | null;

    while ((match = pattern.exec(source)) !== null) {
      const resolved = resolveSpecifier(graph, module, match[1]);

      if (resolved) {
        imports.add(resolved);
      }
    }
  }

  return [...imports].sort();
}

function resolveSpecifier(
  graph: ModuleGraph,
  module: ModuleInfo,
  specifier: string
): string | null {
  if (specifier.startsWith("@/")) {
    return resolveProjectPath(graph, specifier.slice(2));
  }

  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    const base = path.posix.dirname(module.path);

    return resolveProjectPath(graph, path.posix.join(base, specifier));
  }

  return null;
}

function resolveProjectPath(
  graph: ModuleGraph,
  candidate: string
): string | null {
  candidate = normalize(candidate);

  for (const file of candidatePaths(candidate)) {
    if (graph.modules.has(file)) {
      return file;
    }
  }

  return null;
}

function candidatePaths(candidate: string): string[] {
  return [
    candidate,
    `${candidate}.ts`,
    `${candidate}.tsx`,
    `${candidate}/index.ts`,
    `${candidate}/index.tsx`,
  ];
}

function buildReverseEdges(graph: ModuleGraph): void {
  for (const module of graph.modules.values()) {
    for (const dependency of module.imports) {
      const target = graph.modules.get(dependency);

      if (target) {
        target.importedBy.push(module.path);
      }
    }
  }

  for (const module of graph.modules.values()) {
    module.importedBy.sort();
  }
}

function clearEdges(graph: ModuleGraph): void {
  for (const module of graph.modules.values()) {
    module.imports = [];
    module.importedBy = [];
  }
}

function normalize(file: string): string {
  return file.replaceAll("\\", "/");
}
