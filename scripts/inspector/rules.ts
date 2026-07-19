import type { ModuleRole } from "./types";

export interface RoleRule {
  prefix: string;
  role: ModuleRole;
}

export const ROLE_RULES: RoleRule[] = [
  { prefix: "app/", role: "app" },

  { prefix: "components/", role: "ui" },

  { prefix: "hooks/", role: "shared" },

  { prefix: "lib/accommodations/", role: "domain" },
  { prefix: "lib/beaches/", role: "domain" },
  { prefix: "lib/historic-sites/", role: "domain" },
  { prefix: "lib/territory/", role: "domain" },
  { prefix: "lib/directory-data/", role: "shared" },
  { prefix: "lib/data-utils/", role: "shared" },

  { prefix: "scripts/", role: "tooling" },
];

export function determineRole(path: string): ModuleRole {
  for (const rule of ROLE_RULES) {
    if (path.startsWith(rule.prefix)) {
      return rule.role;
    }
  }

  return "unknown";
}

export const LAYER_RULES = {
  domain: ["domain", "shared"],
  shared: ["shared"],
  ui: ["domain", "shared", "ui"],
  app: ["app", "ui", "domain", "shared"],
  tooling: ["tooling"],
};
