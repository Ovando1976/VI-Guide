"use client";

import {
  VI_EVENT_SCHEMA_VERSION,
  type ClientVIEventName,
  type VIEvent,
  type VIEventPayload,
  type VIIsland,
  type VITravelerType,
} from "@/lib/analytics/vi-event";

const SESSION_STORAGE_KEY = "vi-guide-session-v1";

export type TrackEventContext = {
  userId?: string;
  island?: VIIsland;
  travelerType?: VITravelerType;
  source?: string;
  itineraryId?: string;
  listingId?: string;
  providerId?: string;
  bookingId?: string;
};

function randomId(prefix: string) {
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${random}`;
}

export function getVITrackingSessionId() {
  if (typeof window === "undefined") return "server-unavailable";

  try {
    const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY)?.trim();
    if (existing) return existing;
    const created = randomId("session");
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, created);
    return created;
  } catch {
    return randomId("session");
  }
}

export function trackEvent(
  eventName: ClientVIEventName,
  payload: VIEventPayload = {},
  context: TrackEventContext = {},
) {
  if (typeof window === "undefined") return;

  const event: VIEvent = {
    eventId: randomId("event"),
    eventName,
    schemaVersion: VI_EVENT_SCHEMA_VERSION,
    origin: "client",
    occurredAt: new Date().toISOString(),
    sessionId: getVITrackingSessionId(),
    userId: context.userId,
    island: context.island,
    travelerType: context.travelerType,
    source: context.source,
    itineraryId: context.itineraryId,
    listingId: context.listingId,
    providerId: context.providerId,
    bookingId: context.bookingId,
    payload: {
      ...payload,
      path: `${window.location.pathname}${window.location.search}`,
    },
  };
  const body = JSON.stringify(event);

  try {
    if (navigator.sendBeacon) {
      const sent = navigator.sendBeacon(
        "/api/acquisition/events",
        new Blob([body], { type: "application/json" }),
      );
      if (sent) return;
    }
  } catch {
    // Fall through to fetch so analytics never interrupts the traveler flow.
  }

  void fetch("/api/acquisition/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}
