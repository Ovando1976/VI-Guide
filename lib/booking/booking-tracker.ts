import {
  isBookableEndDate,
  isIsoCalendarDate,
} from "@/lib/booking/booking-dates";
import {
  buildBookingPlannerHref,
  createBookingJourneyPlan,
  type BookingPlannerHandoff,
} from "@/lib/booking/booking-planner-handoff";
import {
  readJourneyPlans,
  upsertJourneyPlan,
  type JourneyPlan,
} from "@/lib/journey-planner";
import { safeInternalDestinationOrNull } from "@/lib/safe-internal-destination";
import type {
  CommerceBookingKind,
  CommerceCancellationPolicy,
  CommerceCancellationRequestStatus,
  CommercePriceBreakdown,
  CommerceBookingStatus,
} from "@/types/commerce-booking";
import type { IntelligenceIsland } from "@/types/intelligence";

export const TRACKED_BOOKINGS_STORAGE_KEY = "vi-guide.commerce-bookings.v1";
export const TRACKED_BOOKINGS_UPDATED_EVENT =
  "vi-guide-commerce-bookings-updated";

const MAX_TRACKED_BOOKINGS = 8;
const REFERENCE_PATTERN = /^VI-(STAY|TOUR|EXP)-[A-Z0-9-]{6,64}$/;
const KIND_PREFIX: Record<CommerceBookingKind, "STAY" | "TOUR" | "EXP"> = {
  accommodation: "STAY",
  tour: "TOUR",
  experience: "EXP",
};

export type TrackedBooking = BookingPlannerHandoff & {
  bookingId: string;
  email: string;
  status: CommerceBookingStatus;
  updatedAt: string;
};

export type BookingStatusSnapshot = {
  id: string;
  reference: string;
  status: CommerceBookingStatus;
  kind: CommerceBookingKind;
  listingId: string;
  listingName: string;
  listingHref?: string | null;
  island: IntelligenceIsland;
  startDate: string;
  endDate: string | null;
  preferredTime: string | null;
  adults: number;
  children: number;
  updatedAt: string;
  paymentStatus: string | null;
  refundStatus: string | null;
  refundAmountCents: number;
  refundRequestedAt: string | null;
  refundUpdatedAt: string | null;
  merchantNote?: string | null;
  proposedTime?: string | null;
  depositAmountCents: number;
  paidAmountCents: number;
  priceBreakdown?: CommercePriceBreakdown | null;
  cancellationPolicy?: CommerceCancellationPolicy | null;
  cancellationRequestStatus?: CommerceCancellationRequestStatus;
  cancellationReasonCode?: string | null;
  cancellationRequestedAt?: string | null;
  cancellationResolvedAt?: string | null;
  cancellationRefundEstimateCents?: number;
  paymentHref?: string | null;
};

export function normalizeTrackedBooking(value: unknown): TrackedBooking | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<TrackedBooking>;
  const kind = normalizeKind(candidate.kind);
  const island = normalizeIsland(candidate.island);
  const reference = normalizeReference(candidate.reference);
  const referenceMatch = reference.match(REFERENCE_PATTERN);
  const bookingId = clean(candidate.bookingId, 180);
  const email = clean(candidate.email, 220).toLowerCase();
  const listingId = clean(candidate.listingId, 160);
  const listingName = clean(candidate.listingName, 180);
  const startDate = clean(candidate.startDate, 10);
  const endDate = clean(candidate.endDate, 10);
  const status = normalizeStatus(candidate.status);
  const updatedAt = normalizeTimestamp(candidate.updatedAt);
  const listingHref = safeInternalDestinationOrNull(
    clean(candidate.listingHref, 500) || null,
    "https://vi-guide.local",
  );

  if (
    !kind ||
    !island ||
    !referenceMatch ||
    referenceMatch[1] !== KIND_PREFIX[kind] ||
    !bookingId ||
    !/^\S+@\S+\.\S+$/.test(email) ||
    !listingId ||
    !listingName ||
    !isIsoCalendarDate(startDate) ||
    !status
  ) {
    return null;
  }

  if (kind === "accommodation" && !isBookableEndDate(startDate, endDate)) {
    return null;
  }

  return {
    bookingId,
    reference,
    email,
    status,
    kind,
    island,
    listingId,
    listingName,
    startDate,
    updatedAt,
    ...(kind === "accommodation" ? { endDate } : {}),
    ...(listingHref ? { listingHref } : {}),
  };
}

export function mergeTrackedBookings(
  bookings: unknown[],
  nextBooking: unknown,
): TrackedBooking[] {
  const next = normalizeTrackedBooking(nextBooking);
  const normalized = bookings
    .map(normalizeTrackedBooking)
    .filter(isTrackedBooking);

  const merged = next
    ? [next, ...normalized.filter((item) => item.reference !== next.reference)]
    : normalized;

  return merged
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, MAX_TRACKED_BOOKINGS);
}

