import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { normalizeDriverApplication } from "../lib/drivers/driver-application";
import {
  TAXI_DRIVER_SHARE_BPS,
  TAXI_DRIVER_SIGNUP_FEE_CENTS,
  TAXI_PLATFORM_COMMISSION_BPS,
} from "../lib/taxi-economics";

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
expectSource(agentEventsApi, 'requireSession(["admin"])', "Agent event stream remains administrator-only");

const adminLayout = read("app/admin/layout.tsx");
expectSource(adminLayout, 'session.role !== "admin" && session.role !== "dispatcher"', "shared Admin parent remains available to operational dispatchers");

assert.equal(TAXI_DRIVER_SIGNUP_FEE_CENTS, 0);
assert.equal(TAXI_PLATFORM_COMMISSION_BPS, 1500);
assert.equal(TAXI_DRIVER_SHARE_BPS, 8500);

const normalized = normalizeDriverApplication(
  {
    displayName: "Alex Driver",
    phone: "340-555-0100",
    island: "stt",
    taxiCommissionBadgeNumber: "TC-1234",
    taxiCommissionBadgeExpiresAt: "2027-08-24",
    licenseClass: "D",
    licenseExpiresAt: "2027-08-24",
    taxiPlate: "TXI-101",
    vehicleDescription: "2025 Ford Transit white",
    associationName: "Island Taxi Association",
    consent: true,
  },
  new Date("2026-08-24T16:00:00Z"),
);
assert.equal(normalized.ok, true);

const intake = read("app/api/drivers/applications/route.ts");
expectSource(intake, "requireSession()", "driver applications require authentication");
expectSource(intake, 'session.role !== "rider"', "only rider accounts can self-apply");
expectSource(intake, 'status: "pending"', "self-service applications start pending");
expectSource(intake, 'collection("driverApplicationAudit")', "driver applications create an auditable intake event");
expectSource(intake, 'href: "/admin/driver-applications"', "new driver applications alert operations to the review queue");
if (intake.includes("setCustomUserClaims")) throw new Error("Driver intake must never grant privileged claims.");

const driverApproval = read("app/api/admin/driver-applications/[applicationId]/route.ts");
expectSource(driverApproval, 'requireSession(["admin"])', "driver approval remains administrator-only");
expectSource(driverApproval, "setCustomUserClaims", "driver role is granted only inside trusted admin approval");
expectSource(driverApproval, 'role: "driver"', "approved account receives driver role");
expectSource(driverApproval, 'association.status !== "active"', "approval requires an active taxi association");
expectSource(driverApproval, 'vehicle.inspectionStatus !== "active"', "approval requires active vehicle inspection");
expectSource(driverApproval, 'vehicle.insuranceStatus !== "active"', "approval requires active vehicle insurance");
expectSource(driverApproval, 'collection("driverApplicationAudit")', "driver review decisions are audited");

const driverReviewPage = read("app/admin/driver-applications/page.tsx");
expectSource(driverReviewPage, 'session.role !== "admin"', "driver application review page remains administrator-only");
expectSource(driverReviewPage, 'redirect("/unauthorized")', "driver application review rejects non-admin roles");

const driverReviewList = read("app/api/admin/driver-applications/route.ts");
expectSource(driverReviewList, 'requireSession(["admin"])', "driver application review list remains administrator-only");
expectSource(driverReviewList, 'association.status === "active"', "review queue exposes only active association choices");
expectSource(driverReviewList, "dispatchReady", "review queue identifies dispatch-ready fleet choices");

const adminHome = read("app/admin/page.tsx");
expectSource(adminHome, 'href: "/admin/driver-applications"', "administrator dashboard links to driver application review");

const driverApplicationForm = read("components/driver-application-form.tsx");
expectSource(driverApplicationForm, "Apply free. Keep 85% of each eligible ride.", "free signup and driver share are explicit");
expectSource(driverApplicationForm, "fixed 15% platform commission", "fixed commission is explicit");
expectSource(driverApplicationForm, "Applying does not authorize taxi operation.", "application never implies operating authorization");

console.log("USVI Explorer administrator-only console boundary contracts passed.");
