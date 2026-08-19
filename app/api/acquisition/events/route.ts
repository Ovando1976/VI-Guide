import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { getAdminDb, hasFirebaseAdminConfiguration } from "@/lib/firebase-admin";
import {
  VI_EVENT_SCHEMA_VERSION,
  isClientVIEventName,
  type VIEventPayload,
  type VIIsland,
  type VITravelerType,
} from "@/lib/analytics/vi-event";

const clean = (value: unknown, max = 160) =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;

const islands = new Set<VIIsland>([
  "st_thomas",
  "st_john",
  "st_croix",
  "water_island",
]);
const travelerTypes = new Set<VITravelerType>(["cruise", "stayover", "local"]);

type EventPayloadEntry = [string, string | number | boolean | null];

function cleanPayload(value: unknown): VIEventPayload {
  if (!value || typeof value !== "object") return {};

  const entries: EventPayloadEntry[] = [];
  for (const [key, item] of Object.entries(value as Record<string, unknown>).slice(0, 40)) {
    if (!/^[a-zA-Z0-9_.-]{1,64}$/.test(key)) continue;
    if (typeof item === "string") entries.push([key, item.slice(0, 500)]);
    else if (typeof item === "number" && Number.isFinite(item)) entries.push([key, item]);
    else if (typeof item === "boolean" || item === null) entries.push([key, item]);
  }
  return Object.fromEntries(entries);
}

function safeEventId(value: unknown) {
  const normalized = clean(value, 180);
  return normalized && /^[a-zA-Z0-9._:-]+$/.test(normalized) ? normalized : null;
}

function legacyEventName(value: unknown) {
  const name = clean(value);
  return name === "purchase_completed" ? "purchase_return_viewed" : name;
}

function enumValue<T extends string>(value: unknown, allowed: Set<T>): T | undefined {
  const normalized = clean(value);
  return normalized && allowed.has(normalized as T) ? (normalized as T) : undefined;
}

export async function POST(request: NextRequest) {
  if (!hasFirebaseAdminConfiguration()) {
    return NextResponse.json({ ok: false, error: "analytics_unavailable" }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ ok: false, error: "invalid_event" }, { status: 400 });
  }

  const eventName = body.eventName ?? legacyEventName(body.name);
  if (!isClientVIEventName(eventName)) {
    return NextResponse.json({ ok: false, error: "invalid_event" }, { status: 400 });
  }

  // Financial event names are intentionally absent from ClientVIEventName. This
  // endpoint therefore cannot be used by a browser to manufacture GMV/revenue.
  const eventId = safeEventId(body.eventId) ?? `legacy_${crypto.randomUUID()}`;
  const sessionId = clean(body.sessionId, 180) ?? `legacy_session_${eventId}`;
  const occurredAt = clean(body.occurredAt, 50) ?? new Date().toISOString();
  const legacyProperties = cleanPayload(body.properties);
  const payload = cleanPayload(body.payload ?? legacyProperties);
  const legacyPath = clean(body.path, 500);
  if (legacyPath && payload.path === undefined) payload.path = legacyPath;

  const island = enumValue(body.island, islands);
  const travelerType = enumValue(body.travelerType, travelerTypes);
  const db = getAdminDb();
  const eventRef = db.collection("viEvents").doc(eventId);
  const legacyRef = db.collection("acquisitionEvents").doc(eventId);

  await db.runTransaction(async (transaction) => {
    const existing = await transaction.get(eventRef);
    if (existing.exists) return;

    const canonicalRecord = {
      eventId,
      eventName,
      schemaVersion: VI_EVENT_SCHEMA_VERSION,
      origin: "client" as const,
      occurredAt,
      receivedAt: FieldValue.serverTimestamp(),
      sessionId,
      userId: clean(body.userId, 180),
      island: island ?? null,
      travelerType: travelerType ?? null,
      source: clean(body.source, 120),
      itineraryId: clean(body.itineraryId, 180),
      listingId: clean(body.listingId, 180),
      providerId: clean(body.providerId, 180),
      bookingId: clean(body.bookingId, 180),
      payload,
      userAgent: clean(request.headers.get("user-agent"), 500),
    };

    transaction.set(eventRef, canonicalRecord);
    transaction.set(legacyRef, {
      name: eventName,
      path: typeof payload.path === "string" ? payload.path : "/",
      attribution: null,
      properties: payload,
      canonicalEventId: eventId,
      sessionId,
      createdAt: FieldValue.serverTimestamp(),
      userAgent: canonicalRecord.userAgent,
    });
  });

  return NextResponse.json({ ok: true, eventId }, { status: 202 });
}
