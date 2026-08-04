import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import type {
  ProviderAvailabilityDay,
  ProviderOperationsConfig,
} from "@/types/provider-operations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!hasFirebaseAdminConfiguration()) {
    return NextResponse.json(
      { error: "Provider operations are not configured on the server." },
      { status: 503 },
    );
  }

  const listingId = clean(request.nextUrl.searchParams.get("listingId"), 160);
  if (!listingId) {
    return NextResponse.json({ error: "A listingId is required." }, { status: 400 });
  }

  const document = await getAdminDb()
    .collection("providerOperations")
    .doc(listingId)
    .get();

  if (!document.exists) {
    return NextResponse.json({ config: null });
  }

  return NextResponse.json({ config: normalizeStoredConfig(document.data(), listingId) });
}

export async function PUT(request: NextRequest) {
  if (!hasFirebaseAdminConfiguration()) {
    return NextResponse.json(
      { error: "Provider operations are not configured on the server." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | Partial<ProviderOperationsConfig>
    | null;
  const config = normalizeInput(body);

  if (!config) {
    return NextResponse.json(
      { error: "Complete the listing and availability details." },
      { status: 400 },
    );
  }

  const updatedAt = new Date().toISOString();
  await getAdminDb()
    .collection("providerOperations")
    .doc(config.listingId)
    .set(
      {
        ...config,
        updatedAt,
        serverUpdatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

  return NextResponse.json({ config: { ...config, updatedAt } });
}

function normalizeInput(
  body: Partial<ProviderOperationsConfig> | null,
): ProviderOperationsConfig | null {
  if (!body) return null;

  const listingId = clean(body.listingId, 160);
  const listingName = clean(body.listingName, 180);
  const timezone = clean(body.timezone, 80) || "America/St_Thomas";
  const defaultCapacity = clampNumber(body.defaultCapacity, 1, 500, 10);
  const days = Array.isArray(body.days)
    ? body.days.map(normalizeDay).filter((day): day is ProviderAvailabilityDay => Boolean(day))
    : [];

  if (!listingId || !listingName) return null;

  return {
    listingId,
    listingName,
    timezone,
    defaultCapacity,
    days,
    updatedAt: new Date().toISOString(),
  };
}

function normalizeDay(value: unknown): ProviderAvailabilityDay | null {
  if (!value || typeof value !== "object") return null;
  const day = value as Partial<ProviderAvailabilityDay>;
  const date = clean(day.date, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  return {
    date,
    isOpen: Boolean(day.isOpen),
    capacity: clampNumber(day.capacity, 0, 500, 0),
    startTime: clean(day.startTime, 5) || "09:00",
    endTime: clean(day.endTime, 5) || "17:00",
    ...(clean(day.note, 300) ? { note: clean(day.note, 300) } : {}),
  };
}

function normalizeStoredConfig(
  data: FirebaseFirestore.DocumentData | undefined,
  listingId: string,
): ProviderOperationsConfig {
  const storedDays = Array.isArray(data?.days) ? data.days : [];

  return {
    listingId,
    listingName: String(data?.listingName ?? "Provider"),
    timezone: String(data?.timezone ?? "America/St_Thomas"),
    defaultCapacity: Number(data?.defaultCapacity ?? 10),
    days: storedDays
      .map(normalizeDay)
      .filter((day): day is ProviderAvailabilityDay => Boolean(day)),
    updatedAt: String(data?.updatedAt ?? ""),
  };
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.round(number)));
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
