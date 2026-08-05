import type { AppRole } from "@/lib/auth-server";

export type MerchantOfferListingIdentity = {
  listingId: string;
  listingName: string;
};

export function resolveMerchantOfferListingIdentity(input: {
  role: AppRole;
  listingId: unknown;
  requestedName: unknown;
}): MerchantOfferListingIdentity | null {
  const listingId = clean(input.listingId, 160);
  if (!listingId || (input.role !== "merchant" && input.role !== "admin")) {
    return null;
  }

  const derivedName = humanizeListingId(listingId);
  const requestedName = clean(input.requestedName, 180);
  return {
    listingId,
    listingName:
      input.role === "merchant" ? derivedName : requestedName || derivedName,
  };
}

export function humanizeOfferListingId(value: unknown) {
  const listingId = clean(value, 160);
  return listingId
    ? listingId
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "VI Guide business";
}

function humanizeListingId(value: string) {
  return humanizeOfferListingId(value);
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
