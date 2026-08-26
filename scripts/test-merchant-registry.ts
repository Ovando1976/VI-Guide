import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { buildMerchantRegistryCatalog } from "../lib/partners/merchant-registry-catalog";
import {
  MERCHANT_ACQUISITION_STAGES,
  canAdvanceMerchantStage,
  merchantRegistryCanonicalKey,
  merchantRegistryDocumentId,
  normalizeMerchantAcquisitionStage,
  summarizeMerchantRegistry,
} from "../lib/partners/merchant-registry";

assert.deepEqual(MERCHANT_ACQUISITION_STAGES, [
  "discovered",
  "profile_created",
  "contacted",
  "claimed",
  "verified",
  "bookable",
  "revenue_active",
]);
assert.equal(normalizeMerchantAcquisitionStage("verified"), "verified");
assert.equal(normalizeMerchantAcquisitionStage("unknown"), null);
assert.equal(canAdvanceMerchantStage("profile_created", "contacted"), true);
assert.equal(canAdvanceMerchantStage("verified", "claimed"), false);
assert.equal(canAdvanceMerchantStage("revenue_active", "revenue_active"), true);

assert.equal(
  merchantRegistryCanonicalKey("stt", "  Coral World Ocean Park  "),
  "stt:coral-world-ocean-park",
);
assert.match(
  merchantRegistryDocumentId("stt", "Coral World Ocean Park"),
  /^merchant_[a-z0-9_-]+$/,
);

const catalog = buildMerchantRegistryCatalog();
assert.ok(catalog.length > 50, "Merchant registry should cover a meaningful USVI business universe.");
assert.equal(new Set(catalog.map((record) => record.id)).size, catalog.length);
assert.equal(new Set(catalog.map((record) => record.canonicalKey)).size, catalog.length);
assert.equal(catalog.every((record) => record.seedStage === "profile_created"), true);

const kinds = new Set(catalog.flatMap((record) => record.sourceKinds));
for (const requiredKind of [
  "accommodation",
  "restaurant",
  "experience_operator",
  "car_rental",
]) {
  assert.equal(kinds.has(requiredKind as never), true, `Missing catalog source ${requiredKind}`);
}

const coralWorld = catalog.find(
  (record) => record.canonicalKey === "stt:coral-world-ocean-park",
);
assert.ok(coralWorld, "Experience operators should be deduplicated into one merchant record.");
assert.ok(
  (coralWorld?.sourceRecordIds.length ?? 0) >= 2,
  "A multi-experience operator should retain multiple source records.",
);

const summary = summarizeMerchantRegistry(
  [
    { stage: "profile_created", status: "active" },
    {
      stage: "contacted",
      status: "active",
      assignedToEmail: "ops@example.com",
      nextFollowUpDate: "2026-08-26",
    },
    { stage: "verified", status: "paused" },
    { stage: "revenue_active", status: "closed" },
  ],
  new Date("2026-08-26T14:00:00Z"),
);
assert.equal(summary.total, 4);
assert.equal(summary.stages.profile_created, 1);
assert.equal(summary.stages.contacted, 1);
assert.equal(summary.stages.verified, 1);
assert.equal(summary.stages.revenue_active, 1);
assert.equal(summary.active, 2);
assert.equal(summary.paused, 1);
assert.equal(summary.closed, 1);
assert.equal(summary.dueToday, 1);

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const registryApi = source("app/api/admin/merchant-registry/route.ts");
const bootstrapApi = source("app/api/admin/merchant-registry/bootstrap/route.ts");
const registryPage = source("app/admin/merchant-registry/page.tsx");
const registryBoard = source("components/admin/merchant-registry-board.tsx");
const adminPage = source("app/admin/page.tsx");
const adminNav = source("components/admin-nav.tsx");

assert.match(registryApi, /requireSession\(\["admin", "dispatcher"\]\)/);
assert.match(registryApi, /session\.role !== "admin"/);
assert.match(registryApi, /collection\("merchantRegistryAudit"\)/);
assert.match(registryApi, /Merchant lifecycle stages can only move forward/);
assert.doesNotMatch(registryApi, /setCustomUserClaims/);
assert.match(bootstrapApi, /requireSession\(\["admin"\]\)/);
assert.match(bootstrapApi, /buildMerchantRegistryCatalog/);
assert.match(bootstrapApi, /claimStagesByListingId/);
assert.match(bootstrapApi, /catalog_bootstrap/);
assert.match(registryPage, /\["admin", "dispatcher"\]/);
assert.match(registryBoard, /Discovered|discovered/);
assert.match(registryBoard, /Sync audited catalog/);
assert.match(registryBoard, /Mark contacted/);
assert.match(registryBoard, /Advance lifecycle/);
assert.match(adminPage, /href: "\/admin\/merchant-registry"/);
assert.match(adminNav, /href: "\/admin\/merchant-registry"/);

console.log(
  `USVI Explorer merchant registry contracts passed for ${catalog.length} deduplicated businesses.`,
);
