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
  OFFICIAL_CRUISE_SCHEDULE_COVERAGE,
  OFFICIAL_USVI_CRUISE_PORT_CALLS,
  type OfficialCruisePortId,
} from "@/lib/cruise-port-calls";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import { canManageListing } from "@/lib/merchant-access";
import {
  buildProviderCruiseDemandDates,
  type ProviderCruiseOfferWindow,
} from "@/lib/provider-cruise-demand";
import type {
  ProviderAvailabilityDay,
  ProviderOperationsConfig,
} from "@/types/provider-operations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OPERATIONS_ROLES = ["admin", "dispatcher", "merchant"] as const;
const PROVIDER_AVAILABILITY_HORIZON_DAYS = 90;
const MAX_CRUISE_PROFILES_PER_LISTING = 50;
const OFFICIAL_CRUISE_PORT_IDS = new Set<OfficialCruisePortId>([
  "havensight",
  "crown_bay",
  "cruz_bay",
  "frederiksted",
]);

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

    const db = getAdminDb();
    const cruiseDemandPromise = loadProviderCruiseDemandDates(db, listingId).catch(
      (error) => {
        console.error("provider cruise demand load error", error);
        return [];
      },
    );
    const [document, cruiseDemandDates] = await Promise.all([
      db.collection("providerOperations").doc(listingId).get(),
      cruiseDemandPromise,
    ]);

    if (!document.exists) {
      return NextResponse.json({
        config: buildDefaultConfig(listingId),
        persistedDates: [],
        generated: true,
        cruiseDemandDates,
        cruiseScheduleCoverage: OFFICIAL_CRUISE_SCHEDULE_COVERAGE,
      });
    }

    const storedDays = normalizeStoredDays(document.data());
    return NextResponse.json({
      config: normalizeStoredConfig(document.data(), listingId, storedDays),
      persistedDates: storedDays.map((day) => day.date),
      generated: false,
      cruiseDemandDates,
      cruiseScheduleCoverage: OFFICIAL_CRUISE_SCHEDULE_COVERAGE,
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

    const db = getAdminDb();
    const operationsRef = db.collection("providerOperations").doc(config.listingId);
    const existing = await operationsRef.get();
    const mergedDays = mergeStoredDays(
      normalizeStoredDays(existing.data()),
      config.days,
    );
    const updatedAt = new Date().toISOString();

    await operationsRef.set(
      {
        ...config,
        days: mergedDays,
        updatedAt,
        updatedByUid: session.uid,
        updatedByEmail: session.email ?? null,
        serverUpdatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return NextResponse.json({
      config: { ...config, days: mergedDays, updatedAt },
      persistedDates: mergedDays.map((day) => day.date),
    });
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

async function loadProviderCruiseDemandDates(
  db: FirebaseFirestore.Firestore,
  listingId: string,
) {
  const profileSnapshot = await db
    .collection("shoreExcursions")
    .where("listingId", "==", listingId)
    .limit(MAX_CRUISE_PROFILES_PER_LISTING)
    .get();

  const profiles = profileSnapshot.docs
    .map((document) => {
      const data = document.data();
      return {
        offerId: document.id,
        offerTitle: clean(data.offerTitle, 120),
        active: clean(data.status, 30) === "active",
        supportedPorts: normalizeCruisePorts(data.supportedPorts),
      };
    })
    .filter(
      (profile) =>
        profile.offerId &&
        profile.offerTitle &&
        profile.active &&
        profile.supportedPorts.length > 0,
    );

  if (!profiles.length) return [];

  const offerDocuments = await Promise.all(
    profiles.map((profile) =>
      db.collection("merchantOffers").doc(profile.offerId).get(),
    ),
  );
  const offers = offerDocuments.flatMap((document, index) => {
    const profile = profiles[index];
    const data = document.data();
    if (!profile || !data) return [];

    const validFrom = isoDate(data.validFrom);
    const validThrough = isoDate(data.validThrough);
    if (!validFrom || !validThrough || validThrough < validFrom) return [];

    const offer: ProviderCruiseOfferWindow = {
      offerId: profile.offerId,
      offerTitle: profile.offerTitle,
      active: clean(data.status, 30) === "active",
      validFrom,
      validThrough,
      supportedPorts: profile.supportedPorts,
    };
    return offer.active ? [offer] : [];
  });

  if (!offers.length) return [];

  const today = getUsviToday();
  const horizonThrough = addCalendarDays(
    today,
    PROVIDER_AVAILABILITY_HORIZON_DAYS - 1,
  );
  const from =
    today < OFFICIAL_CRUISE_SCHEDULE_COVERAGE.from
      ? OFFICIAL_CRUISE_SCHEDULE_COVERAGE.from
      : today;
  const through =
    horizonThrough < OFFICIAL_CRUISE_SCHEDULE_COVERAGE.through
      ? horizonThrough
      : OFFICIAL_CRUISE_SCHEDULE_COVERAGE.through;

  if (!from || !through || through < from) return [];

  return buildProviderCruiseDemandDates({
    offers,
    calls: OFFICIAL_USVI_CRUISE_PORT_CALLS,
    from,
    through,
  });
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

function normalizeStoredDays(
  data: FirebaseFirestore.DocumentData | undefined,
) {
  const rawDays = data?.days;
  const storedDays = Array.isArray(rawDays) ? rawDays : [];
  return storedDays
    .map(normalizeDay)
    .filter((day): day is ProviderAvailabilityDay => Boolean(day));
}

function mergeStoredDays(
  existingDays: ProviderAvailabilityDay[],
  incomingDays: ProviderAvailabilityDay[],
) {
  const byDate = new Map(existingDays.map((day) => [day.date, day]));
  for (const day of incomingDays) byDate.set(day.date, day);
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function normalizeStoredConfig(
  data: FirebaseFirestore.DocumentData | undefined,
  listingId: string,
  storedDays: ProviderAvailabilityDay[] = normalizeStoredDays(data),
): ProviderOperationsConfig {
  const defaultCapacity = clampNumber(data?.defaultCapacity, 1, 500, 10);

  return {
    listingId,
    listingName: clean(data?.listingName, 180) || humanizeListingId(listingId),
    timezone: clean(data?.timezone, 80) || "America/St_Thomas",
    defaultCapacity,
    days: buildAvailabilityHorizon(defaultCapacity, storedDays),
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
      isOpen: false,
      capacity: defaultCapacity,
      startTime: "09:00",
      endTime: "17:00",
    } satisfies ProviderAvailabilityDay;
  });
}

function normalizeCruisePorts(value: unknown): OfficialCruisePortId[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value.filter(
        (port): port is OfficialCruisePortId =>
          typeof port === "string" &&
          OFFICIAL_CRUISE_PORT_IDS.has(port as OfficialCruisePortId),
      ),
    ),
  );
}

function isoDate(value: unknown) {
  const date = clean(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "";
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