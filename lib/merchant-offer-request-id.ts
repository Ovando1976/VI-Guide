import { createHash } from "node:crypto";

import { getUsviToday } from "@/lib/booking/booking-dates";

export type MerchantOfferRequestIdentityInput = {
  offerId: string;
  email: string;
  startDate: string;
  endDate?: string | null;
  preferredTime?: string | null;
  adults: number;
  children: number;
  now?: Date;
};

export function merchantOfferRequestDocumentId(
  input: MerchantOfferRequestIdentityInput,
) {
  const dayKey = getUsviToday(input.now ?? new Date());
  const fingerprint = createHash("sha256")
    .update(
      [
        normalize(input.offerId),
        normalize(input.email),
        normalize(input.startDate),
        normalize(input.endDate ?? ""),
        normalize(input.preferredTime ?? ""),
        normalizeCount(input.adults),
        normalizeCount(input.children),
        dayKey,
      ].join("|"),
    )
    .digest("hex");

  return `offer_request_${fingerprint.slice(0, 40)}`;
}

function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function normalizeCount(value: number) {
  return Number.isFinite(value) ? String(Math.max(0, Math.floor(value))) : "0";
}
