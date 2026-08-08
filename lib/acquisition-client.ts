"use client";

import {
  ACQUISITION_STORAGE_KEY,
  type AcquisitionAttribution,
  type AcquisitionEventName,
} from "@/lib/acquisition";

function readAttribution(): AcquisitionAttribution | undefined {
  try {
    const raw = window.localStorage.getItem(ACQUISITION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AcquisitionAttribution) : undefined;
  } catch {
    return undefined;
  }
}

export function trackAcquisitionEvent(
  name: AcquisitionEventName,
  properties?: Record<string, string | number | boolean | null>,
) {
  if (typeof window === "undefined") return;

  const payload = JSON.stringify({
    name,
    path: `${window.location.pathname}${window.location.search}`,
    attribution: readAttribution(),
    properties,
  });

  try {
    if (navigator.sendBeacon) {
      const sent = navigator.sendBeacon(
        "/api/acquisition/events",
        new Blob([payload], { type: "application/json" }),
      );
      if (sent) return;
    }
  } catch {
    // Fall through to fetch.
  }

  void fetch("/api/acquisition/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => undefined);
}
