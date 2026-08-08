import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { getAdminDb, hasFirebaseAdminConfiguration } from "@/lib/firebase-admin";
import type { AcquisitionAttribution, AcquisitionEventName } from "@/lib/acquisition";

const allowedEvents = new Set<AcquisitionEventName>([
  "landing_view", "intent_selected", "concierge_started", "ride_started",
  "quote_generated", "auth_started", "account_created", "checkout_started",
  "purchase_completed", "offer_viewed", "offer_requested", "trip_created",
]);

const clean = (value: unknown, max = 160) =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;

type AcquisitionPropertyValue = string | number | boolean | null;
type AcquisitionPropertyEntry = [string, AcquisitionPropertyValue];

function cleanAttribution(value: unknown): Partial<AcquisitionAttribution> | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  return {
    source: clean(input.source) ?? undefined,
    medium: clean(input.medium) ?? undefined,
    campaign: clean(input.campaign) ?? undefined,
    referrer: clean(input.referrer, 500) ?? undefined,
    partnerId: clean(input.partnerId) ?? undefined,
    placementId: clean(input.placementId) ?? undefined,
    landingPath: clean(input.landingPath, 500) ?? undefined,
    firstSeenAt: clean(input.firstSeenAt) ?? undefined,
    lastSeenAt: clean(input.lastSeenAt) ?? undefined,
  };
}

function cleanProperties(value: unknown): Record<string, AcquisitionPropertyValue> {
  if (!value || typeof value !== "object") return {};

  const entries: AcquisitionPropertyEntry[] = [];
  for (const [key, item] of Object.entries(value as Record<string, unknown>).slice(0, 30)) {
    if (!/^[a-zA-Z0-9_.-]{1,64}$/.test(key)) continue;
    if (typeof item === "string") entries.push([key, item.slice(0, 300)]);
    else if (typeof item === "number" && Number.isFinite(item)) entries.push([key, item]);
    else if (typeof item === "boolean" || item === null) entries.push([key, item]);
  }

  return Object.fromEntries(entries);
}

export async function POST(request: NextRequest) {
  if (!hasFirebaseAdminConfiguration()) {
    return NextResponse.json({ ok: false, error: "analytics_unavailable" }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const name = clean(body?.name) as AcquisitionEventName | null;
  if (!name || !allowedEvents.has(name)) {
    return NextResponse.json({ ok: false, error: "invalid_event" }, { status: 400 });
  }

  const path = clean(body?.path, 500) ?? "/";
  const attribution = cleanAttribution(body?.attribution);
  const properties = cleanProperties(body?.properties);

  await getAdminDb().collection("acquisitionEvents").add({
    name,
    path,
    attribution,
    properties,
    createdAt: FieldValue.serverTimestamp(),
    userAgent: clean(request.headers.get("user-agent"), 500),
  });

  return NextResponse.json({ ok: true }, { status: 202 });
}
