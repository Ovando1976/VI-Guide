import { createHash } from "node:crypto";

import {
  normalizeJourneyPlan,
  type JourneyPlan,
} from "@/lib/journey-planner";
import type { IntelligencePlanStop } from "@/types/intelligence";

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_PATTERN = /(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/g;

export type TravelAdvisorProposalSnapshot = {
  plan: JourneyPlan;
  digest: string;
  shareId: string;
};

export function buildTravelAdvisorProposalSnapshot({
  requestId,
  plan: value,
}: {
  requestId: string;
  plan: unknown;
}): TravelAdvisorProposalSnapshot | null {
  if (!/^travel_[a-f0-9]{32}$/.test(requestId)) return null;
  const normalized = normalizeJourneyPlan(value);
  if (!normalized || normalized.plan.length === 0) return null;

  const plan: JourneyPlan = {
    ...normalized,
    title: redactContact(normalized.title).slice(0, 120),
    notes: redactContact(normalized.notes).slice(0, 1600),
    status: "ready",
    plan: normalized.plan.map(sanitizeStop),
  };

  const digest = createHash("sha256")
    .update(
      JSON.stringify({
        title: plan.title,
        island: plan.island,
        date: plan.date,
        notes: plan.notes,
        plan: plan.plan.map((stop) => ({
          id: stop.id,
          placeId: stop.placeId ?? null,
          title: stop.title,
          island: stop.island,
          kind: stop.kind,
          summary: stop.summary,
          startTime: stop.startTime ?? null,
          endTime: stop.endTime ?? null,
          durationMinutes: stop.durationMinutes ?? null,
          lat: stop.lat ?? null,
          lng: stop.lng ?? null,
          href: stop.href ?? null,
          mapHref: stop.mapHref ?? null,
          bookingHref: stop.bookingHref ?? null,
          mobility: stop.mobility ?? null,
        })),
      }),
    )
    .digest("hex");

  const shareId = createHash("sha256")
    .update(`vi-guide-travel-proposal-v1|${requestId}|${digest}`)
    .digest("hex")
    .slice(0, 24);

  return { plan, digest, shareId };
}

function sanitizeStop(stop: IntelligencePlanStop): IntelligencePlanStop {
  const sanitized: IntelligencePlanStop = {
    ...stop,
    title: redactContact(stop.title).slice(0, 160),
    summary: redactContact(stop.summary).slice(0, 1200),
  };
  delete sanitized.href;
  delete sanitized.mapHref;
  delete sanitized.bookingHref;

  const href = safeInternalHref(stop.href);
  const mapHref = safeInternalHref(stop.mapHref);
  const bookingHref = safeInternalHref(stop.bookingHref);
  if (href) sanitized.href = href;
  if (mapHref) sanitized.mapHref = mapHref;
  if (bookingHref) sanitized.bookingHref = bookingHref;
  return sanitized;
}

function redactContact(value: string) {
  return value
    .replace(EMAIL_PATTERN, "[contact removed]")
    .replace(PHONE_PATTERN, "[contact removed]");
}

function safeInternalHref(value: unknown) {
  if (typeof value !== "string") return "";
  const href = value.trim().slice(0, 500);
  return href.startsWith("/") && !href.startsWith("//") ? href : "";
}
