import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function expectSource(source: string, value: string, label: string) {
  if (!source.includes(value)) {
    throw new Error(`Admin console role boundary contract failed: ${label}`);
  }
}

const tariffLayout = read("app/admin/tariffs/layout.tsx");
const pilotLayout = read("app/admin/pilot-readiness/layout.tsx");
const agentsLayout = read("app/admin/agents/layout.tsx");

for (const [source, nextPath, label] of [
  [tariffLayout, "/admin/tariffs", "Taxi Tariffs"],
  [pilotLayout, "/admin/pilot-readiness", "Mobility Pilot Readiness"],
  [agentsLayout, "/admin/agents", "Agent Control Center"],
] as const) {
  expectSource(source, "getSession", `${label} verifies the application session`);
  expectSource(source, `redirect(\"/login?next=${nextPath}\")`, `${label} preserves authenticated return routing`);
  expectSource(source, 'session.role !== "admin"', `${label} is administrator-only at the page boundary`);
  expectSource(source, 'redirect("/unauthorized")', `${label} rejects non-admin authenticated roles`);
}

const tariffApi = read("app/api/admin/taxi-tariffs/route.ts");
const tariffActivate = read("app/api/admin/taxi-tariffs/[tariffId]/activate/route.ts");
const tariffRetire = read("app/api/admin/taxi-tariffs/[tariffId]/retire/route.ts");
for (const [source, label] of [
  [tariffApi, "Taxi Tariff list/create API"],
  [tariffActivate, "Taxi Tariff activation API"],
  [tariffRetire, "Taxi Tariff retirement API"],
] as const) {
  expectSource(source, 'requireSession(["admin"])', `${label} remains administrator-only`);
}

const pilotApi = read("app/api/admin/mobility-pilot/route.ts");
const pilotActivate = read("app/api/admin/mobility-pilot/[island]/activate/route.ts");
const pilotDeactivate = read("app/api/admin/mobility-pilot/[island]/deactivate/route.ts");
for (const [source, label] of [
  [pilotApi, "Mobility Pilot readiness API"],
  [pilotActivate, "Mobility Pilot activation API"],
  [pilotDeactivate, "Mobility Pilot deactivation API"],
] as const) {
  expectSource(source, 'requireSession(["admin"])', `${label} remains administrator-only`);
}

const agentEventsApi = read("app/api/admin/agents/events/route.ts");
expectSource(
  agentEventsApi,
  'requireSession(["admin"])',
  "Agent event stream remains administrator-only",
);

const adminLayout = read("app/admin/layout.tsx");
expectSource(
  adminLayout,
  'session.role !== "admin" && session.role !== "dispatcher"',
  "shared Admin parent remains available to operational dispatchers",
);

console.log("USVI Explorer administrator-only console boundary contracts passed.");
