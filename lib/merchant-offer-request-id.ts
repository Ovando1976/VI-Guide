import { createHash } from "node:crypto";

import { getUsviToday } from "@/lib/booking/booking-dates";

export const MAX_MERCHANT_OFFER_REQUESTS_PER_EMAIL_DAY = 10;

export type MerchantOfferRequestIdentityInput = {
  offerId: string;
  email: string;
  startDate: string;
  endDate?: string | null;
  preferredTime?: string | null;
  adults: number;
  children: number;
  offerPriceCents: number;
  offerDepositCents?: number | null;
  now?: Date;
};

export function merchantOfferRequestDocumentId(
  input: MerchantOfferRequestIdentityInput,
) {
  const dayKey = getUsviToday(input.now ?? new Date());
  const fingerprint = sha256(
    [
      normalize(input.offerId),
      normalize(input.email),
      normalize(input.startDate),
      normalize(input.endDate ?? ""),
      normalize(input.preferredTime ?? ""),
      normalizeCount(input.adults),
      normalizeCount(input.children),
      normalizeMoney(input.offerPriceCents),
      normalizeMoney(input.offerDepositCents ?? 0),
      dayKey,
    ].join("|"),
  );

  return `offer_request_${fingerprint.slice(0, 40)}`;
}

export function merchantOfferRequestQuotaDocumentId(input: {
  email: string;
  now?: Date;
}) {
  const dayKey = getUsviToday(input.now ?? new Date());
  const fingerprint = sha256(`${normalize(input.email)}|${dayKey}`);
  return `offer_email_${fingerprint.slice(0, 40)}`;
}

export function merchantOfferRequestQuotaAllows(
  currentCount: unknown,
  maximum = MAX_MERCHANT_OFFER_REQUESTS_PER_EMAIL_DAY,
) {
  const count = Number.isFinite(Number(currentCount))
    ? Math.max(0, Math.floor(Number(currentCount)))
    : 0;
  const limit = Number.isFinite(maximum)
    ? Math.max(1, Math.floor(maximum))
    : MAX_MERCHANT_OFFER_REQUESTS_PER_EMAIL_DAY;
  return count < limit;
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function normalizeCount(value: number) {
  return Number.isFinite(value) ? String(Math.max(0, Math.floor(value))) : "0";
}

function normalizeMoney(value: number) {
  return Number.isFinite(value) ? String(Math.max(0, Math.floor(value))) : "0";
}
