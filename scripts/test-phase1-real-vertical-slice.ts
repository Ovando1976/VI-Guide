import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { cruiseReturnBufferEvidence } from "../lib/analytics/cruise-return-buffer";
import { evaluatePhase1Gate } from "../lib/analytics/phase1-gate";
import { VI_EVENT_SCHEMA_VERSION, type VIEvent } from "../lib/analytics/vi-event";

const safe = cruiseReturnBufferEvidence({
  shoreExcursion: {
    timingStatus: "buffer_verified",
    verifiedReturnBufferMinutes: 120,
    minReturnBufferMinutes: 90,
    allAboardTime: "16:30",
    safeReturnDeadline: "15:00",
    shipName: "Test Ship",
    portId: "havensight",
  },
});
assert.ok(safe);
assert.equal(safe.returnBufferMet, true);
assert.equal(safe.verifiedReturnBufferMinutes, 120);

const unsafe = cruiseReturnBufferEvidence({
  shoreExcursion: {
    timingStatus: "buffer_verified",
    verifiedReturnBufferMinutes: 60,
    minReturnBufferMinutes: 90,
  },
});
assert.ok(unsafe);
assert.equal(unsafe.returnBufferMet, false);

const missingVerification = cruiseReturnBufferEvidence({
  shoreExcursion: {
    verifiedReturnBufferMinutes: 120,
    minReturnBufferMinutes: 90,
  },
});
assert.ok(missingVerification);
assert.equal(missingVerification.returnBufferMet, false);
assert.equal(cruiseReturnBufferEvidence({}), null);

const cruiseEvent: VIEvent = {
  eventId: "evt_unsafe_checkout",
  eventName: "checkout_started",
  schemaVersion: VI_EVENT_SCHEMA_VERSION,
  origin: "server",
  occurredAt: "2026-08-17T20:00:00.000Z",
  sessionId: "checkout_test",
  travelerType: "cruise",
  bookingId: "booking_test",
  payload: { return_buffer_met: false },
};
const gate = evaluatePhase1Gate([cruiseEvent]);
assert.equal(
  gate.violations.some((violation) => violation.code === "return_buffer_not_met"),
  true,
);

const checkoutRoute = readFileSync(
  path.join(process.cwd(), "app/api/payments/create-checkout-session/route.ts"),
  "utf8",
);
assert.match(checkoutRoute, /Cruise-day checkout is blocked until the verified return-to-ship buffer is restored/);
assert.match(checkoutRoute, /eventName: "plan_created"/);
assert.match(checkoutRoute, /eventName: "plan_item_added"/);
assert.match(checkoutRoute, /eventName: "checkout_started"/);
assert.match(checkoutRoute, /return_buffer_met: input\.buffer\.returnBufferMet/);

const exploreLayout = readFileSync(
  path.join(process.cwd(), "app/explore/layout.tsx"),
  "utf8",
);
assert.match(exploreLayout, /eventName="landing_view"/);

const conciergeLayout = readFileSync(
  path.join(process.cwd(), "app/concierge/layout.tsx"),
  "utf8",
);
assert.match(conciergeLayout, /eventName="concierge_started"/);

console.log("Phase 1 real vertical slice instrumentation passed.");
