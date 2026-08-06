import { createHash } from "node:crypto";

export const MAX_CRUISE_REQUESTS_PER_EMAIL_DAY = 3;

export function cruiseRequestFingerprint(input: {
  email: string;
  departureWindowStart: string;
  departureWindowEnd: string;
  adults: number;
  children: number;
  dayKey: string;
}) {
  return digest([
    normalize(input.email),
    input.departureWindowStart,
    input.departureWindowEnd,
    String(input.adults),
    String(input.children),
    input.dayKey,
  ]);
}

export function cruiseRequestEmailDayFingerprint(input: {
  email: string;
  dayKey: string;
}) {
  return digest([normalize(input.email), input.dayKey]);
}

export function cruiseRequestQuotaAllows(value: unknown) {
  const count = Number(value);
  return !Number.isFinite(count) || count < MAX_CRUISE_REQUESTS_PER_EMAIL_DAY;
}

function digest(parts: string[]) {
  return createHash("sha256").update(parts.join("\u001f")).digest("hex");
}

function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}
