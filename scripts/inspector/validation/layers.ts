import { allModules } from "../graph";
import type {
  ModuleGraph,
  ValidationIssue,
} from "../types";

export function validateLayers(
  graph: ModuleGraph,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const module of allModules(graph)) {
    for (const dependency of module.imports) {
      const target = graph.modules.get(dependency);

      if (!target) continue;

      if (
        module.role === "domain" &&
        target.role === "ui"
      ) {
        issues.push({
          rule: "layer",
          level: "error",
          module: module.path,
          message: `Domain imports UI (${target.path}).`,
        });
      }

      if (
        module.role === "shared" &&
        target.role === "app"
      ) {
        issues.push({
          rule: "layer",
          level: "error",
          module: module.path,
          message: `Shared imports App (${target.path}).`,
        });
      }
    }
  }

  return issues;
}