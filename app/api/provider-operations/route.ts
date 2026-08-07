import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import {
  AuthError,
  authErrorResponse,
  requireSession,
} from "@/lib/auth-server";
import {
  addCalendarDays,
  getUsviToday,
} from "@/lib/booking/booking-dates";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import { canManageListing } from "@/lib/merchant-access";
import type {
  ProviderAvailabilityDay,
  ProviderOperationsConfig,
} from "@/types/provider-operations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OPERATIONS_ROLES = ["admin", "dispatcher", "merchant"] as const;
const PROVIDER_AVAILABILITY_HORIZON_DAYS = 90;

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession([...OPERATIONS_ROLES]);

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
    requireListingAccess(session, listingId);

    const document = await getAdminDb()
      .collection("providerOperations")
      .doc(listingId)
      .get();

    if (!document.exists) {
      return NextResponse.json({
        config: buildDefaultConfig(listingId),
        generated: true,
      });
    }

    return NextResponse.json({
      config: normalizeStoredConfig(document.data(), listingId),
      generated: false,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("provider operations load error", error);
    return NextResponse.json(
      { error: "Unable to load provider operations." },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireSession([...OPERATIONS_ROLES]);

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
    requireListingAccess(session, config.listingId);

    const updatedAt = new Date().toISOString();
    await getAdminDb()
      .collection("providerOperations")
      .doc(config.listingId)
      .set(
        {
          ...config,
          updatedAt,
          updatedByUid: session.uid,
          updatedByEmail: session.email ?? null,
          serverUpdatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

    return NextResponse.json({ config: { ...config, updatedAt } });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("provider operations save error", error);
    return NextResponse.json(
      { error: "Unable to save provider operations." },
      { status: 500 },
    );
  }
}

function requireListingAccess(
  session: Awaited<ReturnType<typeof requireSession>>,
  listingId: string,
) {
  if (!canManageListing(session, listingId)) {
    throw new AuthError(
      "You do not have permission to manage this listing.",
      403,
    );
  }
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
    ? body.days
        .map(normalizeDay)
        .filter((day): day is ProviderAvailabilityDay => Boolean(day))
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
    startTime: validTime(day.startTime) ? day.startTime : "09:00",
    endTime: validTime(day.endTime) ? day.endTime : "17:00",
    ...(clean(day.note, 300) ? { note: clean(day.note, 300) } : {}),
  };
}

function normalizeStoredConfig(
  data: FirebaseFirestore.DocumentData | undefined,
  listingId: string,
): ProviderOperationsConfig {
  const rawDays = data?.days;
  const storedDays = Array.isArray(rawDays) ? rawDays : [];
  const normalizedDays = storedDays
    .map(normalizeDay)
    .filter((day): day is ProviderAvailabilityDay => Boolean(day));
  const defaultCapacity = clampNumber(data?.defaultCapacity, 1, 500, 10);

  return {
    listingId,
    listingName: clean(data?.listingName, 180) || humanizeListingId(listingId),
    timezone: clean(data?.timezone, 80) || "America/St_Thomas",
    defaultCapacity,
    days: buildAvailabilityHorizon(defaultCapacity, normalizedDays),
    updatedAt: String(data?.updatedAt ?? ""),
  };
}

function buildDefaultConfig(listingId: string): ProviderOperationsConfig {
  const defaultCapacity = 10;
  return {
    listingId,
    listingName: humanizeListingId(listingId),
    timezone: "America/St_Thomas",
    defaultCapacity,
    days: buildAvailabilityHorizon(defaultCapacity),
    updatedAt: "",
  };
}

function buildAvailabilityHorizon(
  defaultCapacity: number,
  storedDays: ProviderAvailabilityDay[] = [],
) {
  const today = getUsviToday();
  const storedByDate = new Map(storedDays.map((day) => [day.date, day]));

  return Array.from({ length: PROVIDER_AVAILABILITY_HORIZON_DAYS }, (_, index) => {
    const date = addCalendarDays(today, index);
    const stored = storedByDate.get(date);
    if (stored) return stored;

    return {
      date,
      isOpen: true,
      capacity: defaultCapacity,
      startTime: "09:00",
      endTime: "17:00",
    } satisfies ProviderAvailabilityDay;
  });
}

function humanizeListingId(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function validTime(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
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
