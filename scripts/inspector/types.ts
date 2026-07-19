export type ModuleRole =
  | "app"
  | "ui"
  | "domain"
  | "shared"
  | "infrastructure"
  | "tooling"
  | "unknown";

export type ModuleHealth = "good" | "warning" | "error";

export interface ModuleInfo {
  /**
   * Repository-relative path.
   * Example: lib/accommodations/loader.ts
   */
  path: string;

  /**
   * Absolute path on disk.
   */
  absolutePath: string;

  /**
   * Number of source lines.
   */
  lines: number;

  /**
   * Relative imports resolved to repository paths.
   */
  imports: string[];

  /**
   * Reverse dependency edges.
   */
  importedBy: string[];

  /**
   * Architectural role.
   */
  role: ModuleRole;

  /**
   * Overall module health.
   */
  health: ModuleHealth;

  /**
   * Human-readable findings.
   */
  notes: string[];
}

export interface ModuleGraph {
  modules: Map<string, ModuleInfo>;
}

export interface InventorySummary {
  moduleCount: number;
  totalLines: number;
}

export interface ValidationIssue {
  rule: string;
  level: "warning" | "error";
  module?: string;
  message: string;
}

export interface InspectionResult {
  graph: ModuleGraph;
  issues: ValidationIssue[];
  summary: InventorySummary;
}
