import { allModules } from "./graph";
import { determineRole } from "./rules";
import type { ModuleGraph, ModuleInfo } from "./types";

const LARGE_MODULE = 500;
const HUGE_MODULE = 1000;

const MANY_IMPORTS = 20;
const MANY_DEPENDENTS = 15;

export function classify(graph: ModuleGraph): void {
  for (const module of allModules(graph)) {
    module.role = determineRole(module.path);
    module.health = "good";
    module.notes = [];

    classifySize(module);
    classifyCoupling(module);
    classifyUsage(module);
  }
}

function classifySize(module: ModuleInfo): void {
  if (module.lines >= HUGE_MODULE) {
    warn(module, `Very large module (${module.lines.toLocaleString()} lines).`);
    return;
  }

  if (module.lines >= LARGE_MODULE) {
    note(module, `Large module (${module.lines.toLocaleString()} lines).`);
  }
}

function classifyCoupling(module: ModuleInfo): void {
  if (module.imports.length >= MANY_IMPORTS) {
    warn(module, `${module.imports.length} direct imports.`);
  }

  if (module.importedBy.length >= MANY_DEPENDENTS) {
    note(module, `Architectural hub (${module.importedBy.length} dependents).`);
  }
}

function classifyUsage(module: ModuleInfo): void {
  if (module.lines === 0) {
    warn(module, "Empty module.");
  }

  if (module.imports.length === 0 && module.importedBy.length === 0) {
    note(module, "Orphan module.");
  }
}

function note(module: ModuleInfo, message: string): void {
  module.notes.push(message);
}

function warn(module: ModuleInfo, message: string): void {
  module.health = "warning";
  module.notes.push(message);
}
