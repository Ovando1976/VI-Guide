import type {
  CommerceBookingKind,
  CommerceBookingStatus,
} from "@/types/commerce-booking";
import type { IntelligenceIsland } from "@/types/intelligence";

export type TravelerCommerceBooking = {
  id: string;
  reference: string;
  kind: CommerceBookingKind;
  listingName: string;
  listingHref: string | null;
  island: IntelligenceIsland;
  startDate: string;
  endDate: string | null;
  status: CommerceBookingStatus;
  paymentStatus: string;
  depositAmountCents: number;
  paidAmountCents: number;
  updatedAt: string;
};

export type TravelerStayRequest = {
  requestId: string;
  stayName: string;
  staySlug: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  rooms: number;
  status: string;
};

export type TravelerAdvisorTrip = {
  id: string;
  reference: string;
  status: string;
  island: IntelligenceIsland | null;
  arrival: string | null;
  departure: string | null;
  proposalTitle: string | null;
  proposalHref: string | null;
  proposalSentAt: string | null;
  updatedAt: string;
};

export type TravelerTripActionTone = "teal" | "amber" | "emerald" | "rose";

export type TravelerTripNextAction = {
  label: string;
  detail: string;
  href: string;
  cta: string;
  tone: TravelerTripActionTone;
};

export type TravelerTripSummary = {
  activeBookings: number;
  paymentRequired: number;
  confirmedBookings: number;
  paidAmountCents: number;
  nextAction: TravelerTripNextAction;
};

export function serializeTravelerCommerceBooking(
  id: string,
  data: Record<string, unknown>,
): TravelerCommerceBooking | null {
  const kind = normalizeKind(data.kind);
  const island = normalizeIsland(data.island);
  const status = normalizeStatus(data.status);
  const reference = clean(data.reference, 120);
  const listingName = clean(data.listingName, 180);
  const startDate = clean(data.startDate, 10);

  if (!kind || !island || !status || !reference || !listingName || !startDate) {
    return null;
  }

  return {
    id: clean(id, 180),
    reference,
    kind,
    listingName,
    listingHref: safeInternalHref(data.listingHref),
    island,
    startDate,
    endDate: clean(data.endDate, 10) || null,
    status,
    paymentStatus: clean(data.paymentStatus, 60) || "unpaid",
    depositAmountCents: nonNegativeMoney(data.depositAmountCents),
    paidAmountCents: nonNegativeMoney(data.paidAmountCents),
    updatedAt: clean(data.updatedAt, 50) || clean(data.createdAt, 50),
  };
}

export function serializeTravelerAdvisorTrip(
  id: string,
  data: Record<string, unknown>,
): TravelerAdvisorTrip | null {
  const reference = clean(data.reference, 120);
  if (!reference) return null;

  return {
    id: clean(id, 180),
    reference,
    status: clean(data.status, 40) || "new",
    island: normalizeIsland(data.island),
    arrival: clean(data.arrival, 10) || null,
    departure: clean(data.departure, 10) || null,
    proposalTitle: clean(data.proposalTitle, 180) || null,
    proposalHref: safeInternalHref(data.proposalHref),
    proposalSentAt: clean(data.proposalSentAt, 50) || null,
    updatedAt: clean(data.updatedAt, 50) || clean(data.createdAt, 50),
  };
}

export function summarizeTravelerTrip(input: {
  bookings: TravelerCommerceBooking[];
  advisorTrips?: TravelerAdvisorTrip[];
  stayRequests?: TravelerStayRequest[];
  journeyPlanCount?: number;
  journeyStopCount?: number;
}): TravelerTripSummary {
  const bookings = [...input.bookings].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
  const activeBookings = bookings.filter((booking) =>
    ["requested", "reviewing", "payment_required", "paid", "confirmed"].includes(
      booking.status,
    ),
  ).length;
  const paymentRequired = bookings.filter(
    (booking) => booking.status === "payment_required",
  ).length;
  const confirmedBookings = bookings.filter(
    (booking) => booking.status === "confirmed" || booking.status === "completed",
  ).length;
  const paidAmountCents = bookings.reduce(
    (total, booking) => total + booking.paidAmountCents,
    0,
  );

  return {
    activeBookings,
    paymentRequired,
    confirmedBookings,
    paidAmountCents,
    nextAction: resolveTravelerTripNextAction({
      bookings,
      advisorTrips: input.advisorTrips ?? [],
      stayRequests: input.stayRequests ?? [],
      journeyPlanCount: input.journeyPlanCount ?? 0,
      journeyStopCount: input.journeyStopCount ?? 0,
    }),
  };
}

