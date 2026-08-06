import { normalizePartnerApplicationStatus } from "@/lib/partners/partner-application";

export type PartnerConversionRecord = {
  status?: unknown;
  email?: unknown;
  existingListingId?: unknown;
  merchantAccessGrantedAt?: unknown;
  merchantUid?: unknown;
  merchantListingId?: unknown;
};

export type ApprovedPartnerConversion = {
  applicationId: string;
  email: string;
  listingId: string;
  convertedAt: string | null;
  merchantUid: string | null;
  merchantListingId: string | null;
};

export type PartnerConversionResolution =
  | { ok: true; conversion: ApprovedPartnerConversion }
  | { ok: false; error: string };

export function normalizePartnerApplicationId(value: unknown) {
  const id = clean(value, 80);
  return /^partner_[a-f0-9]{32}$/.test(id) ? id : "";
}

export function normalizePartnerConversionEmail(value: unknown) {
  const email = clean(value, 220).toLowerCase();
  return /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(email) ? email : "";
}

export function resolveApprovedPartnerConversion(input: {
  applicationId: unknown;
  accountEmail: unknown;
  record: PartnerConversionRecord;
}): PartnerConversionResolution {
  const applicationId = normalizePartnerApplicationId(input.applicationId);
  const accountEmail = normalizePartnerConversionEmail(input.accountEmail);
  const recordEmail = normalizePartnerConversionEmail(input.record.email);
  const listingId = clean(input.record.existingListingId, 160);

  if (!applicationId || !accountEmail) {
    return { ok: false, error: "A valid approved partner application is required." };
  }
  if (normalizePartnerApplicationStatus(input.record.status) !== "approved") {
    return { ok: false, error: "The partner application is not approved." };
  }
  if (!recordEmail || recordEmail !== accountEmail) {
    return {
      ok: false,
      error: "The approved application does not match this Firebase account.",
    };
  }
  if (!listingId) {
    return {
      ok: false,
      error: "The approved application does not have a reviewed listing ID.",
    };
  }

  return {
    ok: true,
    conversion: {
      applicationId,
      email: accountEmail,
      listingId,
      convertedAt: normalizeIso(input.record.merchantAccessGrantedAt),
      merchantUid: clean(input.record.merchantUid, 160) || null,
      merchantListingId: clean(input.record.merchantListingId, 160) || null,
    },
  };
}

export function partnerConversionConflict(input: {
  conversion: ApprovedPartnerConversion;
  targetUid: string;
}) {
  const { conversion } = input;
  if (!conversion.convertedAt) return null;
  if (conversion.merchantUid && conversion.merchantUid !== input.targetUid) {
    return "This approved application was already converted to a different Firebase account.";
  }
  if (
    conversion.merchantListingId &&
    conversion.merchantListingId !== conversion.listingId
  ) {
    return "This approved application was already converted for a different listing.";
  }
  return null;
}

export function partnerConversionPatch(input: {
  targetUid: string;
  targetEmail: string;
  listingId: string;
  actorUid: string;
  actorEmail?: string | null;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const email = normalizePartnerConversionEmail(input.targetEmail);
  const listingId = clean(input.listingId, 160);
  const targetUid = clean(input.targetUid, 160);
  const actorUid = clean(input.actorUid, 160);

  if (!email || !listingId || !targetUid || !actorUid) return null;

  return {
    onboardingState: "merchant_access_granted" as const,
    merchantAccessGrantedAt: now.toISOString(),
    merchantUid: targetUid,
    merchantEmail: email,
    merchantListingId: listingId,
    merchantAccessGrantedByUid: actorUid,
    merchantAccessGrantedByEmail:
      normalizePartnerConversionEmail(input.actorEmail) || null,
    nextFollowUpDate: null,
    updatedAt: now.toISOString(),
  };
}

export function partnerConversionState(record: PartnerConversionRecord) {
  const status = normalizePartnerApplicationStatus(record.status) ?? "new";
  if (status !== "approved") return "not_approved" as const;
  return normalizeIso(record.merchantAccessGrantedAt)
    ? ("converted" as const)
    : ("awaiting_onboarding" as const);
}

function normalizeIso(value: unknown) {
  const text = clean(value, 50);
  const parsed = Date.parse(text);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
