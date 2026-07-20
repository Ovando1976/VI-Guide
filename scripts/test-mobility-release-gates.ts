import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  assertBookingTransition,
  getBookingWorkflow,
} from "../lib/booking-workflow";
import { getOfficialTaxiTariffValidationErrors } from "../lib/official-taxi-tariff-validation";
import type { RideBooking } from "../types/mobility";
import type { OfficialTaxiTariff } from "../types/taxi-operations";
import type { IslandCode } from "../types/usvi";

const ISLANDS: IslandCode[] = ["stt", "stj", "stx"];
const requireActive = process.argv.includes("--require-active");
const useLiveTariffs = process.argv.includes("--live");

async function main() {
  testBookingStateMachine();
  const tariffs = useLiveTariffs ? await loadLiveTariffs() : await loadTariffs();
  const tariffSummary = testTariffCatalog(tariffs);

  console.table({
    workflowTests: "passed",
    tariffs: tariffs.length,
    rules: tariffSummary.rules,
    active: tariffSummary.active,
    provisional: tariffSummary.provisional,
    draft: tariffSummary.draft,
    source: useLiveTariffs ? "Firestore" : "local files",
    productionReady: tariffSummary.productionReady,
  });

  if (requireActive && !tariffSummary.productionReady) {
    throw new Error(
      "Production gate failed: each island requires exactly one Commission-verified active tariff. Provisional transcriptions cannot authorize booking or dispatch.",
    );
  }
}

function testBookingStateMachine() {
  const matched = booking({ status: "matched", paymentStatus: "paid", driverId: "driver-1" });
  assert.equal(
    assertBookingTransition({ booking: matched, nextStatus: "driver_en_route", actorType: "driver" }),
    "transition",
  );
  assert.throws(
    () => assertBookingTransition({ booking: matched, nextStatus: "arrived", actorType: "driver" }),
    /Invalid trip transition/,
  );
  assert.throws(
    () => assertBookingTransition({ booking: matched, nextStatus: "driver_en_route", actorType: "rider" }),
    /Riders cannot advance/,
  );
  assert.throws(
    () =>
      assertBookingTransition({
        booking: booking({ status: "matched", paymentStatus: "unpaid", driverId: "driver-1" }),
        nextStatus: "driver_en_route",
        actorType: "driver",
      }),
    /Payment must clear/,
  );
  assert.throws(
    () =>
      assertBookingTransition({
        booking: booking({ status: "matched", paymentStatus: "paid", driverId: undefined }),
        nextStatus: "driver_en_route",
        actorType: "admin",
      }),
    /driver must be assigned/i,
  );

  const enRoute = booking({ status: "driver_en_route", paymentStatus: "paid", driverId: "driver-1" });
  const arrived = booking({ status: "arrived", paymentStatus: "paid", driverId: "driver-1" });
  const active = booking({ status: "in_progress", paymentStatus: "paid", driverId: "driver-1" });
  assert.equal(assertBookingTransition({ booking: enRoute, nextStatus: "arrived", actorType: "driver" }), "transition");
  assert.equal(assertBookingTransition({ booking: arrived, nextStatus: "in_progress", actorType: "driver" }), "transition");
  assert.equal(assertBookingTransition({ booking: active, nextStatus: "completed", actorType: "driver" }), "transition");
  assert.throws(
    () => assertBookingTransition({ booking: arrived, nextStatus: "cancelled", actorType: "rider" }),
    /cannot cancel after the driver has arrived/i,
  );
  assert.throws(
    () => assertBookingTransition({ booking: active, nextStatus: "cancelled", actorType: "driver" }),
    /cancelled by dispatch/i,
  );
  assert.equal(
    assertBookingTransition({ booking: active, nextStatus: "cancelled", actorType: "admin" }),
    "transition",
  );
  assert.throws(
    () =>
      assertBookingTransition({
        booking: booking({ status: "completed", paymentStatus: "paid", driverId: "driver-1" }),
        nextStatus: "cancelled",
        actorType: "admin",
      }),
    /already closed/,
  );

  const driverWorkflow = getBookingWorkflow(matched, "driver");
  assert.deepEqual(driverWorkflow.actions.map((action) => action.nextStatus), ["driver_en_route", "cancelled"]);
  const riderWorkflow = getBookingWorkflow(enRoute, "rider");
  assert.deepEqual(riderWorkflow.actions.map((action) => action.nextStatus), ["cancelled"]);
  assert.equal(getBookingWorkflow(active, "rider").actions.length, 0);
}