export function resolveTravelerTripNextAction(input: {
  bookings: TravelerCommerceBooking[];
  advisorTrips: TravelerAdvisorTrip[];
  stayRequests: TravelerStayRequest[];
  journeyPlanCount: number;
  journeyStopCount: number;
}): TravelerTripNextAction {
  const payment = input.bookings.find(
    (booking) => booking.status === "payment_required",
  );
  if (payment) {
    return {
      label: "Payment ready",
      detail:
        payment.depositAmountCents > 0
          ? `${payment.listingName} is ready to secure with a ${formatMoney(payment.depositAmountCents)} deposit.`
          : `${payment.listingName} is ready for secure payment.`,
      href: bookingHref(payment.reference),
      cta: "Complete payment",
      tone: "amber",
    };
  }

  const unavailable = input.bookings.find(
    (booking) => booking.status === "declined" || booking.status === "cancelled",
  );
  if (unavailable) {
    return {
      label: "Choose an alternative",
      detail: `${unavailable.listingName} is no longer available in this booking flow. Concierge can help replace it without losing the rest of your trip.`,
      href: conciergeHref(
        `Help me replace ${unavailable.listingName} in my trip. Booking ${unavailable.reference} is ${unavailable.status}.`,
      ),
      cta: "Ask Concierge",
      tone: "rose",
    };
  }

  const paid = input.bookings.find((booking) => booking.status === "paid");
  if (paid) {
    return {
      label: "Payment received",
      detail: `${paid.listingName} is paid and waiting for the provider to finalize confirmation.`,
      href: bookingHref(paid.reference),
      cta: "Track confirmation",
      tone: "teal",
    };
  }

  const pending = input.bookings.find(
    (booking) => booking.status === "reviewing" || booking.status === "requested",
  );
  if (pending) {
    return {
      label: pending.status === "reviewing" ? "Provider review in progress" : "Request received",
      detail: `${pending.listingName} is ${
        pending.status === "reviewing" ? "being reviewed" : "waiting for review"
      }. USVI Explorer will keep the status connected to your trip.`,
      href: bookingHref(pending.reference),
      cta: "Check booking",
      tone: "teal",
    };
  }

  const proposal = [...input.advisorTrips]
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .find((trip) => trip.proposalHref && !["booked", "closed"].includes(trip.status));
  if (proposal?.proposalHref) {
    return {
      label: "Your advisor proposal is ready",
      detail: proposal.proposalTitle
        ? `Review ${proposal.proposalTitle} and request the parts you want USVI Explorer to book.`
        : "Review your advisor itinerary and request the parts you want USVI Explorer to book.",
      href: proposal.proposalHref,
      cta: "Review proposal",
      tone: "emerald",
    };
  }

  const confirmed = input.bookings.find((booking) => booking.status === "confirmed");
  if (confirmed) {
    return {
      label: "Build around your confirmed booking",
      detail: `${confirmed.listingName} is confirmed. Add transportation, meals, and nearby experiences around it.`,
      href: "/planner",
      cta: "Open My Trip",
      tone: "emerald",
    };
  }

  const stay = input.stayRequests.find((request) =>
    ["pending_property_confirmation", "reviewing"].includes(request.status),
  );
  if (stay) {
    return {
      label: "Stay request in progress",
      detail: `${stay.stayName} is still being reviewed. Keep planning while USVI Explorer follows the request.`,
      href: `/accommodations/${encodeURIComponent(stay.staySlug)}`,
      cta: "View stay",
      tone: "teal",
    };
  }

  if (input.journeyStopCount > 0 || input.journeyPlanCount > 0) {
    return {
      label: "Keep building your trip",
      detail: `You have ${input.journeyStopCount} saved ${
        input.journeyStopCount === 1 ? "stop" : "stops"
      } across ${input.journeyPlanCount} ${
        input.journeyPlanCount === 1 ? "day" : "days"
      }. Route, refine, and book the next piece.`,
      href: "/planner",
      cta: "Open My Trip",
      tone: "teal",
    };
  }

  return {
    label: "Start your Virgin Islands trip",
    detail: "Save places, build an itinerary, ask Concierge for local guidance, and request bookings from one connected trip workspace.",
    href: "/places",
    cta: "Start exploring",
    tone: "teal",
  };
}

export function travelerBookingStatusLabel(status: CommerceBookingStatus) {
  switch (status) {
    case "requested":
      return "Request received";
    case "reviewing":
      return "Under review";
    case "payment_required":
      return "Payment required";
    case "paid":
      return "Payment received";
    case "confirmed":
      return "Confirmed";
    case "completed":
      return "Completed";
    case "declined":
      return "Unavailable";
    case "cancelled":
      return "Cancelled";
    case "draft":
    default:
      return "Draft";
  }
}

export function bookingHref(reference: string) {
  const normalized = clean(reference, 120).toUpperCase();
  return normalized
    ? `/bookings?reference=${encodeURIComponent(normalized)}`
    : "/bookings";
}

function conciergeHref(prompt: string) {
  return `/concierge?prompt=${encodeURIComponent(clean(prompt, 500))}`;
}

function normalizeKind(value: unknown): CommerceBookingKind | null {
  return value === "accommodation" || value === "tour" || value === "experience"
    ? value
    : null;
}

function normalizeIsland(value: unknown): IntelligenceIsland | null {
  return value === "stt" || value === "stj" || value === "stx" ? value : null;
}

function normalizeStatus(value: unknown): CommerceBookingStatus | null {
  return value === "draft" ||
    value === "requested" ||
    value === "reviewing" ||
    value === "payment_required" ||
    value === "paid" ||
    value === "confirmed" ||
    value === "completed" ||
    value === "declined" ||
    value === "cancelled"
    ? value
    : null;
}

function safeInternalHref(value: unknown) {
  const href = clean(value, 500);
  return href.startsWith("/") && !href.startsWith("//") ? href : null;
}

function nonNegativeMoney(value: unknown) {
  const amount = Number(value);
  return Number.isInteger(amount) && amount >= 0 ? amount : 0;
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
