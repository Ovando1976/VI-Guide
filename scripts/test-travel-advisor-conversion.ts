import assert from "node:assert/strict";

import {
  bookingKindForProposalStop,
  buildTravelAdvisorBookingHref,
  normalizeProposalShareId,
  proposalBookingEmailMatches,
} from "../lib/travel-advisor-booking-handoff";

const shareId = "0123456789abcdef01234567";

assert.equal(
  bookingKindForProposalStop({ kind: "hotel" }),
  "accommodation",
);
assert.equal(bookingKindForProposalStop({ kind: "shore excursion" }), "tour");
assert.equal(bookingKindForProposalStop({ kind: "boat charter" }), "tour");
assert.equal(
  bookingKindForProposalStop({ kind: "cultural experience" }),
  "experience",
);
assert.equal(bookingKindForProposalStop({ kind: "beach" }), null);

const hotelHref = buildTravelAdvisorBookingHref({
  shareId,
  date: "2026-09-12",
  stop: {
    id: "stay_1",
    placeId: "stay_hotel_1",
    title: "Example Hotel",
    island: "stt",
    kind: "hotel",
    summary: "Stay candidate",
    href: "/accommodations/example-hotel",
  },
});
assert.ok(hotelHref);
const hotelUrl = new URL(hotelHref, "https://vi-guide.local");
assert.equal(hotelUrl.pathname, "/book");
assert.equal(hotelUrl.searchParams.get("kind"), "accommodation");
assert.equal(hotelUrl.searchParams.get("listingId"), "stay_hotel_1");
assert.equal(hotelUrl.searchParams.get("listingName"), "Example Hotel");
assert.equal(hotelUrl.searchParams.get("island"), "stt");
assert.equal(hotelUrl.searchParams.get("startDate"), "2026-09-12");
assert.equal(hotelUrl.searchParams.get("sourceProposal"), shareId);
assert.equal(
  hotelUrl.searchParams.get("listingHref"),
  "/accommodations/example-hotel",
);

const tourHref = buildTravelAdvisorBookingHref({
  shareId,
  date: "2026-09-13",
  stop: {
    id: "tour_1",
    title: "Island Boat Tour",
    island: "stj",
    kind: "boat tour",
    summary: "Tour candidate",
    href: "/places/island-boat-tour",
  },
});
assert.ok(tourHref);
const tourUrl = new URL(tourHref, "https://vi-guide.local");
assert.equal(tourUrl.searchParams.get("kind"), "tour");
assert.equal(tourUrl.searchParams.get("listingId"), "tour_1");
assert.equal(tourUrl.searchParams.get("island"), "stj");
assert.equal(tourUrl.searchParams.get("sourceProposal"), shareId);

const unsafeHref = buildTravelAdvisorBookingHref({
  shareId,
  date: "2026-09-13",
  stop: {
    id: "experience_1",
    title: "Island Experience",
    island: "stx",
    kind: "experience",
    summary: "Experience candidate",
    href: "https://example.com/should-not-pass-through",
  },
});
assert.ok(unsafeHref);
assert.equal(
  new URL(unsafeHref, "https://vi-guide.local").searchParams.has(
    "listingHref",
  ),
  false,
);

assert.equal(
  buildTravelAdvisorBookingHref({
    shareId,
    date: "2026-09-13",
    stop: {
      id: "beach_1",
      title: "Example Beach",
      island: "stt",
      kind: "beach",
      summary: "Not a direct commerce request",
    },
  }),
  null,
);

assert.equal(normalizeProposalShareId(shareId), shareId);
assert.equal(normalizeProposalShareId("bad id"), "");
assert.equal(
  proposalBookingEmailMatches(" Traveler@Example.com ", "traveler@example.com"),
  true,
);
assert.equal(
  proposalBookingEmailMatches("traveler@example.com", "other@example.com"),
  false,
);
assert.equal(proposalBookingEmailMatches("invalid", "invalid"), false);

console.log("Travel advisor proposal-to-booking conversion tests passed.");
