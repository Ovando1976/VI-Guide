import type { CommerceBookingKind } from "@/types/commerce-booking";
import type { IntelligencePlanStop } from "@/types/intelligence";

export function buildTravelAdvisorBookingHref({
  shareId,
  date,
  stop,
}: {
  shareId: string;
  date: string;
  stop: IntelligencePlanStop;
}) {
  const sourceProposal = normalizeProposalShareId(shareId);
  const kind = bookingKindForProposalStop(stop);
  if (!sourceProposal || !kind) return null;

  const listingId = clean(stop.placeId || stop.id, 160);
  const listingName = clean(stop.title, 180);
  if (!listingId || !listingName) return null;

  const params = new URLSearchParams({
    kind,
    listingId,
    listingName,
    island: stop.island,
    sourceProposal,
  });
  const listingHref = safeInternalHref(stop.href);
  if (listingHref) params.set("listingHref", listingHref);
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) params.set("startDate", date);

  return `/book?${params.toString()}`;
}

export function bookingKindForProposalStop(
  stop: Pick<IntelligencePlanStop, "kind">,
): CommerceBookingKind | null {
  const kind = clean(stop.kind, 80).toLowerCase();
  if (!kind) return null;

  if (
    ["stay", "hotel", "resort", "villa", "lodging", "accommodation"].some(
      (token) => kind.includes(token),
    )
  ) {
    return "accommodation";
  }

  if (
    [
      "tour",
      "excursion",
      "charter",
      "cruise",
      "boat",
      "snorkel",
      "dive",
    ].some((token) => kind.includes(token))
  ) {
    return "tour";
  }

  if (
    ["experience", "activity", "attraction"].some((token) =>
      kind.includes(token),
    )
  ) {
    return "experience";
  }

  return null;
}

export function normalizeProposalShareId(value: unknown) {
  const id = clean(value, 40);
  return /^[a-zA-Z0-9]{12,40}$/.test(id) ? id : "";
}

export function proposalBookingEmailMatches(
  proposalEmail: unknown,
  bookingEmail: unknown,
) {
  const expected = clean(proposalEmail, 220).toLowerCase();
  const submitted = clean(bookingEmail, 220).toLowerCase();
  return Boolean(
    expected &&
      submitted &&
      /^\S+@\S+\.\S+$/.test(expected) &&
      /^\S+@\S+\.\S+$/.test(submitted) &&
      expected === submitted,
  );
}

function safeInternalHref(value: unknown) {
  const href = clean(value, 500);
  return href.startsWith("/") && !href.startsWith("//") ? href : "";
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
