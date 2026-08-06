import { createHash } from "node:crypto";

export const MAX_PARTNER_APPLICATIONS_PER_EMAIL_DAY = 3;

export function partnerApplicationFingerprint(input: {
  email: string;
  businessName: string;
  dayKey: string;
}) {
  return sha256(
    `${normalize(input.email)}|${normalize(input.businessName)}|${normalize(
      input.dayKey,
    )}`,
  );
}

export function partnerApplicationEmailDayFingerprint(input: {
  email: string;
  dayKey: string;
}) {
  return sha256(`${normalize(input.email)}|${normalize(input.dayKey)}`);
}

export function partnerApplicationQuotaAllows(
  currentCount: unknown,
  maximum = MAX_PARTNER_APPLICATIONS_PER_EMAIL_DAY,
) {
  const count = Number.isFinite(Number(currentCount))
    ? Math.max(0, Math.floor(Number(currentCount)))
    : 0;
  const limit = Number.isFinite(maximum)
    ? Math.max(1, Math.floor(maximum))
    : MAX_PARTNER_APPLICATIONS_PER_EMAIL_DAY;
  return count < limit;
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}