function testTariffCatalog(tariffs: OfficialTaxiTariff[]) {
  assert.equal(tariffs.length, ISLANDS.length, "Expected one tariff candidate per island.");
  let rules = 0;
  let active = 0;
  let provisional = 0;
  let draft = 0;

  for (const island of ISLANDS) {
    const matches = tariffs.filter((tariff) => tariff.island === island);
    assert.equal(matches.length, 1, `${island} must have exactly one candidate tariff.`);
    const tariff = matches[0];
    const errors = getOfficialTaxiTariffValidationErrors(tariff);
    assert.deepEqual(errors, [], `${tariff.id} failed structural validation:\n${errors.join("\n")}`);
    assert.ok(tariff.rules.length > 0, `${tariff.id} must include route rules.`);
    assert.equal(tariff.currency, "USD");
    assert.equal(tariff.issuingAuthority, "Virgin Islands Taxicab Commission");
    assert.ok(/^https:\/\//.test(tariff.sourceUrl));

    const routeKeys = new Set<string>();
    for (const rule of tariff.rules) {
      assert.ok(rule.onePassengerFare >= 0, `${rule.id} has an invalid fare.`);
      const key = `${normalize(rule.originNames[0] ?? "")}::${normalize(rule.destinationNames[0] ?? "")}`;
      assert.ok(!routeKeys.has(key), `${tariff.id} contains duplicate route ${key}.`);
      routeKeys.add(key);
    }

    rules += tariff.rules.length;
    if (tariff.status === "active") active += 1;
    if (tariff.status === "provisional") provisional += 1;
    if (tariff.status === "draft") draft += 1;
  }

  return {
    rules,
    active,
    provisional,
    draft,
    productionReady: active === ISLANDS.length,
  };
}

async function loadLiveTariffs() {
  const { getAdminDb } = await import("../lib/firebase-admin");
  const snapshot = await getAdminDb().collection("taxiTariffs").get();
  return snapshot.docs.map(
    (document) => ({ id: document.id, ...document.data() }) as OfficialTaxiTariff,
  );
}

async function loadTariffs() {
  return Promise.all(
    ISLANDS.map(async (island) =>
      JSON.parse(
        await readFile(new URL(`../data/taxi-tariffs/${island}-2022.json`, import.meta.url), "utf8"),
      ) as OfficialTaxiTariff,
    ),
  );
}

function booking(overrides: Partial<RideBooking>): RideBooking {
  return {
    id: "booking-test",
    riderId: "rider-1",
    driverId: "driver-1",
    status: "matched",
    paymentStatus: "paid",
    mode: "standard",
    island: "stt",
    origin: pickup("origin", 18.34, -64.94),
    destination: pickup("destination", 18.35, -64.93),
    passengers: 1,
    luggage: 0,
    quotedFare: {
      pricingModel: "official_usvi_taxi_tariff",
      quoteStatus: "official",
      currency: "USD",
      tariffId: "tariff-test",
      tariffTitle: "Test tariff",
      tariffVersion: "test",
      tariffSourceUrl: "https://example.gov/tariff",
      tariffEffectiveAt: "2022-10-24T00:00:00.000Z",
      quotedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      rateRuleId: "rule-test",
      matchedOrigin: "Origin",
      matchedDestination: "Destination",
      routeFare: 10,
      passengerFare: 0,
      luggageFare: 0,
      authorizedAdditionalCharges: 0,
      total: 10,
    },
    ...overrides,
  };
}

function pickup(name: string, lat: number, lng: number) {
  return {
    lat,
    lng,
    estateGeoid: name,
    estateName: name,
    pickupConfidence: 1,
    accessType: "roadside" as const,
  };
}

function normalize(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
