import "server-only";

import { FieldValue, type Firestore, type Transaction } from "firebase-admin/firestore";

import {
  VI_EVENT_SCHEMA_VERSION,
  type ClientVIEventName,
  type VIEventPayload,
  type VIIsland,
  type VITravelerType,
} from "@/lib/analytics/vi-event";

export type RecordServerJourneyEventInput = {
  eventName: ClientVIEventName;
  eventKey: string;
  occurredAt: string;
  sessionId: string;
  travelerType?: VITravelerType;
  island?: VIIsland;
  source: string;
  itineraryId?: string;
  listingId?: string;
  bookingId?: string;
  payload?: VIEventPayload;
};

function clean(value: unknown, max = 180) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function safeKey(value: string) {
  return value.replace(/[^a-zA-Z0-9._:-]/g, "_").slice(0, 180);
}

export function recordServerJourneyEvent(
  transaction: Transaction,
  db: Firestore,
  input: RecordServerJourneyEventInput,
) {
  const eventKey = safeKey(clean(input.eventKey));
  const sessionId = clean(input.sessionId);
  if (!eventKey || !sessionId) return null;

  const eventId = `server_${input.eventName}_${eventKey}`;
  const record = {
    eventId,
    eventName: input.eventName,
    schemaVersion: VI_EVENT_SCHEMA_VERSION,
    origin: "server" as const,
    occurredAt: input.occurredAt,
    receivedAt: FieldValue.serverTimestamp(),
    sessionId,
    userId: null,
    travelerType: input.travelerType ?? null,
    island: input.island ?? null,
    source: clean(input.source, 120),
    itineraryId: clean(input.itineraryId) || null,
    listingId: clean(input.listingId) || null,
    providerId: null,
    bookingId: clean(input.bookingId) || null,
    payload: input.payload ?? {},
  };

  transaction.set(db.collection("viEvents").doc(eventId), record, { merge: false });
  return record;
}
