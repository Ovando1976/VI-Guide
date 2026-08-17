"use client";

import {
  ACQUISITION_STORAGE_KEY,
  type AcquisitionAttribution,
  type AcquisitionEventName,
} from "@/lib/acquisition";
import { trackEvent } from "@/lib/analytics/tracking-client";
import type { ClientVIEventName, VIEventPayload } from "@/lib/analytics/vi-event";

function readAttribution(): AcquisitionAttribution | undefined {
  try {
    const raw = window.localStorage.getItem(ACQUISITION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AcquisitionAttribution) : undefined;
  } catch {
    return undefined;
  }
}

function canonicalEventName(name: AcquisitionEventName): ClientVIEventName {
  // The browser may observe a successful payment return page, but it is never
  // authoritative for money. Stripe remains the only source of financial truth.
  return name === "purchase_completed" ? "purchase_return_viewed" : name;
}

export function trackAcquisitionEvent(
  name: AcquisitionEventName,
  properties?: Record<string, string | number | boolean | null>,
) {
  if (typeof window === "undefined") return;

  const attribution = readAttribution();
  const payload: VIEventPayload = {
    ...properties,
    acquisitionSource: attribution?.source ?? null,
    acquisitionMedium: attribution?.medium ?? null,
    acquisitionCampaign: attribution?.campaign ?? null,
    acquisitionPartnerId: attribution?.partnerId ?? null,
    acquisitionPlacementId: attribution?.placementId ?? null,
    acquisitionLandingPath: attribution?.landingPath ?? null,
    acquisitionReferrer: attribution?.referrer ?? null,
  };

  trackEvent(canonicalEventName(name), payload, { source: "acquisition" });
}
