"use client";

import {
  CUSTOMER_INSIGHT_CONSENT_VERSION,
  type CustomerInsightEventName,
  type InsightValue,
} from "@/lib/customer-insights";

const CONSENT_KEY = "vi-guide.customer-insights-consent.v1";
const SESSION_KEY = "vi-guide.customer-insights-session.v1";

export function hasCustomerInsightConsent() {
  return typeof window !== "undefined" && window.localStorage.getItem(CONSENT_KEY) === CUSTOMER_INSIGHT_CONSENT_VERSION;
}

export function setCustomerInsightConsent(enabled: boolean) {
  if (typeof window === "undefined") return;
  if (enabled) window.localStorage.setItem(CONSENT_KEY, CUSTOMER_INSIGHT_CONSENT_VERSION);
  else window.localStorage.removeItem(CONSENT_KEY);
}

export async function recordCustomerInsight(
  name: CustomerInsightEventName,
  properties: Record<string, InsightValue> = {},
  options: { island?: "stt" | "stj" | "stx"; requireConsent?: boolean } = {},
) {
  if (typeof window === "undefined") return false;
  if (options.requireConsent !== false && !hasCustomerInsightConsent()) return false;
  try {
    const response = await fetch("/api/customer-insights/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        name,
        properties,
        path: window.location.pathname,
        island: options.island,
        sessionId: insightSessionId(),
        consentVersion: CUSTOMER_INSIGHT_CONSENT_VERSION,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

function insightSessionId() {
  const current = window.sessionStorage.getItem(SESSION_KEY);
  if (current) return current;
  const created = crypto.randomUUID();
  window.sessionStorage.setItem(SESSION_KEY, created);
  return created;
}
