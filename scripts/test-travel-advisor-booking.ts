import assert from "node:assert/strict";

import {
  buildTravelProposalBookingHref,
  normalizeTravelProposalShareId,
  normalizeTravelRequestId,
  proposalBookingEmailMatches,
  proposalCommerceKind,
} from "../lib/travel-advisor-booking";

const shareId = "0123456789abcdef01234567";
const requestId = "travel_0123456789abcdef0123456789abcdef";

assert.equal(normalizeTravelProposalShareId(shareId), shareId);
assert.equal(normalizeTravelProposalShareId("invalid"), "");
assert.equal(normalizeTravelRequestId(requestId), requestId);
assert.equal(normalizeTravelRequestId("travel_invalid"), "");
assert.equal(
  proposalBookingEmailMatches(" Traveler@Example.com ", "traveler@example.com"),
  true,
);
assert.equal(
  proposalBookingEmailMatches("traveler@example.com", "other@example.com"),
  false,
);

assert.equal(proposalCommerceKind("hotel"), "accommodation");
assert.equal(proposalCommerceKind("shore-excursion"), "tour");
assert.equal(proposalCommerceKind("activity"), "experience");
assert.equal(proposalCommerceKind("beach"), null);

const stayHref = buildTravelProposalBookingHref({
  shareId,
  planDate: "2026-09-11",
  arrival: "2026-09-10",
  departure: "2026-09-15",
  travelers: 4,
  stop: {
    id: "stop_hotel",
    placeId: "hotel-one",
    title: "Hotel One",
    island: "stt",
    kind: "hotel",
    summary: "Stay option",
    href: "/accommodations/hotel-one",
  },
});
assert.ok(stayHref.startsWith("/book?"));
const stayParams = new URL(stayHref, "https://vi-guide.local").searchParams;
assert.equal(stayParams.get("kind"), "accommodation");
assert.equal(stayParams.get("listingId"), "hotel-one");
assert.equal(stayParams.get("listingName"), "Hotel One");
assert.equal(stayParams.get("island"), "stt");
assert.equal(stayParams.get("startDate"), "2026-09-10");
assert.equal(stayParams.get("endDate"), "2026-09-15");
assert.equal(stayParams.get("adults"), "4");
assert.equal(stayParams.get("proposal"), shareId);
assert.equal(stayParams.get("listingHref"), "/accommodations/hotel-one");

const tourHref = buildTravelProposalBookingHref({
  shareId,
  planDate: "2026-09-12",
  travelers: 2,
  stop: {
    id: "tour-one",
    title: "Island Tour",
    island: "stj",
    kind: "tour",
    summary: "Tour option",
    href: "https://external.example/should-not-pass",
  },
});
const tourParams = new URL(tourHref, "https://vi-guide.local").searchParams;
assert.equal(tourParams.get("kind"), "tour");
assert.equal(tourParams.get("startDate"), "2026-09-12");
assert.equal(tourParams.get("listingHref"), null);

assert.equal(
  buildTravelProposalBookingHref({
    shareId,
    planDate: "2026-09-12",
    travelers: 2,
    stop: {
      id: "beach-one",
      title: "Beach One",
      island: "stx",
      kind: "beach",
      summary: "Beach day",
    },
  }),
  "",
);
assert.equal(
  buildTravelProposalBookingHref({
    shareId: "invalid",
    planDate: "2026-09-12",
    travelers: 2,
    stop: {
      id: "tour-one",
      title: "Tour",
      island: "stt",
      kind: "tour",
      summary: "Tour",
    },
  }),
  "",
);

console.log("Travel advisor proposal booking handoff tests passed.");
