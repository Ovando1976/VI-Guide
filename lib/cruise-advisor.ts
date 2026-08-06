export const CRUISE_DEPARTURE_PORTS = [
  "miami",
  "fort_lauderdale",
  "port_canaveral",
  "san_juan",
  "new_york",
  "other",
] as const;

export const CRUISE_DESTINATIONS = [
  "us_virgin_islands",
  "eastern_caribbean",
  "southern_caribbean",
  "western_caribbean",
  "bahamas",
  "open_to_recommendations",
] as const;

export const CRUISE_TRIP_LENGTHS = [
  "3_5_nights",
  "6_8_nights",
  "9_plus_nights",
  "flexible",
] as const;

export const CRUISE_CABIN_PREFERENCES = [
  "interior",
  "oceanview",
  "balcony",
  "suite",
  "best_value",
  "unsure",
] as const;

export const CRUISE_PRIORITIES = [
  "beaches",
  "food",
  "culture",
  "family",
  "nightlife",
  "relaxation",
  "adventure",
  "accessibility",
] as const;

export const CRUISE_REQUEST_STATUSES = [
  "new",
  "researching",
  "quoted",
  "customer_review",
  "booked",
  "closed",
] as const;

export type CruiseDeparturePort = (typeof CRUISE_DEPARTURE_PORTS)[number];
export type CruiseDestination = (typeof CRUISE_DESTINATIONS)[number];
export type CruiseTripLength = (typeof CRUISE_TRIP_LENGTHS)[number];
export type CruiseCabinPreference =
  (typeof CRUISE_CABIN_PREFERENCES)[number];
export type CruisePriority = (typeof CRUISE_PRIORITIES)[number];
export type CruiseRequestStatus = (typeof CRUISE_REQUEST_STATUSES)[number];

export type CruisePlanningRequestInput = {
  travelerName?: unknown;
  email?: unknown;
  phone?: unknown;
  departureWindowStart?: unknown;
  departureWindowEnd?: unknown;
  departurePort?: unknown;
  otherDeparturePort?: unknown;
  destinations?: unknown;
  adults?: unknown;
  children?: unknown;
  budgetDollars?: unknown;
  tripLength?: unknown;
  cabinPreference?: unknown;
  priorities?: unknown;
  accessibilityNotes?: unknown;
  celebration?: unknown;
  notes?: unknown;
  consent?: unknown;
  formStartedAt?: unknown;
  website?: unknown;
};

export type NormalizedCruisePlanningRequest = {
  travelerName: string;
  email: string;
  phone: string | null;
  departureWindowStart: string;
  departureWindowEnd: string;
  departurePort: CruiseDeparturePort;
  otherDeparturePort: string | null;
  destinations: CruiseDestination[];
  adults: number;
  children: number;
  budgetCents: number | null;
  tripLength: CruiseTripLength;
  cabinPreference: CruiseCabinPreference;
  priorities: CruisePriority[];
  accessibilityNotes: string | null;
  celebration: string | null;
  notes: string | null;
  consent: true;
  submittedAt: string;
};

export type CruisePlanningRequestValidation =
  | { ok: true; request: NormalizedCruisePlanningRequest }
  | { ok: false; error: string; spam?: boolean };

const STATUS_TRANSITIONS: Record<CruiseRequestStatus, CruiseRequestStatus[]> = {
  new: ["researching", "quoted", "closed"],
  researching: ["quoted", "closed"],
  quoted: ["customer_review", "booked", "researching", "closed"],
  customer_review: ["booked", "researching", "closed"],
  booked: ["closed"],
  closed: ["researching"],
};

