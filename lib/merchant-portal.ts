import { normalizeManagedListingIds } from "@/lib/merchant-access";

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

function cleanListingId(value: unknown) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, 160)
    : "";
}
