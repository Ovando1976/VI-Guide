import type { ModuleGraph, ModuleInfo } from "./types";

export function createGraph(modules: ModuleInfo[]): ModuleGraph {
  return {
    modules: new Map(modules.map((m) => [m.path, m])),
  };
}

export function allModules(graph: ModuleGraph): ModuleInfo[] {
  return [...graph.modules.values()];
}

export function moduleCount(graph: ModuleGraph): number {
  return graph.modules.size;
}

export function totalLines(graph: ModuleGraph): number {
  let total = 0;

  for (const module of graph.modules.values()) {
    total += module.lines;
  }

  return total;
}

export function mostImported(graph: ModuleGraph, limit = 10): ModuleInfo[] {
  return allModules(graph)
    .sort((a, b) => b.importedBy.length - a.importedBy.length)
    .slice(0, limit);
}

export function largestModules(graph: ModuleGraph, limit = 10): ModuleInfo[] {
  return allModules(graph)
    .sort((a, b) => b.lines - a.lines)
    .slice(0, limit);
}
