import assert from "node:assert/strict";

import {
  buildTravelerTripScopes,
  plansForTravelerTripScope,
  resolveTravelerTripScope,
  scopeTravelerTripRecords,
} from "../lib/traveler-trip-scope";
import type { JourneyPlan } from "../lib/journey-planner";
import type { TrackedBooking } from "../lib/booking/booking-tracker";
import type {
  TravelerAdvisorTrip,
  TravelerCommerceBooking,
  TravelerStayRequest,
} from "../lib/traveler-trip-command";

function plan(
  id: string,
  date: string,
  island: "stt" | "stj" | "stx",
  title: string,
): JourneyPlan {
  return {
    id,
    title,
    island,
    date,
    createdAt: `${date}T12:00:00.000Z`,
    updatedAt: `${date}T12:00:00.000Z`,
    status: "ready",
    notes: "",
    plan: [
      {
        id: `${id}_stop`,
        title: `${title} stop`,
        island,
        kind: "place",
        summary: "Trip-scoping fixture",
      },
    ],
  };
}

const plans = [
  plan("old_stt", "2026-05-02", "stt", "Old St. Thomas trip"),
  plan("aug_10_stt", "2026-08-10", "stt", "Arrival day"),
  plan("aug_11_stj", "2026-08-11", "stj", "St. John day"),
  plan("aug_13_stt", "2026-08-13", "stt", "Departure day"),
  plan("winter_stx", "2026-12-20", "stx", "Winter St. Croix trip"),
];

const scopes = buildTravelerTripScopes(plans);
assert.equal(scopes.length, 3);

const augustScope = resolveTravelerTripScope(scopes, "aug_11_stj", "2026-08-07");
assert.ok(augustScope);
assert.deepEqual(augustScope.planIds, ["aug_10_stt", "aug_11_stj", "aug_13_stt"]);
assert.equal(augustScope.startDate, "2026-08-10");
assert.equal(augustScope.endDate, "2026-08-13");
assert.deepEqual(augustScope.islands, ["stt", "stj"]);
assert.equal(augustScope.stopCount, 3);
assert.deepEqual(
  plansForTravelerTripScope(plans, augustScope).map((item) => item.id),
  ["aug_10_stt", "aug_11_stj", "aug_13_stt"],
);

const defaultUpcoming = resolveTravelerTripScope(scopes, "", "2026-08-07");
assert.equal(defaultUpcoming?.primaryPlanId, "aug_10_stt");
const selectedWinter = resolveTravelerTripScope(scopes, "winter_stx", "2026-08-07");
assert.equal(selectedWinter?.startDate, "2026-12-20");

const bookings: TravelerCommerceBooking[] = [
  {
    id: "booking_aug_stay",
    reference: "VI-STAY-AUGUST1",
    kind: "accommodation",
    listingName: "August Stay",
    listingHref: "/accommodations/august-stay",
    island: "stt",
    startDate: "2026-08-09",
    endDate: "2026-08-14",
    status: "payment_required",
    paymentStatus: "unpaid",
    depositAmountCents: 25000,
    paidAmountCents: 0,
    updatedAt: "2026-08-07T12:00:00.000Z",
  },
  {
    id: "booking_aug_stj",
    reference: "VI-TOUR-AUGUST2",
    kind: "tour",
    listingName: "August St. John Tour",
    listingHref: "/experiences/august-tour",
    island: "stj",
    startDate: "2026-08-11",
    endDate: null,
    status: "confirmed",
    paymentStatus: "paid",
    depositAmountCents: 0,
    paidAmountCents: 12000,
    updatedAt: "2026-08-07T12:00:00.000Z",
  },
  {
    id: "booking_old",
    reference: "VI-TOUR-OLDTRIP",
    kind: "tour",
    listingName: "Old Tour",
    listingHref: "/experiences/old-tour",
    island: "stt",
    startDate: "2026-05-02",
    endDate: null,
    status: "declined",
    paymentStatus: "unpaid",
    depositAmountCents: 0,
    paidAmountCents: 0,
    updatedAt: "2026-05-02T12:00:00.000Z",
  },
  {
    id: "booking_wrong_island",
    reference: "VI-TOUR-WRONGISLAND",
    kind: "tour",
    listingName: "St. Croix Tour",
    listingHref: "/experiences/stx-tour",
    island: "stx",
    startDate: "2026-08-11",
    endDate: null,
    status: "confirmed",
    paymentStatus: "paid",
    depositAmountCents: 0,
    paidAmountCents: 9000,
    updatedAt: "2026-08-07T12:00:00.000Z",
  },
];

