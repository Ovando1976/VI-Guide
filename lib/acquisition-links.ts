export type AcquisitionLink = {
  destination: string;
  source: string;
  medium: string;
  campaign: string;
  partnerId?: string;
  placementId?: string;
};

export const ACQUISITION_LINKS: Record<string, AcquisitionLink> = {
  "stt-airport": {
    destination: "/mobility?island=st_thomas&from=Cyril%20E.%20King%20Airport",
    source: "stt-airport",
    medium: "qr",
    campaign: "arrival-ride",
    placementId: "airport",
  },
  havensight: {
    destination: "/cruises?intent=port-day",
    source: "havensight",
    medium: "qr",
    campaign: "cruise-port-day",
    placementId: "cruise-port",
  },
  "crown-bay": {
    destination: "/cruises?intent=port-day",
    source: "crown-bay",
    medium: "qr",
    campaign: "cruise-port-day",
    placementId: "cruise-port",
  },
  "red-hook": {
    destination: "/mobility?island=st_thomas&from=Red%20Hook",
    source: "red-hook",
    medium: "qr",
    campaign: "ferry-transfer",
    placementId: "ferry-terminal",
  },
};

export function acquisitionDestination(code: string) {
  const entry = ACQUISITION_LINKS[code];
  if (!entry) return null;

  const url = new URL(entry.destination, "https://vi-guide.local");
  url.searchParams.set("utm_source", entry.source);
  url.searchParams.set("utm_medium", entry.medium);
  url.searchParams.set("utm_campaign", entry.campaign);
  if (entry.partnerId) url.searchParams.set("partner", entry.partnerId);
  if (entry.placementId) url.searchParams.set("placement", entry.placementId);
  return `${url.pathname}${url.search}${url.hash}`;
}
