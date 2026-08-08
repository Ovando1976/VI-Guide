export const ACQUISITION_STORAGE_KEY = "vi-guide-acquisition-v1";

export type AcquisitionAttribution = {
  source?: string;
  medium?: string;
  campaign?: string;
  referrer?: string;
  partnerId?: string;
  placementId?: string;
  landingPath?: string;
  firstSeenAt: string;
  lastSeenAt: string;
};

export type AcquisitionEventName =
  | "landing_view"
  | "intent_selected"
  | "concierge_started"
  | "ride_started"
  | "quote_generated"
  | "auth_started"
  | "account_created"
  | "checkout_started"
  | "purchase_completed"
  | "offer_viewed"
  | "offer_requested"
  | "trip_created";

const clean = (value: string | null | undefined) => {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, 160) : undefined;
};

export function attributionFromSearchParams(
  params: URLSearchParams,
  input: { landingPath?: string; referrer?: string } = {},
): Omit<AcquisitionAttribution, "firstSeenAt" | "lastSeenAt"> {
  return {
    source: clean(params.get("utm_source") ?? params.get("source") ?? params.get("ref")),
    medium: clean(params.get("utm_medium") ?? params.get("medium")),
    campaign: clean(params.get("utm_campaign") ?? params.get("campaign")),
    partnerId: clean(params.get("partner") ?? params.get("partnerId")),
    placementId: clean(params.get("placement") ?? params.get("placementId")),
    landingPath: clean(input.landingPath),
    referrer: clean(input.referrer),
  };
}

export function mergeAttribution(
  previous: AcquisitionAttribution | null,
  incoming: Omit<AcquisitionAttribution, "firstSeenAt" | "lastSeenAt">,
  now = new Date().toISOString(),
): AcquisitionAttribution {
  return {
    source: previous?.source ?? incoming.source,
    medium: previous?.medium ?? incoming.medium,
    campaign: previous?.campaign ?? incoming.campaign,
    partnerId: previous?.partnerId ?? incoming.partnerId,
    placementId: previous?.placementId ?? incoming.placementId,
    landingPath: previous?.landingPath ?? incoming.landingPath,
    referrer: previous?.referrer ?? incoming.referrer,
    firstSeenAt: previous?.firstSeenAt ?? now,
    lastSeenAt: now,
  };
}

export type AcquisitionEvent = {
  name: AcquisitionEventName;
  occurredAt: string;
  path: string;
  attribution?: AcquisitionAttribution;
  properties?: Record<string, string | number | boolean | null>;
};
