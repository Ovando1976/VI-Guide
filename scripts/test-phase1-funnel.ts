import assert from "node:assert/strict";

import { summarizePhase1Funnel } from "../lib/analytics/funnel";

const summary = summarizePhase1Funnel([
  { eventName: "landing_view", origin: "client" },
  { eventName: "concierge_started", origin: "client" },
  {
    eventName: "plan_created",
    origin: "server",
    travelerType: "cruise",
    payload: { return_buffer_met: true },
  },
  {
    eventName: "plan_item_added",
    origin: "server",
    travelerType: "cruise",
    payload: { return_buffer_met: true },
  },
  {
    eventName: "checkout_started",
    origin: "server",
    travelerType: "cruise",
    payload: { return_buffer_met: true },
  },
  {
    eventName: "payment_completed",
    origin: "server",
    providerId: "listing:island-tour-one",
    bookingId: "booking_phase1",
  },
  {
    eventName: "commission_generated",
    origin: "server",
    providerId: "listing:island-tour-one",
    bookingId: "booking_phase1",
  },
]);

assert.equal(summary.totalEvents, 7);
assert.equal(summary.financial.paymentCompleted, 1);
assert.equal(summary.financial.commissionGenerated, 1);
assert.equal(summary.financial.unattributed, 0);
assert.equal(summary.financial.clientOriginated, 0);
assert.equal(summary.cruise.relevantEvents, 3);
assert.equal(summary.cruise.returnBufferReported, 3);
assert.equal(summary.cruise.returnBufferMet, 3);
assert.equal(summary.cruise.returnBufferFailed, 0);
assert.equal(summary.cruise.returnBufferMissing, 0);
assert.equal(summary.funnel.every((step) => step.count > 0), true);

const failed = summarizePhase1Funnel([
  {
    eventName: "plan_created",
    origin: "server",
    travelerType: "cruise",
    payload: { return_buffer_met: false },
  },
  {
    eventName: "checkout_started",
    origin: "server",
    travelerType: "cruise",
    payload: {},
  },
  {
    eventName: "payment_completed",
    origin: "client",
    providerId: "",
    bookingId: "",
  },
]);
assert.equal(failed.cruise.returnBufferMissing, 1);
assert.equal(failed.cruise.returnBufferFailed, 1);
assert.equal(failed.financial.clientOriginated, 1);
assert.equal(failed.financial.unattributed, 1);

console.log("Phase 1 funnel summary tests passed.");
