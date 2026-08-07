import assert from "node:assert/strict";

import { resolveOfficialPortCallContext } from "../lib/cruise-port-call-context";
import {
  evaluateOfficialPortCallExcursionFit,
  reservedGuestCount,
} from "../lib/cruise-port-call-match";
import {
  derivePlanningAllAboard,
  getOfficialCruisePortCall,
  listOfficialCruisePortCalls,
} from "../lib/cruise-port-calls";
import type { MerchantOfferBookingSnapshot } from "../lib/merchant-offer-booking";
import type { ShoreExcursionProfile } from "../lib/shore-excursions";
import type { ProviderAvailabilityDay } from "../types/provider-operations";

const rhapsody = getOfficialCruisePortCall(
  "2026-08-06_frederiksted_rhapsody-of-the-seas",
);
assert.ok(rhapsody, "known official Frederiksted call should exist");
assert.equal(rhapsody.arrivesAt, "08:00");
assert.equal(rhapsody.departsAt, "18:00");
assert.equal(rhapsody.status, "scheduled");
assert.equal(derivePlanningAllAboard(rhapsody.departsAt), "17:30");

const cancelledDefault = listOfficialCruisePortCalls({
  from: "2026-08-05",
  through: "2026-08-05",
}).some((call) => call.shipName === "Celebrity Beyond");
assert.equal(cancelledDefault, false, "cancelled calls must be excluded by default");

const cancelledIncluded = listOfficialCruisePortCalls({
  from: "2026-08-05",
  through: "2026-08-05",
  includeCancelled: true,
}).find((call) => call.shipName === "Celebrity Beyond");
assert.equal(cancelledIncluded?.status, "cancelled");

const resolved = resolveOfficialPortCallContext({
  date: "2026-08-12",
  portId: "crown_bay",
  shipName: "Icon of the Seas",
});
assert.equal(
  resolved?.id,
  "2026-08-12_crown_bay_icon-of-the-seas",
  "canonical sailing context should resolve to the official call",
);

const offer: MerchantOfferBookingSnapshot = {
  offerId: "shore-stx-test",
  offerTitle: "West End Island Day",
  offerPriceCents: 12500,
  offerCompareAtCents: null,
  offerDepositCents: 2500,
  listingId: "operator-stx",
  listingName: "Test Island Operator",
  kind: "tour",
  island: "stx",
  validFrom: "2026-08-01",
  validThrough: "2026-09-30",
};

const profile: ShoreExcursionProfile = {
  offerId: offer.offerId,
  island: "stx",
  supportedPorts: ["frederiksted"],
  meetingPoint: "Outside the Frederiksted cruise pier security gate",
  durationMinutes: 180,
  minReturnBufferMinutes: 90,
  pickupIncluded: true,
  maxGuests: 8,
  mobilityNotes: null,
  accessibilityNotes: null,
};

const availability: ProviderAvailabilityDay = {
  date: "2026-08-06",
  isOpen: true,
  capacity: 10,
  startTime: "08:00",
  endTime: "17:00",
};

const fit = evaluateOfficialPortCallExcursionFit({
  call: rhapsody,
  offer,
  profile,
  availabilityDay: availability,
  reservedGuests: 4,
  partySize: 2,
});
assert.equal(fit.status, "available");
assert.equal(fit.earliestStartTime, "08:45");
assert.equal(fit.planningAllAboardTime, "17:30");
assert.equal(fit.safeReturnDeadline, "16:00");
assert.equal(fit.latestSafeStartTime, "13:00");
assert.equal(fit.remainingCapacity, 6);
assert.equal(fit.capacityVerified, true);

const soldOut = evaluateOfficialPortCallExcursionFit({
  call: rhapsody,
  offer,
  profile,
  availabilityDay: availability,
  reservedGuests: 10,
  partySize: 1,
});
assert.equal(soldOut.status, "sold_out");
assert.equal(soldOut.remainingCapacity, 0);

const closed = evaluateOfficialPortCallExcursionFit({
  call: rhapsody,
  offer,
  profile,
  availabilityDay: { ...availability, isOpen: false },
  reservedGuests: 0,
  partySize: 1,
});
assert.equal(closed.status, "provider_closed");

const unconfigured = evaluateOfficialPortCallExcursionFit({
  call: rhapsody,
  offer,
  profile,
  availabilityDay: null,
  reservedGuests: 0,
  partySize: 1,
});
assert.equal(unconfigured.status, "capacity_unconfigured");
assert.equal(unconfigured.capacityVerified, false);

const wrongPort = evaluateOfficialPortCallExcursionFit({
  call: { ...rhapsody, portId: "crown_bay", island: "stt" },
  offer,
  profile,
  availabilityDay: availability,
  reservedGuests: 0,
  partySize: 1,
});
assert.equal(wrongPort.status, "wrong_port");

const shortCall = getOfficialCruisePortCall(
  "2026-08-12_crown_bay_icon-of-the-seas",
);
assert.ok(shortCall);
const longStThomasProfile: ShoreExcursionProfile = {
  ...profile,
  offerId: "shore-stt-long",
  island: "stt",
  supportedPorts: ["crown_bay"],
  durationMinutes: 300,
  minReturnBufferMinutes: 120,
};
const stThomasOffer: MerchantOfferBookingSnapshot = {
  ...offer,
  offerId: longStThomasProfile.offerId,
  listingId: "operator-stt",
  island: "stt",
};
const shortWindow = evaluateOfficialPortCallExcursionFit({
  call: shortCall,
  offer: stThomasOffer,
  profile: longStThomasProfile,
  availabilityDay: {
    date: shortCall.date,
    isOpen: true,
    capacity: 20,
    startTime: "07:00",
    endTime: "18:00",
  },
  partySize: 2,
});
assert.equal(shortWindow.status, "time_conflict");

assert.equal(
  reservedGuestCount(
    [
      { startDate: "2026-08-06", status: "requested", adults: 2, children: 1 },
      { startDate: "2026-08-06", status: "confirmed", adults: 2, children: 0 },
      { startDate: "2026-08-06", status: "cancelled", adults: 9, children: 0 },
      { startDate: "2026-08-07", status: "requested", adults: 7, children: 0 },
    ],
    "2026-08-06",
  ),
  5,
  "only active capacity-holding requests on the same date should count",
);

console.log("Official cruise port-call and excursion matching tests passed.");