export function normalizeCruisePlanningRequest(
  input: CruisePlanningRequestInput,
  now: Date = new Date(),
): CruisePlanningRequestValidation {
  if (clean(input.website, 160)) {
    return { ok: false, error: "Unable to submit this request.", spam: true };
  }

  const startedAt = normalizeDateTime(input.formStartedAt);
  const nowMs = now.getTime();
  const startedMs = startedAt ? Date.parse(startedAt) : Number.NaN;
  if (
    !Number.isFinite(startedMs) ||
    startedMs > nowMs + 5 * 60_000 ||
    nowMs - startedMs < 2_000 ||
    nowMs - startedMs > 24 * 60 * 60_000
  ) {
    return {
      ok: false,
      error: "Please refresh the page and complete the cruise request again.",
      spam: true,
    };
  }

  const travelerName = clean(input.travelerName, 140);
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);
  const departureWindowStart = normalizeDate(input.departureWindowStart);
  const departureWindowEnd = normalizeDate(input.departureWindowEnd);
  const departurePort = normalizeEnum(input.departurePort, CRUISE_DEPARTURE_PORTS);
  const otherDeparturePort = clean(input.otherDeparturePort, 120) || null;
  const destinations = normalizeMany(input.destinations, CRUISE_DESTINATIONS);
  const adults = normalizeInteger(input.adults, 1, 12);
  const children = normalizeInteger(input.children, 0, 12);
  const budgetCents = normalizeBudget(input.budgetDollars);
  const tripLength = normalizeEnum(input.tripLength, CRUISE_TRIP_LENGTHS);
  const cabinPreference = normalizeEnum(
    input.cabinPreference,
    CRUISE_CABIN_PREFERENCES,
  );
  const priorities = normalizeMany(input.priorities, CRUISE_PRIORITIES);
  const accessibilityNotes =
    cleanMultiline(input.accessibilityNotes, 900) || null;
  const celebration = clean(input.celebration, 160) || null;
  const notes = cleanMultiline(input.notes, 1400) || null;

  if (!travelerName) return invalid("Enter the primary traveler name.");
  if (!email) return invalid("Enter a valid email address.");
  if (clean(input.phone, 80) && !phone) {
    return invalid("Enter a valid phone number or leave it blank.");
  }
  if (!departureWindowStart || !departureWindowEnd) {
    return invalid("Choose a valid travel window.");
  }
  if (departureWindowEnd < departureWindowStart) {
    return invalid("The travel-window end date must be on or after the start date.");
  }
  if (departureWindowEnd < dateOnly(now)) {
    return invalid("Choose a future cruise travel window.");
  }
  if (daysBetween(departureWindowStart, departureWindowEnd) > 180) {
    return invalid("Keep the cruise travel window within 180 days.");
  }
  if (!departurePort) return invalid("Choose a preferred departure port.");
  if (departurePort === "other" && !otherDeparturePort) {
    return invalid("Enter the preferred departure city or port.");
  }
  if (!destinations.length) {
    return invalid("Choose at least one destination preference.");
  }
  if (adults === null || children === null) {
    return invalid("Enter a valid number of adult and child travelers.");
  }
  if (clean(input.budgetDollars, 40) && budgetCents === null) {
    return invalid("Enter a total cruise budget between $500 and $250,000.");
  }
  if (!tripLength) return invalid("Choose a preferred cruise length.");
  if (!cabinPreference) return invalid("Choose a cabin preference.");
  if (input.consent !== true) {
    return invalid("Consent is required before submitting the cruise request.");
  }

  return {
    ok: true,
    request: {
      travelerName,
      email,
      phone,
      departureWindowStart,
      departureWindowEnd,
      departurePort,
      otherDeparturePort: departurePort === "other" ? otherDeparturePort : null,
      destinations,
      adults,
      children,
      budgetCents,
      tripLength,
      cabinPreference,
      priorities,
      accessibilityNotes,
      celebration,
      notes,
      consent: true,
      submittedAt: now.toISOString(),
    },
  };
}

export function normalizeCruiseRequestStatus(
  value: unknown,
): CruiseRequestStatus | null {
  return normalizeEnum(value, CRUISE_REQUEST_STATUSES);
}

export function canTransitionCruiseRequest(current: unknown, next: unknown) {
  const currentStatus = normalizeCruiseRequestStatus(current);
  const nextStatus = normalizeCruiseRequestStatus(next);
  return Boolean(
    currentStatus &&
      nextStatus &&
      STATUS_TRANSITIONS[currentStatus].includes(nextStatus),
  );
}

export function normalizeCruiseAdvisorNote(value: unknown) {
  return cleanMultiline(value, 2000) || null;
}

export function humanizeCruiseValue(value: unknown) {
  return clean(value, 120)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function cruiseTerritoryDayKey(value: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/St_Thomas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${lookup.year}-${lookup.month}-${lookup.day}`;
}

function normalizeMany<const T extends readonly string[]>(
  value: unknown,
  allowed: T,
): T[number][] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((entry) => normalizeEnum(entry, allowed))
        .filter((entry): entry is T[number] => entry !== null),
    ),
  );
}

function normalizeBudget(value: unknown) {
  const text = clean(value, 40);
  if (!text) return null;
  const amount = Number(text.replace(/[$,\s]/g, ""));
  if (!Number.isFinite(amount) || amount < 500 || amount > 250_000) {
    return null;
  }
  return Math.round(amount * 100);
}

function normalizeInteger(value: unknown, minimum: number, maximum: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : null;
}

function normalizePhone(value: unknown) {
  const phone = clean(value, 80);
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15 ? phone : null;
}

function normalizeEmail(value: unknown) {
  const email = clean(value, 220).toLowerCase();
  return /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(email) ? email : "";
}

function normalizeDate(value: unknown) {
  const text = clean(value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const date = new Date(`${text}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === text
    ? text
    : null;
}

function normalizeDateTime(value: unknown) {
  const text = clean(value, 50);
  const parsed = Date.parse(text);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

function normalizeEnum<const T extends readonly string[]>(
  value: unknown,
  allowed: T,
): T[number] | null {
  return typeof value === "string" && allowed.includes(value as T[number])
    ? (value as T[number])
    : null;
}

function daysBetween(start: string, end: string) {
  return Math.round(
    (Date.parse(`${end}T00:00:00.000Z`) -
      Date.parse(`${start}T00:00:00.000Z`)) /
      86_400_000,
  );
}

function dateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function invalid(error: string): CruisePlanningRequestValidation {
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
  return typeof value === "string" || typeof value === "number"
    ? String(value).replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
