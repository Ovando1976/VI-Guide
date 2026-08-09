import type { CommercePriceBreakdown } from "@/types/commerce-booking";

const MONEY_KEYS = [
  "baseCents",
  "taxesCents",
  "serviceFeesCents",
  "propertyFeesCents",
  "transportCents",
  "otherMandatoryFeesCents",
] as const;

export type TrueTripPriceInput = Partial<
  Record<(typeof MONEY_KEYS)[number], unknown>
>;

export function resolveTrueTripPrice(
  input: TrueTripPriceInput,
  verifiedAt = new Date().toISOString(),
): CommercePriceBreakdown | null {
  const values = MONEY_KEYS.map((key) => wholeCents(input[key]));
  if (values.some((value) => value === null)) return null;

  const [
    baseCents,
    taxesCents,
    serviceFeesCents,
    propertyFeesCents,
    transportCents,
    otherMandatoryFeesCents,
  ] = values as number[];
  if (baseCents <= 0 || !validTimestamp(verifiedAt)) return null;

  return {
    currency: "USD",
    baseCents,
    taxesCents,
    serviceFeesCents,
    propertyFeesCents,
    transportCents,
    otherMandatoryFeesCents,
    totalCents:
      baseCents + taxesCents + serviceFeesCents + propertyFeesCents +
      transportCents + otherMandatoryFeesCents,
    verifiedAt,
  };
}

export function normalizeTrueTripPrice(
  value: unknown,
): CommercePriceBreakdown | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as TrueTripPriceInput & {
    currency?: unknown;
    totalCents?: unknown;
    verifiedAt?: unknown;
  };
  if (candidate.currency !== "USD" || typeof candidate.verifiedAt !== "string") {
    return null;
  }
  const normalized = resolveTrueTripPrice(candidate, candidate.verifiedAt);
  return normalized && normalized.totalCents === wholeCents(candidate.totalCents)
    ? normalized
    : null;
}

function wholeCents(value: unknown) {
  return Number.isSafeInteger(value) && Number(value) >= 0 && Number(value) <= 100_000_000
    ? Number(value)
    : null;
}

function validTimestamp(value: string) {
  return Boolean(value && Number.isFinite(Date.parse(value)));
}
