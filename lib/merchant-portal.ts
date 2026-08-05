import {
  addCalendarDays,
  getUsviToday,
} from "@/lib/booking/booking-dates";
import { normalizeManagedListingIds } from "@/lib/merchant-access";
import type { ProviderAvailabilityDay } from "@/types/provider-operations";

export type MerchantListingSelectionInput = {
  requestedListingId?: unknown;
  managedListingIds?: unknown;
  restricted: boolean;
};

export function resolveMerchantListingSelection({
  requestedListingId,
  managedListingIds,
  restricted,
}: MerchantListingSelectionInput) {
  const requested = cleanListingId(requestedListingId);
  if (!restricted) return requested;

  const managed = normalizeManagedListingIds(managedListingIds);
  return requested && managed.includes(requested) ? requested : managed[0] ?? "";
}

export function humanizeListingId(value: unknown) {
  const listingId = cleanListingId(value);
  if (!listingId) return "Assigned business";

  return listingId
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function buildProviderAvailabilityDays(
  capacity: number,
  today: string = getUsviToday(),
): ProviderAvailabilityDay[] {
  const normalizedCapacity = Number.isFinite(capacity)
    ? Math.max(0, Math.min(500, Math.round(capacity)))
    : 10;

  return Array.from({ length: 14 }, (_, index) => ({
    date: addCalendarDays(today, index),
    isOpen: true,
    capacity: normalizedCapacity,
    startTime: "09:00",
    endTime: "17:00",
  }));
}

function cleanListingId(value: unknown) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, 160)
    : "";
}