const stays: TravelerStayRequest[] = [
  {
    requestId: "stay_aug",
    stayName: "August Villa",
    staySlug: "august-villa",
    checkIn: "2026-08-09",
    checkOut: "2026-08-15",
    adults: 2,
    children: 0,
    rooms: 1,
    status: "reviewing",
  },
  {
    requestId: "stay_old",
    stayName: "Old Villa",
    staySlug: "old-villa",
    checkIn: "2026-05-01",
    checkOut: "2026-05-04",
    adults: 2,
    children: 0,
    rooms: 1,
    status: "declined",
  },
];

const advisorTrips: TravelerAdvisorTrip[] = [
  {
    id: "advisor_aug",
    reference: "VI-TRIP-AUG",
    status: "planned",
    island: "stt",
    arrival: "2026-08-09",
    departure: "2026-08-15",
    proposalTitle: "August plan",
    proposalHref: "/shared-trip/august",
    proposalSentAt: "2026-08-07T12:00:00.000Z",
    updatedAt: "2026-08-07T12:00:00.000Z",
  },
  {
    id: "advisor_old",
    reference: "VI-TRIP-OLD",
    status: "closed",
    island: "stt",
    arrival: "2026-05-01",
    departure: "2026-05-04",
    proposalTitle: "Old plan",
    proposalHref: "/shared-trip/old",
    proposalSentAt: "2026-05-01T12:00:00.000Z",
    updatedAt: "2026-05-01T12:00:00.000Z",
  },
];

const tracked: TrackedBooking[] = [
  {
    bookingId: "tracked_aug",
    email: "traveler@example.com",
    status: "requested",
    reference: "VI-TOUR-TRACKEDAUG",
    kind: "tour",
    island: "stt",
    listingId: "tracked-aug",
    listingName: "Tracked August Tour",
    startDate: "2026-08-12",
    updatedAt: "2026-08-07T12:00:00.000Z",
  },
  {
    bookingId: "tracked_old",
    email: "traveler@example.com",
    status: "requested",
    reference: "VI-TOUR-TRACKEDOLD",
    kind: "tour",
    island: "stt",
    listingId: "tracked-old",
    listingName: "Tracked Old Tour",
    startDate: "2026-05-02",
    updatedAt: "2026-05-02T12:00:00.000Z",
  },
];

const scoped = scopeTravelerTripRecords({
  scope: augustScope,
  bookings,
  stayRequests: stays,
  advisorTrips,
  trackedBookings: tracked,
});
assert.deepEqual(
  scoped.bookings.map((booking) => booking.id),
  ["booking_aug_stay", "booking_aug_stj"],
);
assert.deepEqual(scoped.stayRequests.map((stay) => stay.requestId), ["stay_aug"]);
assert.deepEqual(scoped.advisorTrips.map((trip) => trip.id), ["advisor_aug"]);
assert.deepEqual(
  scoped.trackedBookings.map((booking) => booking.bookingId),
  ["tracked_aug"],
);
assert.equal(
  scoped.bookings.some((booking) => booking.reference === "VI-TOUR-OLDTRIP"),
  false,
);

console.log("Traveler trip scoping tests passed.");