export function readTrackedBookings(): TrackedBooking[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(TRACKED_BOOKINGS_STORAGE_KEY) ?? "[]",
    );
    return Array.isArray(parsed) ? mergeTrackedBookings(parsed, null) : [];
  } catch {
    return [];
  }
}

export function rememberTrackedBooking(value: unknown): TrackedBooking | null {
  if (typeof window === "undefined") return normalizeTrackedBooking(value);
  const normalized = normalizeTrackedBooking(value);
  if (!normalized) return null;

  try {
    const bookings = mergeTrackedBookings(readTrackedBookings(), normalized);
    window.localStorage.setItem(
      TRACKED_BOOKINGS_STORAGE_KEY,
      JSON.stringify(bookings),
    );
    window.dispatchEvent(new Event(TRACKED_BOOKINGS_UPDATED_EVENT));
  } catch {
    // A private browsing policy or full storage quota should never block booking.
  }

  return normalized;
}

export function findTrackedBooking(reference?: string | null) {
  const normalizedReference = normalizeReference(reference);
  const bookings = readTrackedBookings();
  return normalizedReference
    ? bookings.find((booking) => booking.reference === normalizedReference) ?? null
    : bookings[0] ?? null;
}

export function forgetTrackedBooking(reference: string) {
  if (typeof window === "undefined") return;
  const normalizedReference = normalizeReference(reference);
  try {
    const remaining = readTrackedBookings().filter(
      (booking) => booking.reference !== normalizedReference,
    );
    window.localStorage.setItem(
      TRACKED_BOOKINGS_STORAGE_KEY,
      JSON.stringify(remaining),
    );
    window.dispatchEvent(new Event(TRACKED_BOOKINGS_UPDATED_EVENT));
  } catch {
    // Keep the customer flow usable when local storage is unavailable.
  }
}

export function bookingStatusToTrackedBooking(
  booking: BookingStatusSnapshot,
  email: string,
): TrackedBooking | null {
  return normalizeTrackedBooking({
    bookingId: booking.id,
    reference: booking.reference,
    email,
    status: booking.status,
    kind: booking.kind,
    island: booking.island,
    listingId: booking.listingId,
    listingName: booking.listingName,
    startDate: booking.startDate,
    endDate: booking.endDate ?? undefined,
    listingHref: booking.listingHref ?? undefined,
    updatedAt: booking.updatedAt,
  });
}

export function buildBookingStatusHref(reference: string) {
  const normalizedReference = normalizeReference(reference);
  if (!REFERENCE_PATTERN.test(normalizedReference)) return "/bookings";
  return `/bookings?reference=${encodeURIComponent(normalizedReference)}`;
}

export function buildTrackedBookingPlannerHref(booking: BookingStatusSnapshot) {
  return buildBookingPlannerHref(statusSnapshotToHandoff(booking));
}

export function syncBookingJourneyWithStatus(
  booking: BookingStatusSnapshot,
): JourneyPlan | null {
  if (typeof window === "undefined") return null;
  const existing = readJourneyPlans().find(
    (plan) => plan.id === journeyPlanIdForReference(booking.reference),
  );
  const synchronized = createSynchronizedBookingJourneyPlan(
    booking,
    existing ?? null,
  );
  if (!synchronized) return null;
  upsertJourneyPlan(synchronized);
  return synchronized;
}

export function createSynchronizedBookingJourneyPlan(
  booking: BookingStatusSnapshot,
  existing: JourneyPlan | null,
  now: Date = new Date(),
): JourneyPlan | null {
  const handoff = statusSnapshotToHandoff(booking);
  const base = createBookingJourneyPlan(handoff, now);
  const bookingStop = base.plan[0];
  if (!bookingStop) return null;

  const statusDetail = bookingStatusDetail(booking.status);
  const dates = booking.endDate
    ? `${booking.startDate} through ${booking.endDate}`
    : booking.startDate;
  const updatedBookingStop = {
    ...bookingStop,
    summary: `Booking ${booking.reference} is ${statusDetail.summary} for ${dates}. ${statusDetail.nextStep}`,
    bookingHref: buildBookingStatusHref(booking.reference),
  };
  const existingStops = existing?.plan ?? [];
  const hasBookingStop = existingStops.some(
    (stop) => stop.id === updatedBookingStop.id,
  );
  const synchronizedStops = hasBookingStop
    ? existingStops.map((stop) =>
        stop.id === updatedBookingStop.id ? updatedBookingStop : stop,
      )
    : [updatedBookingStop, ...existingStops];
  const userNotes = extractUserNotes(existing?.notes ?? "", booking.reference);
  const systemNotes = [
    `Booking ${booking.reference} status: ${statusDetail.label}.`,
    statusDetail.nextStep,
    booking.status === "confirmed" || booking.status === "completed"
      ? "This reservation is confirmed in VI Guide. Continue organizing transportation, meals, and nearby activities around it."
      : "Do not treat availability as confirmed until the status reaches Confirmed.",
  ].join("\n\n");

  return {
    ...base,
    ...(existing ?? {}),
    island: base.island,
    date: base.date,
    updatedAt: now.toISOString(),
    status:
      booking.status === "confirmed" || booking.status === "completed"
        ? "ready"
        : "draft",
    notes: userNotes ? `${systemNotes}\n\n${userNotes}` : systemNotes,
    plan: synchronizedStops,
  };
}

