import { createHash } from "node:crypto";

export const MAX_PARTNER_STATUS_LOOKUPS_PER_EMAIL_DAY = 20;

export function partnerStatusLookupDayFingerprint(input: {
  email: string;
  dayKey: string;
}) {
  return createHash("sha256")
    .update(`${normalize(input.email)}|${normalize(input.dayKey)}|status_lookup`)
    .digest("hex");
}

export function partnerStatusLookupQuotaAllows(
  currentCount: unknown,
  maximum = MAX_PARTNER_STATUS_LOOKUPS_PER_EMAIL_DAY,
) {
  const count = Number.isFinite(Number(currentCount))
    ? Math.max(0, Math.floor(Number(currentCount)))
    : 0;
  const limit = Number.isFinite(maximum)
    ? Math.max(1, Math.floor(maximum))
    : MAX_PARTNER_STATUS_LOOKUPS_PER_EMAIL_DAY;
  return count < limit;
}

function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}
