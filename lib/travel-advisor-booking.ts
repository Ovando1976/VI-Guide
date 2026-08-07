import type { CommerceBookingKind } from "@/types/commerce-booking";
import type { IntelligencePlanStop } from "@/types/intelligence";

export function normalizeTravelProposalShareId(value: unknown) {
  const shareId = clean(value, 40).toLowerCase();
  return /^[a-f0-9]{24}$/.test(shareId) ? shareId : "";
}

export function normalizeTravelRequestId(value: unknown) {
  const requestId = clean(value, 80);
  return /^travel_[a-f0-9]{32}$/.test(requestId) ? requestId : "";
}

export function proposalBookingEmailMatches(
  proposalEmail: unknown,
  bookingEmail: unknown,
) {
  const proposal = clean(proposalEmail, 220).toLowerCase();
  const booking = clean(bookingEmail, 220).toLowerCase();
  return Boolean(proposal && booking && proposal === booking);
}

export function proposalCommerceKind(value: unknown): CommerceBookingKind | null {
  const normalized = clean(value, 80).toLowerCase();
  if (
    ["stay", "hotel", "resort", "villa", "accommodation", "lodging"].includes(
      normalized,
    )
  ) {
    return "accommodation";
  }
  if (
    ["tour", "shore-excursion", "shore_excursion", "excursion"].includes(
      normalized,
    )
  ) {
    return "tour";
  }
  if (
    ["experience", "activity", "attraction", "adventure"].includes(normalized)
  ) {
    return "experience";
  }
  return null;
}

export function buildTravelProposalBookingHref({
  stop,
  shareId,
  planDate,
  arrival,
  departure,
  travelers,
}: {
  stop: IntelligencePlanStop;
  shareId: string;
  planDate: string;
  arrival?: string | null;
  departure?: string | null;
  travelers?: number | null;
}) {
  const normalizedShareId = normalizeTravelProposalShareId(shareId);
  const kind = proposalCommerceKind(stop.kind);
  if (!normalizedShareId || !kind) return "";

  const listingId = clean(stop.placeId || stop.id, 160);
  const listingName = clean(stop.title, 180);
  if (!listingId || !listingName) return "";

  const params = new URLSearchParams({
    kind,
    listingId,
    listingName,
    island: stop.island,
    adults: String(clampInteger(travelers, 1, 20, 2)),
    proposal: normalizedShareId,
  });
  const listingHref = safeInternalHref(stop.href);
  if (listingHref) params.set("listingHref", listingHref);

  const normalizedPlanDate = normalizeDate(planDate);
  const normalizedArrival = normalizeDate(arrival);
  const normalizedDeparture = normalizeDate(departure);
  if (kind === "accommodation") {
    const startDate = normalizedArrival || normalizedPlanDate;
    if (startDate) params.set("startDate", startDate);
    if (startDate && normalizedDeparture && normalizedDeparture > startDate) {
      params.set("endDate", normalizedDeparture);
    }
  } else if (normalizedPlanDate) {
    params.set("startDate", normalizedPlanDate);
  }

  return `/book?${params.toString()}`;
}

function normalizeDate(value: unknown) {
  const date = clean(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "";
}

function safeInternalHref(value: unknown) {
  const href = clean(value, 500);
  return href.startsWith("/") && !href.startsWith("//") ? href : "";
}

function clampInteger(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number,
) {
  const number = Number(value);
  if (!Number.isInteger(number)) return fallback;
  return Math.max(minimum, Math.min(maximum, number));
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
