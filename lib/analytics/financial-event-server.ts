import "server-only";

import { FieldValue, type Firestore, type Transaction } from "firebase-admin/firestore";

import {
  VI_EVENT_SCHEMA_VERSION,
  type FinancialVIEventName,
  type VIEventPayload,
  type VIIsland,
  type VITravelerType,
} from "@/lib/analytics/vi-event";

export type FinancialEventAttribution = {
  bookingId: string;
  providerId: string;
  listingId?: string;
  itineraryId?: string;
  sessionId?: string;
  userId?: string;
  island?: VIIsland;
  travelerType?: VITravelerType;
  source?: string;
};

export type RecordFinancialEventInput = {
  eventName: FinancialVIEventName;
  stripeEventId: string;
  idempotencyKey?: string;
  occurredAt: string;
  attribution: FinancialEventAttribution;
  payload?: VIEventPayload;
};

function clean(value: unknown, max = 180) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function safeKey(value: string) {
  return value.replace(/[^a-zA-Z0-9._:-]/g, "_").slice(0, 180);
}

export function resolveFinancialProviderId(record: Record<string, unknown>) {
  const providerId = clean(record.providerId) || clean(record.merchantUid);
  if (providerId) return providerId;

  // VI Guide's provider operations and merchant listing scope are keyed by the
  // canonical listing id. When a merchant UID is not present on older bookings,
  // retain deterministic provider attribution to that server-owned provider scope
  // rather than emitting unattributed revenue.
  const listingId = clean(record.listingId);
  return listingId ? `listing:${listingId}` : "";
}

export function financialEventDocumentId(input: {
  eventName: FinancialVIEventName;
  stripeEventId: string;
  bookingId: string;
  idempotencyKey?: string;
}) {
  const eventKey = safeKey(
    clean(input.idempotencyKey) || clean(input.stripeEventId),
  );
  const bookingId = safeKey(clean(input.bookingId));
  if (!eventKey || !bookingId) return "";
  return `financial_${input.eventName}_${eventKey}_${bookingId}`;
}

export function buildFinancialEventRecord(input: RecordFinancialEventInput) {
  const bookingId = clean(input.attribution.bookingId);
  const providerId = clean(input.attribution.providerId);
  const stripeEventId = clean(input.stripeEventId);
  const idempotencyKey = clean(input.idempotencyKey) || stripeEventId;
  const eventId = financialEventDocumentId({
    eventName: input.eventName,
    stripeEventId,
    idempotencyKey,
    bookingId,
  });

  if (!eventId || !providerId || !stripeEventId) return null;

  return {
    eventId,
    eventName: input.eventName,
    schemaVersion: VI_EVENT_SCHEMA_VERSION,
    origin: "server" as const,
    occurredAt: input.occurredAt,
    receivedAt: FieldValue.serverTimestamp(),
    sessionId: clean(input.attribution.sessionId) || `booking_${bookingId}`,
    userId: clean(input.attribution.userId) || null,
    island: input.attribution.island ?? null,
    travelerType: input.attribution.travelerType ?? null,
    source: clean(input.attribution.source, 120) || "stripe_webhook",
    itineraryId: clean(input.attribution.itineraryId) || null,
    listingId: clean(input.attribution.listingId) || null,
    providerId,
    bookingId,
    stripeEventId,
    idempotencyKey,
    payload: {
      ...(input.payload ?? {}),
      stripeEventId,
      idempotencyKey,
    },
  };
}

export function recordFinancialEvent(
  transaction: Transaction,
  db: Firestore,
  input: RecordFinancialEventInput,
) {
  const record = buildFinancialEventRecord(input);
  if (!record) return null;

  // One deterministic document per ledger effect prevents multiple Stripe
  // webhook envelopes (for example refund.created + refund.updated) from
  // double-counting the same financial consequence.
  transaction.set(db.collection("viEvents").doc(record.eventId), record);
  return record;
}
