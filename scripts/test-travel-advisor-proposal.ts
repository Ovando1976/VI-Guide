import assert from "node:assert/strict";

import { buildTravelAdvisorProposalSnapshot } from "../lib/travel-advisor-proposal";

const requestId = "travel_0123456789abcdef0123456789abcdef";
const basePlan = {
  id: "plan_proposal_test",
  title: "St. Thomas anniversary plan",
  island: "stt",
  date: "2026-09-10",
  createdAt: "2026-08-07T20:00:00.000Z",
  updatedAt: "2026-08-07T20:01:00.000Z",
  status: "draft",
  notes: "Traveler contact traveler@example.com or 340-555-0101 before dinner.",
  plan: [
    {
      id: "stop_magens",
      placeId: "magens-bay",
      title: "Magens Bay",
      island: "stt",
      kind: "beach",
      summary: "Beach morning. Backup contact: helper@example.com, (340) 555-0199.",
      href: "/beaches/magens-bay",
      mapHref: "/map?island=stt&place=magens-bay",
      bookingHref: "https://external.example/secret",
    },
  ],
};

const snapshot = buildTravelAdvisorProposalSnapshot({ requestId, plan: basePlan });
assert.ok(snapshot);
assert.equal(snapshot.plan.status, "ready");
assert.equal(snapshot.plan.plan.length, 1);
assert.match(snapshot.shareId, /^[a-f0-9]{24}$/);
assert.doesNotMatch(snapshot.plan.notes, /traveler@example\.com/);
assert.doesNotMatch(snapshot.plan.notes, /340-555-0101/);
assert.doesNotMatch(snapshot.plan.plan[0]?.summary ?? "", /helper@example\.com/);
assert.doesNotMatch(snapshot.plan.plan[0]?.summary ?? "", /555-0199/);
assert.equal(snapshot.plan.plan[0]?.href, "/beaches/magens-bay");
assert.equal(snapshot.plan.plan[0]?.mapHref, "/map?island=stt&place=magens-bay");
assert.equal(snapshot.plan.plan[0]?.bookingHref, undefined);

const sameContentDifferentTimestamps = buildTravelAdvisorProposalSnapshot({
  requestId,
  plan: {
    ...basePlan,
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-07T21:00:00.000Z",
  },
});
assert.ok(sameContentDifferentTimestamps);
assert.equal(sameContentDifferentTimestamps.shareId, snapshot.shareId);
assert.equal(sameContentDifferentTimestamps.digest, snapshot.digest);

const changedPlan = buildTravelAdvisorProposalSnapshot({
  requestId,
  plan: {
    ...basePlan,
    plan: [
      ...basePlan.plan,
      {
        id: "stop_dinner",
        title: "Dinner",
        island: "stt",
        kind: "restaurant",
        summary: "Dinner option to confirm.",
        href: "/places/dinner-option",
      },
    ],
  },
});
assert.ok(changedPlan);
assert.notEqual(changedPlan.shareId, snapshot.shareId);
assert.notEqual(changedPlan.digest, snapshot.digest);

assert.equal(
  buildTravelAdvisorProposalSnapshot({
    requestId: "bad-request",
    plan: basePlan,
  }),
  null,
);
assert.equal(
  buildTravelAdvisorProposalSnapshot({
    requestId,
    plan: { ...basePlan, plan: [] },
  }),
  null,
);

console.log("Travel advisor proposal privacy and identity tests passed.");
