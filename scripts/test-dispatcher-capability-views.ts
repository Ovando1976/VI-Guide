import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function expectSource(source: string, value: string, label: string) {
  if (!source.includes(value)) {
    throw new Error(`Dispatcher capability view contract failed: ${label}`);
  }
}

const paymentPage = read("app/admin/payment-operations/page.tsx");
const dispatcherPayment = read(
  "components/dispatcher-payment-operations-board.tsx",
);
const adminPayment = read("components/payment-operations-board.tsx");
const paymentQueueApi = read("app/api/admin/payment-operations/route.ts");
const reconcileApi = read("app/api/bookings/[bookingId]/payment-status/route.ts");
const settlementApproveApi = read(
  "app/api/admin/settlements/[bookingId]/approve/route.ts",
);
const settlementHoldApi = read(
  "app/api/admin/settlements/[bookingId]/hold/route.ts",
);

expectSource(paymentPage, "getSession", "Payment Operations resolves the verified session");
expectSource(paymentPage, 'session.role === "admin"', "Payment Operations selects the full board only for administrators");
expectSource(paymentPage, "<PaymentOperationsBoard />", "Administrators retain the existing payment console");
expectSource(paymentPage, "<DispatcherPaymentOperationsBoard />", "Dispatchers receive the bounded payment console");
expectSource(dispatcherPayment, 'fetch("/api/admin/payment-operations"', "Dispatcher payment view reads the shared exception queue");
expectSource(dispatcherPayment, "/payment-status`,", "Dispatcher payment view keeps Stripe reconciliation");
expectSource(dispatcherPayment, "/hold`,", "Dispatcher payment view keeps audited settlement holds");
expectSource(dispatcherPayment, "Place audited hold", "Dispatcher settlement hold capability is visible");
if (dispatcherPayment.includes("/approve") || dispatcherPayment.includes("Admin approve")) {
  throw new Error(
    "Dispatcher capability view contract failed: dispatcher payment view must not expose settlement approval",
  );
}
expectSource(adminPayment, "/approve`,", "Administrator payment view keeps settlement approval");
expectSource(paymentQueueApi, 'requireSession(["admin", "dispatcher"])', "Payment exception queue remains admin/dispatcher readable");
expectSource(reconcileApi, 'session.role === "admin" || session.role === "dispatcher"', "Stripe reconciliation remains privileged for admin/dispatcher");
expectSource(settlementApproveApi, 'requireSession(["admin"])', "Settlement approval remains administrator-only");
expectSource(settlementHoldApi, 'requireSession(["admin", "dispatcher"])', "Settlement holds remain admin/dispatcher capable");

const taxiPage = read("app/admin/taxi-operations/page.tsx");
const dispatcherTaxi = read("components/dispatcher-taxi-operations-board.tsx");
const adminTaxi = read("components/taxi-operations-board.tsx");
const taxiOnboardApi = read("app/api/admin/taxi-operations/onboard/route.ts");

expectSource(taxiPage, "getSession", "Taxi Operations resolves the verified session");
expectSource(taxiPage, 'session.role === "dispatcher"', "Taxi Operations explicitly selects dispatcher mode");
expectSource(taxiPage, "<DispatcherTaxiOperationsBoard />", "Dispatchers receive fleet review without onboarding");
expectSource(taxiPage, "<TaxiOperationsBoard />", "Administrators retain the existing onboarding console");
expectSource(dispatcherTaxi, 'collection(db, "taxiAssociations")', "Dispatcher taxi view keeps reviewed association visibility");
expectSource(dispatcherTaxi, 'collection(db, "drivers")', "Dispatcher taxi view keeps driver readiness visibility");
expectSource(dispatcherTaxi, 'collection(db, "vehicles")', "Dispatcher taxi view keeps fleet readiness visibility");
expectSource(dispatcherTaxi, "Read-only dispatcher access.", "Dispatcher taxi scope is explicit");
if (
  dispatcherTaxi.includes("/api/admin/taxi-operations/onboard") ||
  dispatcherTaxi.includes("Onboard reviewed operator") ||
  dispatcherTaxi.includes("/admin/tariffs") ||
  dispatcherTaxi.includes("/admin/pilot-readiness")
) {
  throw new Error(
    "Dispatcher capability view contract failed: dispatcher taxi view must not expose admin-only onboarding or governance links",
  );
}
expectSource(adminTaxi, "/api/admin/taxi-operations/onboard", "Administrator taxi view keeps reviewed onboarding");
expectSource(taxiOnboardApi, 'requireSession(["admin"])', "Taxi operator onboarding remains administrator-only");

const readinessLayout = read("app/admin/readiness/layout.tsx");
const readinessApi = read("app/api/admin/readiness/route.ts");
expectSource(readinessLayout, 'session.role !== "admin"', "Launch Readiness page is administrator-only");
expectSource(readinessLayout, "/login?next=/admin/readiness", "Launch Readiness keeps exact login return routing");
expectSource(readinessApi, 'requireSession(["admin"])', "Launch Readiness API remains administrator-only");

const dispatchPage = read("app/admin/dispatch/page.tsx");
const dispatchHubRadar = read("components/dispatch-hub-radar.tsx");
const sttDispatchHubs = read("lib/stt-dispatch-hubs.ts");
expectSource(dispatchPage, "<DispatchHubRadar />", "Dispatch control center surfaces the STT stand radar");
expectSource(dispatchHubRadar, "booking.origin?.estateGeoid === hub.id", "Stand demand is keyed by exact canonical mobility hub ID");
expectSource(dispatchHubRadar, "association or stand operator", "Dispatch UI keeps physical queue confirmation explicit");
expectSource(dispatchHubRadar, "Stand intelligence is not a fare input", "Stand demand cannot imply fare authority");
expectSource(sttDispatchHubs, 'queueStatusSource: "operator_confirmation_required"', "Queue order is never invented by the app");
expectSource(sttDispatchHubs, 'pricingEffect: "none"', "Stand metadata has zero pricing authority");
expectSource(sttDispatchHubs, 'pricingAuthority: "official_usvi_taxi_tariff"', "Official tariff remains the pricing authority");

console.log("USVI Explorer dispatcher capability view contracts passed.");
