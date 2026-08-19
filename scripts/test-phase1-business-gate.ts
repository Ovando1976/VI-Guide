import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  buildFinancialEventRecord,
  financialEventDocumentId,
} from "../lib/analytics/financial-event-server";
import {
  evaluatePhase1Gate,
  PHASE1_VERTICAL_SLICE,
} from "../lib/analytics/phase1-gate";
import {
  FINANCIAL_VI_EVENT_NAMES,
  VI_EVENT_SCHEMA_VERSION,
  type VIEvent,
} from "../lib/analytics/vi-event";
import { evaluateShoreExcursionTiming } from "../lib/shore-excursions";

assert.equal(VI_EVENT_SCHEMA_VERSION, 1);
assert.deepEqual(PHASE1_VERTICAL_SLICE, [
  "landing_view",
  "concierge_started",
  "plan_created",
  "plan_item_added",
  "checkout_started",
  "payment_completed",
]);
assert.equal(FINANCIAL_VI_EVENT_NAMES.has("payment_completed"), true);

const safeTiming = evaluateShoreExcursionTiming({
  startTime: "09:00",
  allAboardTime: "16:30",
  durationMinutes: 240,
  minReturnBufferMinutes: 90,
});
assert.equal(safeTiming.ok, true);
assert.equal(safeTiming.ok && safeTiming.bufferMinutes >= 90, true);
const returnBufferMet = safeTiming.ok && safeTiming.bufferMinutes >= 90;

const base = {
  schemaVersion: VI_EVENT_SCHEMA_VERSION,
  sessionId: "session_phase1",
  occurredAt: "2026-08-17T18:00:00.000Z",
  travelerType: "cruise" as const,
  island: "st_thomas" as const,
  source: "phase1-proof",
};
const events: VIEvent[] = [
  {
    ...base,
    eventId: "evt_explore",
    eventName: "landing_view",
    origin: "client",
    payload: { surface: "explore" },
  },
  {
    ...base,
    eventId: "evt_concierge",
    eventName: "concierge_started",
    origin: "client",
    payload: { intent: "cruise_port_day" },
  },
  {
    ...base,
    eventId: "evt_plan",
    eventName: "plan_created",
    origin: "client",
    itineraryId: "itinerary_phase1",
    payload: { return_buffer_met: returnBufferMet, returnBufferMinutes: safeTiming.ok ? safeTiming.bufferMinutes : 0 },
  },
  {
    ...base,
    eventId: "evt_activity",
    eventName: "plan_item_added",
    origin: "client",
    itineraryId: "itinerary_phase1",
    listingId: "island-tour-one",
    payload: { return_buffer_met: returnBufferMet, activity: "shore_excursion" },
  },
  {
    ...base,
    eventId: "evt_checkout",
    eventName: "checkout_started",
    origin: "client",
    itineraryId: "itinerary_phase1",
    listingId: "island-tour-one",
    bookingId: "booking_phase1",
    payload: { return_buffer_met: returnBufferMet },
  },
  {
    ...base,
    eventId: "financial_payment_evt_stripe_phase1_booking_phase1",
    eventName: "payment_completed",
    origin: "server",
    listingId: "island-tour-one",
    providerId: "island-tour-one",
    bookingId: "booking_phase1",
    payload: {
      amountCents: 12900,
      currency: "usd",
      ledgerEntryId: "commerce_capture_phase1",
      stripeEventId: "evt_stripe_phase1",
    },
  },
];

assert.deepEqual(evaluatePhase1Gate(events), {
  passed: true,
  violations: [],
  sequence: {
    required: PHASE1_VERTICAL_SLICE,
    observed: PHASE1_VERTICAL_SLICE,
    complete: true,
  },
});

const clientFinancial = events.map((event) => ({ ...event }));
clientFinancial[5] = { ...clientFinancial[5], origin: "client" };
assert.equal(
  evaluatePhase1Gate(clientFinancial).violations.some(
    (violation) => violation.code === "client_financial_event",
  ),
  true,
);

const unattributed = events.map((event) => ({ ...event }));
unattributed[5] = { ...unattributed[5], providerId: undefined };
assert.equal(
  evaluatePhase1Gate(unattributed).violations.some(
    (violation) => violation.code === "unattributed_revenue",
  ),
  true,
);

const missingBuffer = events.map((event) => ({ ...event, payload: { ...event.payload } }));
delete missingBuffer[2].payload.return_buffer_met;
assert.equal(
  evaluatePhase1Gate(missingBuffer).violations.some(
    (violation) => violation.code === "missing_return_buffer",
  ),
  true,
);

const duplicateFinancial = [...events, { ...events[5], eventId: "duplicate_payment" }];
assert.equal(
  evaluatePhase1Gate(duplicateFinancial).violations.some(
    (violation) => violation.code === "duplicate_financial_event",
  ),
  true,
);

assert.equal(
  financialEventDocumentId({
    eventName: "payment_completed",
    stripeEventId: "evt_stripe_phase1",
    bookingId: "booking_phase1",
  }),
  financialEventDocumentId({
    eventName: "payment_completed",
    stripeEventId: "evt_stripe_phase1",
    bookingId: "booking_phase1",
  }),
);
assert.equal(
  buildFinancialEventRecord({
    eventName: "payment_completed",
    stripeEventId: "evt_stripe_phase1",
    occurredAt: "2026-08-17T18:05:00.000Z",
    attribution: { bookingId: "booking_phase1", providerId: "" },
    payload: { amountCents: 12900 },
  }),
  null,
);

const acquisitionRoute = readFileSync(
  path.join(process.cwd(), "app/api/acquisition/events/route.ts"),
  "utf8",
);
assert.match(acquisitionRoute, /isClientVIEventName\(eventName\)/);
assert.match(acquisitionRoute, /cannot be used by a browser to manufacture GMV\/revenue/);

const ledgerFirestore = readFileSync(
  path.join(process.cwd(), "lib/payments/commerce-ledger-firestore.ts"),
  "utf8",
);
assert.match(ledgerFirestore, /entry\.status !== "held"/);
assert.match(ledgerFirestore, /eventName: "payment_completed"/);
assert.match(ledgerFirestore, /eventName: "commission_generated"/);
assert.match(ledgerFirestore, /entry\.status !== "posted"/);
assert.match(ledgerFirestore, /eventName: "refund_completed"/);

const shoreBookingRoute = readFileSync(
  path.join(process.cwd(), "app/api/shore-excursions/bookings/route.ts"),
  "utf8",
);
assert.match(shoreBookingRoute, /verifiedReturnBufferMinutes: timing\.bufferMinutes/);
assert.match(shoreBookingRoute, /timingStatus: "buffer_verified"/);

console.log("Phase 1 business gate proof passed.");
