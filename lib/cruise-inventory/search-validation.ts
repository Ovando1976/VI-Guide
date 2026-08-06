import type { CruiseSearchRequest } from "@/lib/cruise-inventory/types";

export type CruiseSearchValidation =
  | { ok: true; request: CruiseSearchRequest }
  | { ok: false; error: string };

export function normalizeCruiseSearchRequest(
  input: Record<string, unknown>,
  now: Date = new Date(),
): CruiseSearchValidation {
  const departureDateFrom = normalizeDate(input.departureDateFrom);
  const departureDateTo = normalizeDate(input.departureDateTo);
  const departurePortIds = normalizeStringArray(input.departurePortIds, 12, 80);
  const destinationNames = normalizeStringArray(
    input.destinationNames,
    12,
    120,
  );
  const cruiseLineIds = normalizeStringArray(input.cruiseLineIds, 20, 80);
  const nightsMinimum = normalizeOptionalInteger(input.nightsMinimum, 1, 60);
  const nightsMaximum = normalizeOptionalInteger(input.nightsMaximum, 1, 60);
  const adults = normalizeInteger(input.adults, 1, 8);
  const childAges = normalizeChildAges(input.childAges);
  const currency = normalizeCurrency(input.currency) || "USD";
  const limit = normalizeOptionalInteger(input.limit, 1, 100) ?? 30;

  if (!departureDateFrom || !departureDateTo) {
    return invalid("Choose a valid cruise departure window.");
  }
  if (departureDateTo < departureDateFrom) {
    return invalid("The cruise search end date must follow the start date.");
  }
  if (departureDateTo < now.toISOString().slice(0, 10)) {
    return invalid("Choose a future cruise departure window.");
  }
  if (daysBetween(departureDateFrom, departureDateTo) > 365) {
    return invalid("Keep the cruise search window within 365 days.");
  }
  if (adults === null) {
    return invalid("Enter between one and eight adult travelers.");
  }
  if (childAges === null) {
    return invalid("Enter valid child ages from 0 through 17.");
  }
  if (
    nightsMinimum !== null &&
    nightsMaximum !== null &&
    nightsMaximum < nightsMinimum
  ) {
    return invalid("Maximum nights must be greater than minimum nights.");
  }

  return {
    ok: true,
    request: {
      departureDateFrom,
      departureDateTo,
      departurePortIds: departurePortIds.length ? departurePortIds : undefined,
      destinationNames: destinationNames.length
        ? destinationNames
        : undefined,
      cruiseLineIds: cruiseLineIds.length ? cruiseLineIds : undefined,
      nightsMinimum: nightsMinimum ?? undefined,
      nightsMaximum: nightsMaximum ?? undefined,
      adults,
      childAges,
      currency,
      limit,
    },
  };
}

function normalizeDate(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
    ? value
    : null;
}

function normalizeInteger(value: unknown, minimum: number, maximum: number) {
  const number = Number(value);
  return Number.isInteger(number) && number >= minimum && number <= maximum
    ? number
    : null;
}

function normalizeOptionalInteger(
  value: unknown,
  minimum: number,
  maximum: number,
) {
  if (value === undefined || value === null || value === "") return null;
  return normalizeInteger(value, minimum, maximum);
}

function normalizeChildAges(value: unknown) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > 8) return null;
  const ages = value.map((age) => Number(age));
  return ages.every((age) => Number.isInteger(age) && age >= 0 && age <= 17)
    ? ages
    : null;
}

function normalizeStringArray(
  value: unknown,
  maximumItems: number,
  maximumLength: number,
) {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.replace(/\s+/g, " ").trim().slice(0, maximumLength))
        .filter(Boolean),
    ),
  ).slice(0, maximumItems);
}

function normalizeCurrency(value: unknown) {
  if (typeof value !== "string") return null;
  const currency = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(currency) ? currency : null;
}

function daysBetween(start: string, end: string) {
  return Math.round(
    (Date.parse(`${end}T00:00:00.000Z`) -
      Date.parse(`${start}T00:00:00.000Z`)) /
      86_400_000,
  );
}

function invalid(error: string): CruiseSearchValidation {
  return { ok: false, error };
}
