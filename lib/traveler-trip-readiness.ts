import type {
  TravelerAdvisorTrip,
  TravelerCommerceBooking,
  TravelerStayRequest,
} from "@/lib/traveler-trip-command";
import type { IntelligenceActiveTrip } from "@/types/intelligence";

export type TravelerTripReadinessStatus =
  | "ready"
  | "attention"
  | "blocked"
  | "planning"
  | "past";

export type TravelerTripReadinessItemStatus =
  | "done"
  | "attention"
  | "blocked"
  | "pending";

export type TravelerTripReadinessItem = {
  id: string;
  label: string;
  detail: string;
  status: TravelerTripReadinessItemStatus;
  href: string;
};

export type TravelerTripReadiness = {
  status: TravelerTripReadinessStatus;
  score: number;
  tripDate: string | null;
  daysUntilTrip: number | null;
  summary: string;
  items: TravelerTripReadinessItem[];
  blockerCount: number;
  attentionCount: number;
  paymentRequiredCount: number;
  confirmedBookingCount: number;
  unresolvedBookingCount: number;
};

export function evaluateTravelerTripReadiness(input: {
  activeTrip?: IntelligenceActiveTrip | null;
  bookings: TravelerCommerceBooking[];
  advisorTrips?: TravelerAdvisorTrip[];
  stayRequests?: TravelerStayRequest[];
  now?: Date;
}): TravelerTripReadiness {
  const now = input.now ?? new Date();
  const today = territoryDate(now);
  const activeTrip = input.activeTrip ?? null;
  const bookings = input.bookings ?? [];
  const advisorTrips = input.advisorTrips ?? [];
  const stayRequests = input.stayRequests ?? [];
  const tripDate = resolveTripDate({
    activeTrip,
    bookings,
    advisorTrips,
    stayRequests,
    today,
  });
  const daysUntilTrip = tripDate ? isoDayDifference(today, tripDate) : null;
  const isPast = daysUntilTrip !== null && daysUntilTrip < 0;

  if (isPast) {
    return {
      status: "past",
      score: 100,
      tripDate,
      daysUntilTrip,
      summary:
        "This trip date has passed. Keep the history for reference or start a new VI Guide trip.",
      items: [
        {
          id: "past-trip",
          label: "Trip complete",
          detail: "Start a new itinerary when you are ready for the next Virgin Islands trip.",
          status: "done",
          href: "/planner",
        },
      ],
      blockerCount: 0,
      attentionCount: 0,
      paymentRequiredCount: 0,
      confirmedBookingCount: bookings.filter(isConfirmedBooking).length,
      unresolvedBookingCount: 0,
    };
  }

  const items: TravelerTripReadinessItem[] = [];
  let penalty = 0;

  if (!activeTrip) {
    const urgent = daysUntilTrip !== null && daysUntilTrip <= 7;
    items.push({
      id: "itinerary",
      label: "Build the itinerary",
      detail: urgent
        ? "Travel is close, but My Trip does not yet have a synchronized itinerary. Add the important stops now."
        : "Add the places, timing, and transportation you want VI Guide to protect as one trip.",
      status: urgent ? "attention" : "pending",
      href: "/planner",
    });
    penalty += urgent ? 35 : 25;
  } else if (!activeTrip.stops.length) {
    items.push({
      id: "itinerary",
      label: "Add trip stops",
      detail: "The trip exists, but it has no stops yet. Add the places that need timing, routing, or booking context.",
      status: "attention",
      href: "/planner",
    });
    penalty += 20;
  } else if (activeTrip.status !== "ready") {
    items.push({
      id: "itinerary",
      label: "Review the itinerary",
      detail: `${activeTrip.stops.length} ${activeTrip.stops.length === 1 ? "stop is" : "stops are"} synchronized, but the plan is still marked draft.`,
      status: "attention",
      href: "/planner",
    });
    penalty += 5;
  } else {
    items.push({
      id: "itinerary",
      label: "Itinerary connected",
      detail: `${activeTrip.stops.length} ${activeTrip.stops.length === 1 ? "stop is" : "stops are"} synchronized with VI Guide trip intelligence.`,
      status: "done",
      href: "/planner",
    });
  }

  const paymentRequired = bookings.filter(
    (booking) => booking.status === "payment_required",
  );
  const unavailable = bookings.filter(
    (booking) => booking.status === "declined" || booking.status === "cancelled",
  );
  const pending = bookings.filter(
    (booking) => booking.status === "requested" || booking.status === "reviewing",
  );
  const paidAwaitingConfirmation = bookings.filter(
    (booking) => booking.status === "paid",
  );
  const confirmed = bookings.filter(isConfirmedBooking);
  const unresolvedBookingCount =
    paymentRequired.length +
    unavailable.length +
    pending.length +
    paidAwaitingConfirmation.length;

  if (bookings.length) {
    if (unavailable.length) {
      const booking = unavailable[0];
      items.push({
        id: "booking-availability",
        label: "Replace unavailable booking",
        detail: `${booking.listingName} is ${booking.status}. Do not rely on it as part of the trip until it is replaced or rebooked.`,
        status: "blocked",
        href: conciergeHref(
          `Help me replace ${booking.listingName} in My Trip. Booking ${booking.reference} is ${booking.status}.`,
        ),
      });
      penalty += 30;
    }

    if (paymentRequired.length) {
      const booking = paymentRequired[0];
      items.push({
        id: "payment",
        label: "Complete required payment",
        detail:
          booking.depositAmountCents > 0
            ? `${booking.listingName} is waiting on a ${formatMoney(booking.depositAmountCents)} required payment before the flow can progress.`
            : `${booking.listingName} is waiting on secure payment before the flow can progress.`,
        status: "blocked",
        href: bookingHref(booking.reference),
      });
      penalty += 25;
    } else if (paidAwaitingConfirmation.length) {
      const booking = paidAwaitingConfirmation[0];
      items.push({
        id: "payment",
        label: "Payment received",
        detail: `${booking.listingName} is paid, but provider confirmation is still pending.`,
        status: "attention",
        href: bookingHref(booking.reference),
      });
      penalty += 8;
    } else if (confirmed.length) {
      items.push({
        id: "payment",
        label: "Booking payment state clear",
        detail: `${confirmed.length} ${confirmed.length === 1 ? "booking is" : "bookings are"} confirmed or completed in VI Guide records.`,
        status: "done",
        href: "/bookings",
      });
    } else {
      items.push({
        id: "payment",
        label: "No payment due yet",
        detail: "The current booking requests have not reached a payment-required state.",
        status: "pending",
        href: "/bookings",
      });
    }

    if (pending.length) {
      const booking = pending[0];
      items.push({
        id: "booking-review",
        label: "Booking review in progress",
        detail: `${booking.listingName} is ${booking.status === "reviewing" ? "under provider review" : "waiting for review"}. Availability is not confirmed yet.`,
        status: "attention",
        href: bookingHref(booking.reference),
      });
      penalty += Math.min(20, pending.length * 10);
    } else if (paidAwaitingConfirmation.length) {
      const booking = paidAwaitingConfirmation[0];
      items.push({
        id: "booking-review",
        label: "Final confirmation pending",
        detail: `${booking.listingName} has payment recorded but is not yet marked confirmed.`,
        status: "attention",
        href: bookingHref(booking.reference),
      });
    } else if (confirmed.length) {
      items.push({
        id: "booking-review",
        label: "Confirmed trip anchors",
        detail: `${confirmed.length} confirmed or completed ${confirmed.length === 1 ? "booking is" : "bookings are"} connected to My Trip.`,
        status: "done",
        href: "/bookings",
      });
    }
  }

  const activeStayRequests = stayRequests.filter(
    (stay) => !["confirmed", "declined", "cancelled"].includes(stay.status),
  );
  const blockedStay = stayRequests.find(
    (stay) => stay.status === "declined" || stay.status === "cancelled",
  );
  if (blockedStay) {
    items.push({
      id: "stay-request",
      label: "Stay needs an alternative",
      detail: `${blockedStay.stayName} is not available in the current request. Replace it before relying on the stay plan.`,
      status: "blocked",
      href: "/accommodations",
    });
    penalty += 20;
  } else if (activeStayRequests.length) {
    const stay = activeStayRequests[0];
    items.push({
      id: "stay-request",
      label: "Stay request still moving",
      detail: `${stay.stayName} is still awaiting property confirmation or review.`,
      status: "attention",
      href: `/accommodations/${encodeURIComponent(stay.staySlug)}`,
    });
    penalty += 8;
  } else if (stayRequests.some((stay) => stay.status === "confirmed")) {
    items.push({
      id: "stay-request",
      label: "Stay confirmed",
      detail: "The connected stay request is marked confirmed in VI Guide records.",
      status: "done",
      href: "/accommodations",
    });
  }

  const latestAdvisorTrip = [...advisorTrips]
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
  if (latestAdvisorTrip && !["booked", "closed"].includes(latestAdvisorTrip.status)) {
    if (latestAdvisorTrip.proposalHref) {
      items.push({
        id: "advisor",
        label: "Advisor proposal available",
        detail: latestAdvisorTrip.proposalTitle
          ? `${latestAdvisorTrip.proposalTitle} is ready to review alongside the rest of My Trip.`
          : "Your Travel Advisor proposal is ready to review alongside the rest of My Trip.",
        status: "done",
        href: latestAdvisorTrip.proposalHref,
      });
    } else {
      items.push({
        id: "advisor",
        label: "Advisor planning in progress",
        detail: "Your Travel Advisor request is active, but a traveler proposal has not been published yet.",
        status: "pending",
        href: "/trip-planning",
      });
      penalty += 8;
    }
  }

  if (daysUntilTrip !== null && daysUntilTrip <= 2 && unresolvedBookingCount > 0) {
    penalty += 10;
  }

  if (!tripDate) penalty = Math.max(penalty, 55);

  const score = clamp(100 - penalty, 0, 100);
  const blockerCount = items.filter((item) => item.status === "blocked").length;
  const attentionCount = items.filter(
    (item) => item.status === "attention" || item.status === "pending",
  ).length;
  const status = resolveStatus({
    tripDate,
    daysUntilTrip,
    activeTrip,
    blockerCount,
    attentionCount,
    score,
  });

  return {
    status,
    score,
    tripDate,
    daysUntilTrip,
    summary: readinessSummary({
      status,
      daysUntilTrip,
      blockerCount,
      attentionCount,
    }),
    items,
    blockerCount,
    attentionCount,
    paymentRequiredCount: paymentRequired.length,
    confirmedBookingCount: confirmed.length,
    unresolvedBookingCount,
  };
}

