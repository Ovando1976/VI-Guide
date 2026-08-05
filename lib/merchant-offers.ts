import type { AppRole } from "@/lib/auth-server";
import type { CommerceBookingKind } from "@/types/commerce-booking";
import type { IntelligenceIsland } from "@/types/intelligence";

export const MERCHANT_OFFER_STATUSES = [
  "draft",
  "active",
  "paused",
  "archived",
] as const;

export type MerchantOfferStatus = (typeof MERCHANT_OFFER_STATUSES)[number];

export type MerchantOfferInput = {
  listingId?: unknown;
  listingName?: unknown;
  kind?: unknown;
  island?: unknown;
  title?: unknown;
  summary?: unknown;
  inclusions?: unknown;
  terms?: unknown;
  priceCents?: unknown;
  compareAtCents?: unknown;
  depositCents?: unknown;
  validFrom?: unknown;
  validThrough?: unknown;
};

export type NormalizedMerchantOffer = {
  listingId: string;
  listingName: string;
  kind: CommerceBookingKind;
  island: IntelligenceIsland;
  title: string;
  summary: string;
  inclusions: string | null;
  terms: string | null;
  priceCents: number;
  compareAtCents: number | null;
  depositCents: number | null;
  validFrom: string;
  validThrough: string;
};

export type MerchantOfferValidation =
  | { ok: true; offer: NormalizedMerchantOffer }
  | { ok: false; error: string };

const OFFER_KINDS: CommerceBookingKind[] = [
  "accommodation",
  "tour",
  "experience",
];
const OFFER_ISLANDS: IntelligenceIsland[] = ["stt", "stj", "stx"];

const OFFER_TRANSITIONS: Record<MerchantOfferStatus, MerchantOfferStatus[]> = {
  draft: ["active", "archived"],
  active: ["paused", "archived"],
  paused: ["active", "archived"],
  archived: [],
};

export function normalizeMerchantOffer(
  input: MerchantOfferInput,
  now: Date = new Date(),
): MerchantOfferValidation {
  const listingId = clean(input.listingId, 160);
  const listingName = clean(input.listingName, 180);
  const kind = normalizeKind(input.kind);
  const island = normalizeIsland(input.island);
  const title = clean(input.title, 120);
  const summary = cleanMultiline(input.summary, 700);
  const inclusions = cleanMultiline(input.inclusions, 1400) || null;
  const terms = cleanMultiline(input.terms, 1400) || null;
  const priceCents = normalizeMoney(input.priceCents, 500, 1_000_000);
  const compareAtCents = normalizeOptionalMoney(
    input.compareAtCents,
    500,
    1_000_000,
  );
  const depositCents = normalizeOptionalMoney(
    input.depositCents,
    100,
    1_000_000,
  );
  const validFrom = normalizeDateKey(input.validFrom);
  const validThrough = normalizeDateKey(input.validThrough);
  const today = merchantOfferToday(now);

  if (!listingId) return invalid("Choose the VI Guide listing for this offer.");
  if (!listingName) return invalid("Enter the public listing name.");
  if (!kind) return invalid("Choose an offer type.");
  if (!island) return invalid("Choose the offer island.");
  if (title.length < 8) return invalid("Enter an offer title with at least 8 characters.");
  if (summary.length < 30) {
    return invalid("Describe the offer in at least 30 characters.");
  }
  if (!priceCents) return invalid("Enter a price between $5 and $10,000.");
  if (compareAtCents !== null && compareAtCents <= priceCents) {
    return invalid("The original price must be greater than the offer price.");
  }
  if (depositCents !== null && depositCents > priceCents) {
    return invalid("The deposit cannot exceed the offer price.");
  }
  if (!validFrom || !validThrough) {
    return invalid("Choose valid offer start and end dates.");
  }
  if (validFrom < today) {
    return invalid("The offer start date cannot be before today in the USVI.");
  }
  if (validThrough < validFrom) {
    return invalid("The offer end date cannot be before its start date.");
  }
  if (calendarDayDistance(validFrom, validThrough) > 730) {
    return invalid("An offer cannot remain open for more than two years.");
  }

  return {
    ok: true,
    offer: {
      listingId,
      listingName,
      kind,
      island,
      title,
      summary,
      inclusions,
      terms,
      priceCents,
      compareAtCents,
      depositCents,
      validFrom,
      validThrough,
    },
  };
}

