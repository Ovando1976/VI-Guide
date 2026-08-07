import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  bookingKindForProposalStop,
  buildTravelAdvisorBookingHref,
  normalizeProposalShareId,
} from "@/lib/travel-advisor-booking-handoff";
import type { IntelligencePlanStop } from "@/types/intelligence";

const shareId = "a1b2c3d4e5f60718293a4b5c";
const stay: IntelligencePlanStop = {
  id: "stay_ritz",
  placeId: "ritz-carlton-st-thomas",
  title: "The Ritz-Carlton, St. Thomas",
  island: "stt",
  kind: "stay",
  summary: "A resort stay included in the advisor proposal.",
  href: "/accommodations/ritz-carlton-st-thomas",
};

assert.equal(normalizeProposalShareId(shareId), shareId);
assert.equal(normalizeProposalShareId("short"), "");
assert.equal(bookingKindForProposalStop(stay), "accommodation");
assert.equal(bookingKindForProposalStop({ kind: "shore excursion" }), "tour");
assert.equal(bookingKindForProposalStop({ kind: "snorkel charter" }), "tour");
assert.equal(bookingKindForProposalStop({ kind: "activity" }), "experience");
assert.equal(bookingKindForProposalStop({ kind: "beach" }), null);

const href = buildTravelAdvisorBookingHref({
  shareId,
  date: "2026-11-14",
  stop: stay,
});
assert.ok(href);
const url = new URL(href, "https://vi-guide.local");
assert.equal(url.pathname, "/book");
assert.equal(url.searchParams.get("kind"), "accommodation");
assert.equal(url.searchParams.get("listingId"), "ritz-carlton-st-thomas");
assert.equal(url.searchParams.get("listingName"), "The Ritz-Carlton, St. Thomas");
assert.equal(url.searchParams.get("island"), "stt");
assert.equal(url.searchParams.get("startDate"), "2026-11-14");
assert.equal(url.searchParams.get("sourceProposal"), shareId);
assert.equal(
  url.searchParams.get("listingHref"),
  "/accommodations/ritz-carlton-st-thomas",
);

const externalHref = buildTravelAdvisorBookingHref({
  shareId,
  date: "2026-11-14",
  stop: { ...stay, href: "https://example.com/reserve" },
});
assert.ok(externalHref);
assert.equal(
  new URL(externalHref, "https://vi-guide.local").searchParams.get("listingHref"),
  null,
);

assert.equal(
  buildTravelAdvisorBookingHref({
    shareId,
    date: "2026-11-14",
    stop: { ...stay, kind: "beach" },
  }),
  null,
);

const bookingRoute = readFileSync(
  resolve(process.cwd(), "app/api/commerce-bookings/route.ts"),
  "utf8",
);
const bookingExperience = readFileSync(
  resolve(process.cwd(), "components/booking/commerce-booking-experience.tsx"),
  "utf8",
);
const sharedProposal = readFileSync(
  resolve(process.cwd(), "app/shared-trip/[shareId]/page.tsx"),
  "utf8",
);

assert.match(bookingRoute, /sourceTravelRequestId/);
assert.match(bookingRoute, /vi-guide-travel-proposal/);
assert.match(bookingRoute, /booking_request_started/);
assert.match(bookingRoute, /stopMatchesProposal/);
assert.match(bookingExperience, /sourceProposalShareId/);
assert.match(bookingExperience, /Back to proposal/);
assert.match(sharedProposal, /buildTravelAdvisorBookingHref/);
assert.match(sharedProposal, /Request booking/);
assert.match(sharedProposal, /does not create a charge/);

console.log("Travel advisor proposal-to-booking conversion tests passed.");
