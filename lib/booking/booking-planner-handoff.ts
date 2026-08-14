import { isBookableEndDate, isIsoCalendarDate } from "@/lib/booking/booking-dates";
import { safeInternalDestinationOrNull } from "@/lib/safe-internal-destination";
import type { JourneyPlan } from "@/lib/journey-planner";
import type { CommerceBookingKind } from "@/types/commerce-booking";
import type { IntelligenceIsland, IntelligencePlanStop } from "@/types/intelligence";

export type BookingPlannerHandoff = {
  reference: string;
  kind: CommerceBookingKind;
  island: IntelligenceIsland;
  listingId: string;
  listingName: string;
  startDate: string;
  endDate?: string;
  listingHref?: string;
};

type SearchParamsReader = Pick<URLSearchParams, "get">;

const REFERENCE_PATTERN = /^VI-(STAY|TOUR|EXP)-[A-Z0-9-]{6,64}$/;
const KIND_PREFIX: Record<CommerceBookingKind, "STAY" | "TOUR" | "EXP"> = {
  accommodation: "STAY",
  tour: "TOUR",
  experience: "EXP",
};

export function buildBookingPlannerHref(input: BookingPlannerHandoff) {
  const handoff = normalizeBookingPlannerHandoff(input);
  if (!handoff) return "/planner";

  const params = new URLSearchParams({
    source: "booking",
    reference: handoff.reference,
    kind: handoff.kind,
    island: handoff.island,
    listingId: handoff.listingId,
    listingName: handoff.listingName,
    startDate: handoff.startDate,
  });

  if (handoff.endDate) params.set("endDate", handoff.endDate);
  if (handoff.listingHref) params.set("listingHref", handoff.listingHref);

  return `/planner?${params.toString()}`;
}

export function parseBookingPlannerHandoff(
  searchParams: SearchParamsReader,
): BookingPlannerHandoff | null {
  if (searchParams.get("source") !== "booking") return null;

  return normalizeBookingPlannerHandoff({
    reference: searchParams.get("reference") ?? "",
    kind: searchParams.get("kind") as CommerceBookingKind,
    island: searchParams.get("island") as IntelligenceIsland,
    listingId: searchParams.get("listingId") ?? "",
    listingName: searchParams.get("listingName") ?? "",
    startDate: searchParams.get("startDate") ?? "",
    endDate: searchParams.get("endDate") ?? undefined,
    listingHref: searchParams.get("listingHref") ?? undefined,
  });
}

export function createBookingJourneyPlan(
  handoff: BookingPlannerHandoff,
  now: Date = new Date(),
): JourneyPlan {
  const normalized = normalizeBookingPlannerHandoff(handoff);
  if (!normalized) {
    throw new Error("Invalid booking planner handoff.");
  }

  const timestamp = now.toISOString();
  const referenceSlug = slug(normalized.reference);
  const listingSlug = slug(normalized.listingId) || "request";
  const stop: IntelligencePlanStop = {
    id: `booking-stop-${referenceSlug}-${listingSlug}`.slice(0, 160),
    placeId: normalized.listingId,
    title: normalized.listingName,
    island: normalized.island,
    kind: normalized.kind,
    summary: bookingStopSummary(normalized),
    ...(normalized.listingHref ? { href: normalized.listingHref } : {}),
  };

  return {
    id: `booking-${referenceSlug}`.slice(0, 160),
    title: `Plan around ${normalized.listingName}`.slice(0, 120),
    island: normalized.island,
    date: normalized.startDate,
    createdAt: timestamp,
    updatedAt: timestamp,
    status: "draft",
    notes: bookingPlanNotes(normalized),
    plan: [stop],
  };
}

function normalizeBookingPlannerHandoff(
  input: BookingPlannerHandoff,
): BookingPlannerHandoff | null {
  const kind = normalizeKind(input.kind);
  const island = normalizeIsland(input.island);
  const reference = clean(input.reference, 80)
    .replace(/\s+/g, "")
    .toUpperCase();
  const listingId = clean(input.listingId, 160);
  const listingName = clean(input.listingName, 180);
  const startDate = clean(input.startDate, 10);
  const endDate = clean(input.endDate, 10);
  const listingHref = safeInternalDestinationOrNull(
    clean(input.listingHref, 500) || null,
    "https://vi-guide.local",
  );

  const referenceMatch = reference.match(REFERENCE_PATTERN);
  if (
    !kind ||
    !island ||
    !referenceMatch ||
    referenceMatch[1] !== KIND_PREFIX[kind] ||
    !listingId ||
    !listingName ||
    !isIsoCalendarDate(startDate)
  ) {
    return null;
  }

  if (kind === "accommodation" && !isBookableEndDate(startDate, endDate)) {
    return null;
  }

  return {
    reference,
    kind,
    island,
    listingId,
    listingName,
    startDate,
    ...(kind === "accommodation" ? { endDate } : {}),
    ...(listingHref ? { listingHref } : {}),
  };
}

function bookingStopSummary(handoff: BookingPlannerHandoff) {
  const dates = handoff.endDate
    ? `${handoff.startDate} through ${handoff.endDate}`
    : handoff.startDate;
  return `Booking request ${handoff.reference} is under review for ${dates}. Add transportation, meals, beaches, and nearby activities around this request.`;
}

function bookingPlanNotes(handoff: BookingPlannerHandoff) {
  return [
    `Created from USVI Explorer booking request ${handoff.reference}.`,
    "The request is still under review and is not a confirmed reservation.",
    "Use this journey to organize the rest of the day without treating availability or payment as confirmed.",
  ].join("\n\n");
}

function normalizeKind(value: unknown): CommerceBookingKind | null {
  return value === "accommodation" || value === "tour" || value === "experience"
    ? value
    : null;
}

function normalizeIsland(value: unknown): IntelligenceIsland | null {
  return value === "stt" || value === "stj" || value === "stx" ? value : null;
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