function statusSnapshotToHandoff(
  booking: BookingStatusSnapshot,
): BookingPlannerHandoff {
  return {
    reference: booking.reference,
    kind: booking.kind,
    island: booking.island,
    listingId: booking.listingId,
    listingName: booking.listingName,
    startDate: booking.startDate,
    ...(booking.kind === "accommodation" && booking.endDate
      ? { endDate: booking.endDate }
      : {}),
    ...(booking.listingHref ? { listingHref: booking.listingHref } : {}),
  };
}

function bookingStatusDetail(status: CommerceBookingStatus) {
  switch (status) {
    case "reviewing":
      return {
        label: "Under review",
        summary: "under review",
        nextStep: "VI Guide is checking availability and request details.",
      };
    case "payment_required":
      return {
        label: "Payment required",
        summary: "awaiting payment",
        nextStep: "Open the booking status page to complete the secure deposit.",
      };
    case "paid":
      return {
        label: "Payment received",
        summary: "paid but awaiting final confirmation",
        nextStep: "The provider still needs to finalize the reservation.",
      };
    case "confirmed":
      return {
        label: "Confirmed",
        summary: "confirmed",
        nextStep: "The reservation is ready to anchor the rest of your trip.",
      };
    case "completed":
      return {
        label: "Completed",
        summary: "completed",
        nextStep: "The booking has been fulfilled.",
      };
    case "declined":
      return {
        label: "Unavailable",
        summary: "unavailable",
        nextStep: "Ask Concierge to replace this stop with an available option.",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        summary: "cancelled",
        nextStep: "Remove or replace this stop before relying on the itinerary.",
      };
    case "draft":
      return {
        label: "Draft",
        summary: "still a draft",
        nextStep: "Submit the booking request before relying on this stop.",
      };
    case "requested":
    default:
      return {
        label: "Request received",
        summary: "received and awaiting review",
        nextStep: "VI Guide will update this itinerary as the request progresses.",
      };
  }
}

function extractUserNotes(notes: string, reference: string) {
  const systemStarts = [
    `Booking ${reference} status:`,
    `Created from VI Guide booking request ${reference}.`,
  ];
  const genericSystemParagraphs = new Set([
    "The request is still under review and is not a confirmed reservation.",
    "Use this journey to organize the rest of the day without treating availability or payment as confirmed.",
    "Do not treat availability as confirmed until the status reaches Confirmed.",
    "This reservation is confirmed in VI Guide. Continue organizing transportation, meals, and nearby activities around it.",
  ]);

  return notes
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .filter(
      (paragraph) =>
        !systemStarts.some((prefix) => paragraph.startsWith(prefix)) &&
        !genericSystemParagraphs.has(paragraph) &&
        !paragraph.startsWith("VI Guide is checking availability") &&
        !paragraph.startsWith("Open the booking status page") &&
        !paragraph.startsWith("The provider still needs") &&
        !paragraph.startsWith("The reservation is ready") &&
        !paragraph.startsWith("The booking has been fulfilled") &&
        !paragraph.startsWith("Ask Concierge to replace") &&
        !paragraph.startsWith("Remove or replace this stop") &&
        !paragraph.startsWith("Submit the booking request") &&
        !paragraph.startsWith("VI Guide will update this itinerary"),
    )
    .join("\n\n");
}

function journeyPlanIdForReference(reference: string) {
  return `booking-${reference
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`.slice(0, 160);
}

function normalizeReference(value: unknown) {
  return clean(value, 80).replace(/\s+/g, "").toUpperCase();
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

function normalizeTimestamp(value: unknown) {
  if (typeof value !== "string") return new Date(0).toISOString();
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp)
    ? new Date(timestamp).toISOString()
    : new Date(0).toISOString();
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}

function isTrackedBooking(value: TrackedBooking | null): value is TrackedBooking {
  return value !== null;
}
