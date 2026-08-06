export const PARTNER_APPLICATION_ISLANDS = [
  "st_thomas",
  "st_john",
  "st_croix",
  "water_island",
  "territory_wide",
] as const;

export const PARTNER_APPLICATION_CATEGORIES = [
  "accommodation",
  "food_drink",
  "tour_activity",
  "transportation",
  "retail_service",
  "event_venue",
  "community_organization",
  "other",
] as const;

export const PARTNER_APPLICATION_INTERESTS = [
  "listing_visibility",
  "booking_requests",
  "secure_payments",
  "concierge_referrals",
  "promotions",
] as const;

export const PARTNER_APPLICATION_STATUSES = [
  "new",
  "reviewing",
  "needs_information",
  "approved",
  "declined",
] as const;

export type PartnerApplicationIsland =
  (typeof PARTNER_APPLICATION_ISLANDS)[number];
export type PartnerApplicationCategory =
  (typeof PARTNER_APPLICATION_CATEGORIES)[number];
export type PartnerApplicationInterest =
  (typeof PARTNER_APPLICATION_INTERESTS)[number];
export type PartnerApplicationStatus =
  (typeof PARTNER_APPLICATION_STATUSES)[number];

export type PartnerApplicationInput = {
  businessName?: unknown;
  contactName?: unknown;
  email?: unknown;
  phone?: unknown;
  island?: unknown;
  category?: unknown;
  website?: unknown;
  existingListingId?: unknown;
  services?: unknown;
  goals?: unknown;
  interests?: unknown;
  referralSource?: unknown;
  consent?: unknown;
  formStartedAt?: unknown;
  companyFax?: unknown;
};

export type NormalizedPartnerApplication = {
  businessName: string;
  contactName: string;
  email: string;
  phone: string | null;
  island: PartnerApplicationIsland;
  category: PartnerApplicationCategory;
  website: string | null;
  existingListingId: string | null;
  services: string;
  goals: string | null;
  interests: PartnerApplicationInterest[];
  referralSource: string | null;
  consent: true;
  submittedAt: string;
};

export type PartnerApplicationValidation =
  | { ok: true; application: NormalizedPartnerApplication }
  | { ok: false; error: string; spam?: boolean };

const STATUS_TRANSITIONS: Record<
  PartnerApplicationStatus,
  PartnerApplicationStatus[]
> = {
  new: ["reviewing", "needs_information", "approved", "declined"],
  reviewing: ["needs_information", "approved", "declined"],
  needs_information: ["reviewing", "approved", "declined"],
  approved: [],
  declined: ["reviewing"],
};

export function normalizePartnerApplication(
  input: PartnerApplicationInput,
  now: Date = new Date(),
): PartnerApplicationValidation {
  if (clean(input.companyFax, 120)) {
    return { ok: false, error: "Unable to submit this application.", spam: true };
  }

  const startedAt = normalizeDate(input.formStartedAt);
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
      error: "Please refresh the page and complete the application again.",
      spam: true,
    };
  }

  const businessName = clean(input.businessName, 160);
  const contactName = clean(input.contactName, 120);
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);
  const island = normalizeEnum(input.island, PARTNER_APPLICATION_ISLANDS);
  const category = normalizeEnum(
    input.category,
    PARTNER_APPLICATION_CATEGORIES,
  );
  const website = normalizeWebsite(input.website);
  const existingListingId = clean(input.existingListingId, 160) || null;
  const services = cleanMultiline(input.services, 1400);
  const goals = cleanMultiline(input.goals, 1200) || null;
  const interests = normalizeInterests(input.interests);
  const referralSource = clean(input.referralSource, 120) || null;

  if (!businessName) return invalid("Enter the business or organization name.");
  if (!contactName) return invalid("Enter the primary contact name.");
  if (!email) return invalid("Enter a valid contact email address.");
  if (clean(input.phone, 80) && !phone) {
    return invalid("Enter a valid phone number or leave it blank.");
  }
  if (!island) return invalid("Choose the primary island or territory-wide service.");
  if (!category) return invalid("Choose the business category.");
  if (clean(input.website, 500) && !website) {
    return invalid("Enter a complete website address beginning with http:// or https://.");
  }
  if (!services || services.length < 20) {
    return invalid("Describe the services or experiences offered in at least 20 characters.");
  }
  if (!interests.length) {
    return invalid("Choose at least one way VI Guide can support the business.");
  }
  if (input.consent !== true) {
    return invalid("Consent is required before submitting the application.");
  }

  return {
    ok: true,
    application: {
      businessName,
      contactName,
      email,
      phone,
      island,
      category,
      website,
      existingListingId,
      services,
      goals,
      interests,
      referralSource,
      consent: true,
      submittedAt: now.toISOString(),
    },
  };
}

export function normalizePartnerApplicationStatus(
  value: unknown,
): PartnerApplicationStatus | null {
  return normalizeEnum(value, PARTNER_APPLICATION_STATUSES);
}

export function canTransitionPartnerApplication(
  current: unknown,
  next: unknown,
) {
  const currentStatus = normalizePartnerApplicationStatus(current);
  const nextStatus = normalizePartnerApplicationStatus(next);
  return Boolean(
    currentStatus &&
      nextStatus &&
      STATUS_TRANSITIONS[currentStatus].includes(nextStatus),
  );
}

export function normalizePartnerAdminNote(value: unknown) {
  return cleanMultiline(value, 1600) || null;
}

export function partnerApplicationDayKey(value: Date = new Date()) {
  return value.toISOString().slice(0, 10);
}

export function humanizePartnerValue(value: unknown) {
  return clean(value, 120)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeInterests(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((interest) =>
          normalizeEnum(interest, PARTNER_APPLICATION_INTERESTS),
        )
        .filter(
          (interest): interest is PartnerApplicationInterest =>
            interest !== null,
        ),
    ),
  );
}

function normalizeWebsite(value: unknown) {
  const website = clean(value, 500);
  if (!website) return null;
  try {
    const parsed = new URL(website);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    if (parsed.username || parsed.password) return null;
    return parsed.toString().slice(0, 500);
  } catch {
    return null;
  }
}

function normalizePhone(value: unknown) {
  const phone = clean(value, 80);
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return null;
  return phone;
}

function normalizeEmail(value: unknown) {
  const email = clean(value, 220).toLowerCase();
  return /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(email) ? email : "";
}

function normalizeDate(value: unknown) {
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

function invalid(error: string): PartnerApplicationValidation {
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
