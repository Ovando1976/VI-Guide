export const TRAVEL_REQUEST_STATUSES = [
  "new",
  "reviewing",
  "planned",
  "contacted",
  "booked",
  "closed",
] as const;

export type TravelRequestStatus = (typeof TRAVEL_REQUEST_STATUSES)[number];

export const TRAVEL_ISLANDS = ["not_sure", "stt", "stj", "stx", "multi"] as const;
export const TRAVEL_BUDGETS = ["value", "comfort", "premium", "luxury", "flexible"] as const;
export const TRAVEL_STAY_STATUSES = [
  "need_help",
  "already_booked",
  "compare_options",
  "villa",
  "hotel",
] as const;
export const TRAVEL_PACES = ["relaxed", "balanced", "packed"] as const;
export const TRAVEL_INTERESTS = [
  "beaches",
  "food",
  "culture_history",
  "boating_cruises",
  "relaxation",
  "transportation",
] as const;

export type TravelPlanningRequest = {
  travelerName: string;
  email: string;
  phone: string | null;
  island: (typeof TRAVEL_ISLANDS)[number];
  arrival: string | null;
  departure: string | null;
  travelers: number;
  budget: (typeof TRAVEL_BUDGETS)[number];
  stayStatus: (typeof TRAVEL_STAY_STATUSES)[number];
  pace: (typeof TRAVEL_PACES)[number];
  interests: Array<(typeof TRAVEL_INTERESTS)[number]>;
  notes: string | null;
  submittedAt: string;
};

export type TravelPlanningValidation =
  | { ok: true; request: TravelPlanningRequest }
  | { ok: false; error: string; spam?: boolean };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeTravelPlanningRequest(
  body: Record<string, unknown>,
  now = new Date(),
): TravelPlanningValidation {
  if (clean(body.website, 100)) {
    return { ok: false, error: "Request received.", spam: true };
  }

  const startedAt = parseDate(body.formStartedAt);
  if (startedAt) {
    const elapsed = now.getTime() - startedAt.getTime();
    if (elapsed >= 0 && elapsed < 1_500) {
      return { ok: false, error: "Request received.", spam: true };
    }
  }

  const travelerName = clean(body.travelerName, 140);
  if (travelerName.length < 2) {
    return { ok: false, error: "Enter the primary traveler name." };
  }

  const email = clean(body.email, 220).toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const phone = clean(body.phone, 80) || null;
  const island = enumValue(body.island, TRAVEL_ISLANDS);
  if (!island) return { ok: false, error: "Choose a valid island preference." };

  const arrival = nullableDate(body.arrival);
  const departure = nullableDate(body.departure);
  if (body.arrival && !arrival) return { ok: false, error: "Choose a valid arrival date." };
  if (body.departure && !departure) return { ok: false, error: "Choose a valid departure date." };
  if (arrival && departure && departure <= arrival) {
    return { ok: false, error: "Departure must be after arrival." };
  }

  const travelers = integer(body.travelers, 1, 20);
  if (!travelers) return { ok: false, error: "Traveler count must be between 1 and 20." };

  const budget = enumValue(body.budget, TRAVEL_BUDGETS);
  const stayStatus = enumValue(body.stayStatus, TRAVEL_STAY_STATUSES);
  const pace = enumValue(body.pace, TRAVEL_PACES);
  if (!budget || !stayStatus || !pace) {
    return { ok: false, error: "Choose valid trip preferences." };
  }

  const interests = arrayValues(body.interests, TRAVEL_INTERESTS, 12);
  const notes = clean(body.notes, 1800) || null;
  if (body.consent !== true) {
    return {
      ok: false,
      error: "Confirm that VI Guide may use these details to respond to your planning request.",
    };
  }

  return {
    ok: true,
    request: {
      travelerName,
      email,
      phone,
      island,
      arrival,
      departure,
      travelers,
      budget,
      stayStatus,
      pace,
      interests,
      notes,
      submittedAt: now.toISOString(),
    },
  };
}

export function normalizeTravelRequestStatus(value: unknown): TravelRequestStatus | null {
  return enumValue(value, TRAVEL_REQUEST_STATUSES);
}

export function normalizeTravelAdvisorNote(value: unknown) {
  return clean(value, 2000) || null;
}

export function canTransitionTravelRequest(
  current: TravelRequestStatus,
  next: TravelRequestStatus,
) {
  if (current === next) return true;
  const transitions: Record<TravelRequestStatus, TravelRequestStatus[]> = {
    new: ["reviewing", "contacted", "closed"],
    reviewing: ["planned", "contacted", "closed"],
    planned: ["contacted", "booked", "closed"],
    contacted: ["reviewing", "planned", "booked", "closed"],
    booked: ["closed"],
    closed: [],
  };
  return transitions[current].includes(next);
}

export function travelTerritoryDayKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/St_Thomas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function travelIslandLabel(value: string) {
  return (
    {
      not_sure: "Not sure yet",
      stt: "St. Thomas",
      stj: "St. John",
      stx: "St. Croix",
      multi: "Multi-island trip",
    } as Record<string, string>
  )[value] ?? value;
}

export function travelPreferenceLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}

function parseDate(value: unknown) {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function nullableDate(value: unknown) {
  const date = clean(value, 10);
  return DATE_PATTERN.test(date) ? date : null;
}

function integer(value: unknown, minimum: number, maximum: number) {
  const number = Number(value);
  return Number.isInteger(number) && number >= minimum && number <= maximum
    ? number
    : null;
}

function enumValue<const T extends readonly string[]>(value: unknown, allowed: T) {
  const text = clean(value, 120);
  return (allowed as readonly string[]).includes(text) ? (text as T[number]) : null;
}

function arrayValues<const T extends readonly string[]>(
  value: unknown,
  allowed: T,
  maximum: number,
) {
  if (!Array.isArray(value)) return [];
  const accepted = new Set(allowed as readonly string[]);
  return Array.from(
    new Set(
      value
        .map((entry) => clean(entry, 120))
        .filter((entry) => accepted.has(entry)),
    ),
  ).slice(0, maximum) as Array<T[number]>;
}
