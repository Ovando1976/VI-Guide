import assert from "node:assert/strict";

import type { MerchantOfferBookingSnapshot } from "../lib/merchant-offer-booking";
import {
  canTransitionShoreExcursion,
  evaluateShoreExcursionTiming,
  normalizeShoreExcursionProfile,
  shoreExcursionBookingDocumentId,
  shoreExcursionPort,
} from "../lib/shore-excursions";

const offer: MerchantOfferBookingSnapshot = {
  offerId: "offer_shore_123",
  offerTitle: "Island Highlights and Beach Escape",
  offerPriceCents: 12_900,
  offerCompareAtCents: 15_900,
  offerDepositCents: 5_000,
  listingId: "island-tour-one",
  listingName: "Island Tour One",
  kind: "tour",
  island: "stt",
  validFrom: "2026-08-06",
  validThrough: "2027-08-06",
};

const valid = normalizeShoreExcursionProfile({
  offer,
  profile: {
    offerId: offer.offerId,
    supportedPorts: ["havensight", "crown_bay"],
    meetingPoint: "Outside the cruise terminal welcome center",
    durationMinutes: 240,
    minReturnBufferMinutes: 90,
    pickupIncluded: true,
    maxGuests: 12,
    mobilityNotes: "Air-conditioned van pickup.",
    accessibilityNotes: "Contact operator for wheelchair fit confirmation.",
  },
});
assert.equal(valid.ok, true);
if (!valid.ok) throw new Error(valid.error);
assert.deepEqual(valid.profile.supportedPorts, ["havensight", "crown_bay"]);
assert.equal(valid.profile.minReturnBufferMinutes, 90);

const wrongIsland = normalizeShoreExcursionProfile({
  offer,
  profile: {
    supportedPorts: ["frederiksted"],
    meetingPoint: "Outside the cruise terminal welcome center",
    durationMinutes: 240,
    minReturnBufferMinutes: 90,
    pickupIncluded: true,
    maxGuests: 12,
  },
});
assert.equal(wrongIsland.ok, false);

const tooSmallBuffer = normalizeShoreExcursionProfile({
  offer,
  profile: {
    supportedPorts: ["havensight"],
    meetingPoint: "Outside the cruise terminal welcome center",
    durationMinutes: 240,
    minReturnBufferMinutes: 30,
    pickupIncluded: true,
    maxGuests: 12,
  },
});
assert.equal(tooSmallBuffer.ok, false);

const safeTiming = evaluateShoreExcursionTiming({
  startTime: "09:00",
  allAboardTime: "16:30",
  durationMinutes: 240,
  minReturnBufferMinutes: 90,
});
assert.equal(safeTiming.ok, true);
if (!safeTiming.ok) throw new Error("Expected safe timing");
assert.equal(safeTiming.excursionEndsAt, "13:00");
assert.equal(safeTiming.safeReturnDeadline, "15:00");
assert.equal(safeTiming.latestSafeStartTime, "11:00");
assert.equal(safeTiming.bufferMinutes, 210);

const unsafeTiming = evaluateShoreExcursionTiming({
  startTime: "12:00",
  allAboardTime: "16:30",
  durationMinutes: 240,
  minReturnBufferMinutes: 90,
});
assert.equal(unsafeTiming.ok, false);
if (unsafeTiming.ok) throw new Error("Expected unsafe timing");
assert.equal(unsafeTiming.reason, "insufficient_return_buffer");
assert.equal(unsafeTiming.latestSafeStartTime, "11:00");

const invertedTiming = evaluateShoreExcursionTiming({
  startTime: "16:30",
  allAboardTime: "16:00",
  durationMinutes: 60,
  minReturnBufferMinutes: 90,
});
assert.deepEqual(invertedTiming, {
  ok: false,
  reason: "all_aboard_before_start",
});

const bookingInput = {
  offerId: offer.offerId,
  email: "Traveler@Example.com",
  startDate: "2026-12-10",
  preferredTime: "09:00",
  shipName: "Icon of the Seas",
  portId: "havensight" as const,
  allAboardTime: "16:30",
  offerPriceCents: 12_900,
};
const bookingId = shoreExcursionBookingDocumentId(bookingInput);
assert.match(bookingId, /^shore_[a-f0-9]{40}$/);
assert.equal(bookingId, shoreExcursionBookingDocumentId(bookingInput));
assert.notEqual(
  bookingId,
  shoreExcursionBookingDocumentId({
    ...bookingInput,
    allAboardTime: "17:00",
  }),
);
assert.notEqual(
  bookingId,
  shoreExcursionBookingDocumentId({
    ...bookingInput,
    shipName: "Wonder of the Seas",
  }),
);

assert.equal(shoreExcursionPort("havensight")?.island, "stt");
assert.equal(shoreExcursionPort("frederiksted")?.island, "stx");
assert.equal(shoreExcursionPort("unknown"), null);

assert.equal(canTransitionShoreExcursion("draft", "active"), true);
assert.equal(canTransitionShoreExcursion("active", "paused"), true);
assert.equal(canTransitionShoreExcursion("active", "draft"), false);
assert.equal(canTransitionShoreExcursion("archived", "active"), false);

console.log("shore excursion contracts passed");
