export const BUSINESS_CLAIM_ISLANDS = [
  "st_thomas",
  "st_john",
  "st_croix",
  "water_island",
  "territory_wide",
] as const;

export const BUSINESS_CLAIM_ROLES = [
  "owner",
  "manager",
  "authorized_representative",
] as const;

export const BUSINESS_CLAIM_STATUSES = [
  "new",
  "reviewing",
  "needs_information",
  "approved",
  "declined",
] as const;

export type BusinessClaimIsland = (typeof BUSINESS_CLAIM_ISLANDS)[number];
export type BusinessClaimRole = (typeof BUSINESS_CLAIM_ROLES)[number];
export type BusinessClaimStatus = (typeof BUSINESS_CLAIM_STATUSES)[number];

export type BusinessClaimInput = {
  businessName?: unknown;
  existingListingId?: unknown;
  contactName?: unknown;
  email?: unknown;
  phone?: unknown;
  island?: unknown;
  claimRole?: unknown;
  website?: unknown;
  verificationNote?: unknown;
  consent?: unknown;
  formStartedAt?: unknown;
  companyFax?: unknown;
};

export type NormalizedBusinessClaim = {
  businessName: string;
  existingListingId: string | null;
  contactName: string;
  email: string;
  phone: string | null;
  island: BusinessClaimIsland;
  claimRole: BusinessClaimRole;
  website: string | null;
  verificationNote: string | null;
  consent: true;
  submittedAt: string;
};

export type BusinessClaimValidation =
  | { ok: true; claim: NormalizedBusinessClaim }
  | { ok: false; error: string; spam?: boolean };

const STATUS_TRANSITIONS: Record<BusinessClaimStatus, BusinessClaimStatus[]> = {
  new: ["reviewing", "needs_information", "approved", "declined"],
  reviewing: ["needs_information", "approved", "declined"],
  needs_information: ["reviewing", "approved", "declined"],
  approved: [],
  declined: ["reviewing"],
};

export function normalizeBusinessClaim(
  input: BusinessClaimInput,
  now: Date = new Date(),
): BusinessClaimValidation {
  if (clean(input.companyFax, 120)) {
    return { ok: false, error: "Unable to submit this claim.", spam: true };
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
      error: "Please refresh the page and complete the claim again.",
      spam: true,
    };
  }

  const businessName = clean(input.businessName, 160);
  const existingListingId = normalizeListingId(input.existingListingId);
  const contactName = clean(input.contactName, 120);
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);
  const island = normalizeEnum(input.island, BUSINESS_CLAIM_ISLANDS);
  const claimRole = normalizeEnum(input.claimRole, BUSINESS_CLAIM_ROLES);
  const website = normalizeWebsite(input.website);
  const verificationNote = cleanMultiline(input.verificationNote, 800) || null;

  if (!businessName) return invalid("Enter the business name.");
  if (!contactName) return invalid("Enter your name.");
  if (!email) return invalid("Enter a valid contact email address.");
  if (clean(input.phone, 80) && !phone) {
    return invalid("Enter a valid phone number or leave it blank.");
  }
  if (!island) return invalid("Choose the business island or territory-wide service.");
  if (!claimRole) return invalid("Choose your relationship to the business.");
  if (clean(input.website, 500) && !website) {
    return invalid(
      "Enter a complete website address beginning with http:// or https://.",
    );
  }
  if (clean(input.existingListingId, 180) && !existingListingId) {
    return invalid("Enter a valid USVI Explorer listing ID or leave it blank.");
  }
  if (input.consent !== true) {
    return invalid("Consent is required before submitting the claim.");
  }

  return {
    ok: true,
    claim: {
      businessName,
      existingListingId,
      contactName,
      email,
      phone,
      island,
      claimRole,
      website,
      verificationNote,
      consent: true,
      submittedAt: now.toISOString(),
    },
  };
}

export function normalizeBusinessClaimStatus(
  value: unknown,
): BusinessClaimStatus | null {
  return normalizeEnum(value, BUSINESS_CLAIM_STATUSES);
}

export function canTransitionBusinessClaim(current: unknown, next: unknown) {
  const currentStatus = normalizeBusinessClaimStatus(current);
  const nextStatus = normalizeBusinessClaimStatus(next);
  return Boolean(
    currentStatus &&
      nextStatus &&
      STATUS_TRANSITIONS[currentStatus].includes(nextStatus),
  );
}

export function normalizeBusinessClaimAdminNote(value: unknown) {
  return cleanMultiline(value, 1600) || null;
}

export function humanizeBusinessClaimValue(value: unknown) {
  return clean(value, 120)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeListingId(value: unknown) {
  const id = clean(value, 160);
  if (!id) return null;
  return /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,159}$/.test(id) ? id : null;
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

function invalid(error: string): BusinessClaimValidation {
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
