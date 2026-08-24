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
expectSource(intake, 'collection("driverApplicationAudit")', "driver intake creates an audit event");
expectSource(intake, 'kind: "driver_application"', "driver intake notifies operations");
expectSource(intake, 'href: "/admin/taxi-operations"', "driver intake notification links to the review queue");
if (intake.includes("setCustomUserClaims")) throw new Error("Driver intake must never grant privileged claims.");

const driverApplyPage = read("app/driver/apply/page.tsx");
expectSource(driverApplyPage, 'session.role !== "rider"', "non-rider privileged roles cannot use self-service driver intake");

const driverApproval = read("app/api/admin/driver-applications/[applicationId]/route.ts");
expectSource(driverApproval, 'requireSession(["admin"])', "driver approval remains administrator-only");
expectSource(driverApproval, "const driverId = applicationId;", "driver identity stays pinned to the applicant Firebase UID");
if (driverApproval.includes("body.driverId")) throw new Error("Driver approval must not accept an arbitrary driverId override.");
expectSource(driverApproval, 'currentRole !== "rider"', "driver approval refuses to overwrite another privileged role");
expectSource(driverApproval, 'association.status !== "active"', "driver approval requires an explicitly active association");
expectSource(driverApproval, "!islands.includes(island)", "driver association must cover the applicant island");
expectSource(driverApproval, "fleetPlate !== applicantPlate", "reviewed fleet plate must match the submitted taxi plate");
expectSource(driverApproval, "!vehicleIslands.includes(island)", "reviewed fleet vehicle must cover the applicant island");
expectSource(driverApproval, 'vehicle.inspectionStatus !== "active"', "approval requires active vehicle inspection");
expectSource(driverApproval, 'vehicle.insuranceStatus !== "active"', "approval requires active vehicle insurance");
expectSource(driverApproval, "revokeRefreshTokens", "driver approval invalidates stale sessions before role activation");
expectSource(driverApproval, "setCustomUserClaims", "driver role is granted only inside trusted admin approval");
expectSource(driverApproval, 'role: "driver"', "approved account receives driver role");
expectSource(driverApproval, 'collection("driverApplicationAudit")', "driver review decisions remain auditable");
expectSource(driverApproval, "driver claim rollback failed", "driver claims roll back if the audited Firestore write fails");

const driverApplicationQueue = read("app/api/admin/driver-applications/route.ts");
expectSource(driverApplicationQueue, 'requireSession(["admin"])', "driver application queue remains administrator-only");
expectSource(driverApplicationQueue, 'db.collection("driverApplications").get()', "review queue loads applications through server-side admin access");
expectSource(driverApplicationQueue, 'association.status === "active"', "review queue only offers active taxi associations");
expectSource(driverApplicationQueue, "dispatchReady", "review queue labels eligible fleet vehicles server-side");

const taxiOperationsPage = read("app/admin/taxi-operations/page.tsx");
expectSource(taxiOperationsPage, "DriverApplicationReviewBoard", "Taxi Operations exposes the driver application review queue");

const driverReviewBoard = read("components/driver-application-review-board.tsx");
expectSource(driverReviewBoard, 'fetch("/api/admin/driver-applications"', "review UI loads the protected admin queue");
expectSource(driverReviewBoard, 'review("approve")', "review UI exposes trusted approval");
expectSource(driverReviewBoard, 'review("request_changes")', "review UI can request applicant changes");
expectSource(driverReviewBoard, 'review("reject")', "review UI can reject an application");
expectSource(driverReviewBoard, "The driver must sign out and back in", "approval UI communicates custom-claim refresh requirement");

const driverApplicationForm = read("components/driver-application-form.tsx");
expectSource(driverApplicationForm, "Apply free. Keep 85% of each eligible ride.", "free signup and driver share are explicit");
expectSource(driverApplicationForm, "fixed 15% platform commission", "fixed commission is explicit");
expectSource(driverApplicationForm, "Applying does not authorize taxi operation.", "application never implies operating authorization");
expectSource(driverApplicationForm, "Sign out and sign back in once", "approved drivers are told how to refresh their role claim");

console.log("USVI Explorer administrator-only console boundary contracts passed.");
