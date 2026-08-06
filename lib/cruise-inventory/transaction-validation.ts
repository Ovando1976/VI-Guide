import type {
  CruiseCabinAvailabilityRequest,
  CruiseQuoteRequest,
} from "@/lib/cruise-inventory/types";

export type CruiseAvailabilityValidation =
  | { ok: true; request: CruiseCabinAvailabilityRequest }
  | { ok: false; error: string };

export type CruiseQuoteValidation =
  | { ok: true; request: CruiseQuoteRequest }
  | { ok: false; error: string };

export function normalizeCruiseAvailabilityRequest(
  input: Record<string, unknown>,
): CruiseAvailabilityValidation {
  const sailingId = normalizeId(input.sailingId);
  const adults = normalizeInteger(input.adults, 1, 8);
  const childAges = normalizeChildAges(input.childAges);
  const residencyCountryCode = normalizeCountryCode(
    input.residencyCountryCode,
  );
  const currency = normalizeCurrency(input.currency) || "USD";
  const accessibleCabinRequired = input.accessibleCabinRequired === true;

  if (!sailingId) return invalidAvailability("Choose a valid sailing.");
  if (adults === null) {
    return invalidAvailability("Enter between one and eight adult travelers.");
  }
  if (childAges === null) {
    return invalidAvailability("Enter valid child ages from 0 through 17.");
  }
  if (
    input.residencyCountryCode &&
    !residencyCountryCode
  ) {
    return invalidAvailability("Enter a valid two-letter residency country code.");
  }

  return {
    ok: true,
    request: {
      sailingId,
      adults,
      childAges,
      residencyCountryCode: residencyCountryCode ?? undefined,
      accessibleCabinRequired,
      currency,
    },
  };
}

export function normalizeCruiseQuoteRequest(
  input: Record<string, unknown>,
): CruiseQuoteValidation {
  const availability = normalizeCruiseAvailabilityRequest(input);
  if (!availability.ok) return availability;

  const cabinCategoryId = normalizeId(input.cabinCategoryId);
  const fareCode = normalizeOptionalText(input.fareCode, 120);
  const travelerResidencies = normalizeCountryCodes(input.travelerResidencies);

  if (!cabinCategoryId) {
    return { ok: false, error: "Choose a valid cabin category." };
  }
  if (travelerResidencies === null) {
    return {
      ok: false,
      error: "Enter valid two-letter traveler residency country codes.",
    };
  }

  return {
    ok: true,
    request: {
      ...availability.request,
      cabinCategoryId,
      fareCode: fareCode ?? undefined,
      travelerResidencies: travelerResidencies.length
        ? travelerResidencies
        : undefined,
    },
  };
}

export function normalizeProviderRecordId(value: unknown) {
  return normalizeId(value);
}

function normalizeId(value: unknown) {
  if (typeof value !== "string") return "";
  const id = value.trim().slice(0, 180);
  return /^[A-Za-z0-9._:-]+$/.test(id) ? id : "";
}

function normalizeInteger(value: unknown, minimum: number, maximum: number) {
  const number = Number(value);
  return Number.isInteger(number) && number >= minimum && number <= maximum
    ? number
    : null;
}

function normalizeChildAges(value: unknown) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > 8) return null;
  const ages = value.map((age) => Number(age));
  return ages.every((age) => Number.isInteger(age) && age >= 0 && age <= 17)
    ? ages
    : null;
}

function normalizeCurrency(value: unknown) {
  if (typeof value !== "string") return null;
  const currency = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(currency) ? currency : null;
}

function normalizeCountryCode(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

function normalizeCountryCodes(value: unknown) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > 16) return null;
  const codes = value.map(normalizeCountryCode);
  return codes.every((code): code is string => Boolean(code)) ? codes : null;
}

function normalizeOptionalText(value: unknown, maximumLength: number) {
  if (value === undefined || value === null || value === "") return null;
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maximumLength) || null
    : null;
}

function invalidAvailability(error: string): CruiseAvailabilityValidation {
  return { ok: false, error };
}
