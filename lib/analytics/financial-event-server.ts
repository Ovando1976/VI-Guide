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
  return (
    clean(record.providerId) ||
    clean(record.merchantUid) ||
    clean(record.offerId) ||
    clean(record.listingId)
  );
}

export function financialEventDocumentId(input: {
  eventName: FinancialVIEventName;
  stripeEventId: string;
  bookingId: string;
}) {
  const stripeEventId = safeKey(clean(input.stripeEventId));
  const bookingId = safeKey(clean(input.bookingId));
  if (!stripeEventId || !bookingId) return "";
  return `financial_${input.eventName}_${stripeEventId}_${bookingId}`;
}

export function buildFinancialEventRecord(input: RecordFinancialEventInput) {
  const bookingId = clean(input.attribution.bookingId);
  const providerId = clean(input.attribution.providerId);
  const stripeEventId = clean(input.stripeEventId);
  const eventId = financialEventDocumentId({
    eventName: input.eventName,
    stripeEventId,
    bookingId,
  });

  if (!eventId || !providerId) return null;

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
    payload: input.payload ?? {},
  };
}

export function recordFinancialEvent(
  transaction: Transaction,
  db: Firestore,
  input: RecordFinancialEventInput,
) {
  const record = buildFinancialEventRecord(input);
  if (!record) return null;

  // Deterministic document ids plus the webhook's stripeWebhookEvents transaction
  // make retries idempotent. The browser never receives a write path for these names.
  transaction.set(db.collection("viEvents").doc(record.eventId), record);
  return record;
}