export function travelerTripReadinessLabel(status: TravelerTripReadinessStatus) {
  if (status === "ready") return "Ready to monitor";
  if (status === "blocked") return "Action required";
  if (status === "attention") return "Needs attention";
  if (status === "past") return "Past trip";
  return "Planning";
}

function resolveStatus(input: {
  tripDate: string | null;
  daysUntilTrip: number | null;
  activeTrip: IntelligenceActiveTrip | null;
  blockerCount: number;
  attentionCount: number;
  score: number;
}): TravelerTripReadinessStatus {
  if (!input.tripDate) return "planning";
  if (input.blockerCount > 0) return "blocked";
  if (
    !input.activeTrip ||
    !input.activeTrip.stops.length ||
    input.attentionCount > 0 ||
    input.score < 80
  ) {
    return input.daysUntilTrip !== null && input.daysUntilTrip <= 7
      ? "attention"
      : "planning";
  }
  return "ready";
}

function readinessSummary(input: {
  status: TravelerTripReadinessStatus;
  daysUntilTrip: number | null;
  blockerCount: number;
  attentionCount: number;
}) {
  if (input.status === "blocked") {
    return `${input.blockerCount} trip ${input.blockerCount === 1 ? "blocker needs" : "blockers need"} action before you rely on the current plan.`;
  }
  if (input.status === "attention") {
    return input.daysUntilTrip === 0
      ? "Travel is today. Resolve the open items and keep checking live conditions before moving."
      : `Travel is ${input.daysUntilTrip} ${input.daysUntilTrip === 1 ? "day" : "days"} away and ${input.attentionCount} ${input.attentionCount === 1 ? "item needs" : "items need"} review.`;
  }
  if (input.status === "ready") {
    return input.daysUntilTrip === 0
      ? "The core VI Guide trip records are in good shape for today. Keep checking live conditions and provider instructions."
      : `The core VI Guide trip records are in good shape with ${input.daysUntilTrip} ${input.daysUntilTrip === 1 ? "day" : "days"} to go.`;
  }
  return input.daysUntilTrip === null
    ? "Add travel dates and an itinerary so VI Guide can turn this into a readiness check."
    : "The trip is still taking shape. Finish the open planning items before treating it as ready.";
}