export function normalizeMerchantOfferStatus(
  value: unknown,
): MerchantOfferStatus | null {
  return typeof value === "string" &&
    MERCHANT_OFFER_STATUSES.includes(value as MerchantOfferStatus)
    ? (value as MerchantOfferStatus)
    : null;
}

export function canTransitionMerchantOffer(
  current: unknown,
  next: unknown,
) {
  const currentStatus = normalizeMerchantOfferStatus(current);
  const nextStatus = normalizeMerchantOfferStatus(next);
  return Boolean(
    currentStatus &&
      nextStatus &&
      (currentStatus === nextStatus ||
        OFFER_TRANSITIONS[currentStatus].includes(nextStatus)),
  );
}

export function merchantOfferListingAllowed(input: {
  role: AppRole;
  listingIds?: string[] | null;
  listingId: unknown;
}) {
  const listingId = clean(input.listingId, 160);
  if (!listingId) return false;
  if (input.role === "admin") return true;
  if (input.role !== "merchant") return false;
  return new Set((input.listingIds ?? []).map((value) => clean(value, 160))).has(
    listingId,
  );
}

export function merchantOfferPublicState(
  input: {
    status?: unknown;
    validFrom?: unknown;
    validThrough?: unknown;
  },
  now: Date = new Date(),
) {
  if (normalizeMerchantOfferStatus(input.status) !== "active") {
    return "unavailable" as const;
  }
  const validFrom = normalizeDateKey(input.validFrom);
  const validThrough = normalizeDateKey(input.validThrough);
  if (!validFrom || !validThrough) return "unavailable" as const;
  const today = merchantOfferToday(now);
  if (today < validFrom) return "scheduled" as const;
  if (today > validThrough) return "expired" as const;
  return "live" as const;
}

export function merchantOfferToday(now: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/St_Thomas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function normalizeMerchantOfferId(value: unknown) {
  const id = clean(value, 160);
  return /^[A-Za-z0-9_-]{6,160}$/.test(id) ? id : "";
}

export function formatMerchantOfferMoney(cents: unknown) {
  const amount = Number(cents);
  if (!Number.isInteger(amount) || amount < 0) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: amount % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount / 100);
}

function normalizeKind(value: unknown): CommerceBookingKind | null {
  return typeof value === "string" &&
    OFFER_KINDS.includes(value as CommerceBookingKind)
    ? (value as CommerceBookingKind)
    : null;
}

function normalizeIsland(value: unknown): IntelligenceIsland | null {
  return typeof value === "string" &&
    OFFER_ISLANDS.includes(value as IntelligenceIsland)
    ? (value as IntelligenceIsland)
    : null;
}

function normalizeMoney(value: unknown, minimum: number, maximum: number) {
  const amount = Number(value);
  return Number.isInteger(amount) && amount >= minimum && amount <= maximum
    ? amount
    : null;
}

function normalizeOptionalMoney(
  value: unknown,
  minimum: number,
  maximum: number,
) {
  if (value === null || value === undefined || value === "") return null;
  return normalizeMoney(value, minimum, maximum);
}

function normalizeDateKey(value: unknown) {
  const date = clean(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && isRealDate(date) ? date : "";
}

function calendarDayDistance(start: string, end: string) {
  return Math.round(
    (Date.parse(`${end}T00:00:00.000Z`) -
      Date.parse(`${start}T00:00:00.000Z`)) /
      86_400_000,
  );
}

function isRealDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function invalid(error: string): MerchantOfferValidation {
  return { ok: false, error };
}

function cleanMultiline(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value
        .replace(/\r\n?/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
        .slice(0, maxLength)
    : "";
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
