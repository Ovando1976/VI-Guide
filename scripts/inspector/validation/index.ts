import type { ModuleGraph, ValidationIssue } from "../types";

import { findCycles } from "./cycles";
import { validateLayers } from "./layers";
import {
  findEmptyModules,
  findOrphans,
  findLargeModules,
  findArchitecturalHubs,
} from "./modules";

export function validate(graph: ModuleGraph): ValidationIssue[] {
  return [
    ...findCycles(graph),
    ...validateLayers(graph),
    ...findEmptyModules(graph),
    ...findOrphans(graph),
    ...findLargeModules(graph),
    ...findArchitecturalHubs(graph),
  ];
}