function resolveTripDate(input: {
  activeTrip: IntelligenceActiveTrip | null;
  bookings: TravelerCommerceBooking[];
  advisorTrips: TravelerAdvisorTrip[];
  stayRequests: TravelerStayRequest[];
  today: string;
}) {
  const candidates = [
    input.activeTrip?.date ?? "",
    ...input.bookings.map((booking) => booking.startDate),
    ...input.advisorTrips.map((trip) => trip.arrival ?? ""),
    ...input.stayRequests.map((stay) => stay.checkIn),
  ].filter(isIsoDate);
  if (!candidates.length) return null;
  const upcoming = candidates.filter((date) => date >= input.today).sort();
  if (upcoming.length) return upcoming[0];
  return [...candidates].sort().at(-1) ?? null;
}

function isConfirmedBooking(booking: TravelerCommerceBooking) {
  return booking.status === "confirmed" || booking.status === "completed";
}

function bookingHref(reference: string) {
  return `/bookings?reference=${encodeURIComponent(reference)}`;
}

function conciergeHref(prompt: string) {
  return `/concierge?open=true&prompt=${encodeURIComponent(prompt)}`;
}

function territoryDate(value: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/St_Thomas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${lookup.year}-${lookup.month}-${lookup.day}`;
}

function isoDayDifference(from: string, to: string) {
  const fromTime = Date.parse(`${from}T12:00:00Z`);
  const toTime = Date.parse(`${to}T12:00:00Z`);
  if (!Number.isFinite(fromTime) || !Number.isFinite(toTime)) return null;
  return Math.round((toTime - fromTime) / 86_400_000);
}

function isIsoDate(value: string): value is string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.max(0, cents) / 100);
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, Math.round(value)));
}
