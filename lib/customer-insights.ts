export const CUSTOMER_INSIGHT_CONSENT_VERSION = "2026-08-09";

export const CUSTOMER_INSIGHT_EVENTS = [
  "trip_intent_saved",
  "search_completed",
  "search_no_results",
  "recommendation_feedback",
  "booking_started",
  "booking_abandoned",
  "booking_completed",
  "trip_outcome_submitted",
  "support_issue_reported",
] as const;

export type CustomerInsightEventName = (typeof CUSTOMER_INSIGHT_EVENTS)[number];
export type InsightValue = string | number | boolean | null;

export type CustomerInsightEvent = {
  name: CustomerInsightEventName;
  sessionId: string;
  path: string;
  island?: "stt" | "stj" | "stx";
  properties: Record<string, InsightValue>;
};

export type ProviderReliabilityInput = {
  completed: number;
  confirmed: number;
  cancelledByProvider: number;
  priceAccurate: number;
  onTime: number;
  complaints: number;
  resolvedComplaints: number;
};

export function isCustomerInsightEventName(value: unknown): value is CustomerInsightEventName {
  return typeof value === "string" && CUSTOMER_INSIGHT_EVENTS.includes(value as CustomerInsightEventName);
}

export function cleanInsightProperties(value: unknown) {
  if (!value || typeof value !== "object") return {};
  const output: Record<string, InsightValue> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>).slice(0, 24)) {
    if (!/^[a-z][a-z0-9_]{0,47}$/.test(key)) continue;
    if (typeof item === "string") output[key] = redactSensitiveText(item).slice(0, 180);
    else if (typeof item === "number" && Number.isFinite(item)) output[key] = item;
    else if (typeof item === "boolean" || item === null) output[key] = item;
  }
  return output;
}

export function redactSensitiveText(value: string) {
  return value
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[email]")
    .replace(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g, "[phone]")
    .replace(/\s+/g, " ")
    .trim();
}

export function calculateProviderReliability(input: ProviderReliabilityInput) {
  const confirmed = ratio(input.confirmed, Math.max(1, input.confirmed + input.cancelledByProvider));
  const completion = ratio(input.completed, Math.max(1, input.confirmed));
  const price = ratio(input.priceAccurate, Math.max(1, input.completed));
  const punctuality = ratio(input.onTime, Math.max(1, input.completed));
  const recovery = input.complaints
    ? ratio(input.resolvedComplaints, input.complaints)
    : 1;
  const complaintPenalty = Math.min(20, ratio(input.complaints, Math.max(1, input.completed)) * 20);
  return Math.max(0, Math.min(100, Math.round(
    confirmed * 25 + completion * 20 + price * 25 + punctuality * 20 + recovery * 10 - complaintPenalty,
  )));
}

function ratio(value: number, total: number) {
  return Math.max(0, Math.min(1, finite(value) / Math.max(1, finite(total))));
}

function finite(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}
