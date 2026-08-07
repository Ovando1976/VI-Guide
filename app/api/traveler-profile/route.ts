import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { parseJsonBody } from "@/lib/api/request";
import {
  getAdminAuth,
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import { normalizeActiveTrip } from "@/lib/intelligence/active-trip";
import type {
  IntelligenceLocation,
  IntelligenceMemory,
  IntelligenceNotificationPreferences,
} from "@/types/intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const identity = await authenticate(request);
  if (!identity) return unauthorized();
  if (!hasFirebaseAdminConfiguration()) return unavailable();

  const snapshot = await profileDocument(identity.uid).get();
  const data = snapshot.data();
  return NextResponse.json(
    {
      memory: normalizeMemory(data?.memory),
      updatedAt:
        typeof data?.clientUpdatedAt === "string" ? data.clientUpdatedAt : "",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PUT(request: NextRequest) {
  const identity = await authenticate(request);
  if (!identity) return unauthorized();
  if (!hasFirebaseAdminConfiguration()) return unavailable();

  const parsed = await parseJsonBody<{ memory?: unknown }>(request);
  if (
    !parsed.ok ||
    !parsed.value.memory ||
    typeof parsed.value.memory !== "object"
  ) {
    return NextResponse.json(
      { error: "Invalid traveler profile payload." },
      { status: 400 },
    );
  }

  const memory = normalizeMemory(parsed.value.memory);
  const clientUpdatedAt = new Date().toISOString();
  await profileDocument(identity.uid).set(
    {
      ownerId: identity.uid,
      ownerEmail: identity.email,
      memory,
      clientUpdatedAt,
      serverUpdatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return NextResponse.json({ ok: true, memory, updatedAt: clientUpdatedAt });
}

function profileDocument(userId: string) {
  return getAdminDb()
    .collection("users")
    .doc(userId)
    .collection("profile")
    .doc("travel");
}

async function authenticate(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice(7).trim();
  if (!token) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return {
      uid: decoded.uid,
      email:
        typeof decoded.email === "string"
          ? decoded.email.trim().toLowerCase().slice(0, 220)
          : null,
    };
  } catch {
    return null;
  }
}

function normalizeMemory(value: unknown): IntelligenceMemory {
  if (!value || typeof value !== "object") return {};
  const input = value as IntelligenceMemory;
  const preferredIsland = normalizeIsland(input.preferredIsland);
  const pace = input.preferences?.pace;
  const budget = input.preferences?.budget;
  const port = normalizeLocation(input.cruise?.port);
  const stay = normalizeLocation(input.stay);
  const activeTrip = normalizeActiveTrip(input.activeTrip);

  return {
    ...(preferredIsland ? { preferredIsland } : {}),
    party: {
      adults: clamp(input.party?.adults, 1, 20),
      children: clamp(input.party?.children, 0, 20),
      accessibilityNeeds: strings(input.party?.accessibilityNeeds, 12),
    },
    preferences: {
      interests: strings(input.preferences?.interests, 24),
      ...(pace === "relaxed" || pace === "balanced" || pace === "active"
        ? { pace }
        : {}),
      ...(budget === "value" ||
      budget === "moderate" ||
      budget === "premium"
        ? { budget }
        : {}),
      food: strings(input.preferences?.food, 20),
      avoid: strings(input.preferences?.avoid, 20),
    },
    notifications: normalizeNotificationPreferences(input.notifications),
    recentPlaceIds: strings(input.recentPlaceIds, 40),
    savedPlaceIds: strings(input.savedPlaceIds, 100),
    ...(input.cruise && typeof input.cruise === "object"
      ? {
          cruise: {
            ...(typeof input.cruise.tripId === "string" && input.cruise.tripId.trim()
              ? { tripId: input.cruise.tripId.trim().slice(0, 160) }
              : {}),
            ...(typeof input.cruise.sailingId === "string" && input.cruise.sailingId.trim()
              ? { sailingId: input.cruise.sailingId.trim().slice(0, 160) }
              : {}),
            ...(typeof input.cruise.cruiseLine === "string" && input.cruise.cruiseLine.trim()
              ? { cruiseLine: input.cruise.cruiseLine.trim().slice(0, 160) }
              : {}),
            ...(typeof input.cruise.ship === "string"
              ? { ship: input.cruise.ship.trim().slice(0, 120) }
              : {}),
            ...(validDate(input.cruise.portCallDate)
              ? { portCallDate: input.cruise.portCallDate }
              : {}),
            ...(port ? { port } : {}),
            ...(validTime(input.cruise.arrivalTime)
              ? { arrivalTime: input.cruise.arrivalTime }
              : {}),
            ...(validTime(input.cruise.allAboardTime)
              ? { allAboardTime: input.cruise.allAboardTime }
              : {}),
            ...(input.cruise.allAboardSource === "derived_from_scheduled_departure" ||
            input.cruise.allAboardSource === "confirmed" ||
            input.cruise.allAboardSource === "unavailable"
              ? { allAboardSource: input.cruise.allAboardSource }
              : {}),
          },
        }
      : {}),
    ...(stay ? { stay } : {}),
    ...(activeTrip ? { activeTrip } : {}),
  };
}

function normalizeNotificationPreferences(
  value: unknown,
): IntelligenceNotificationPreferences {
  const input =
    value && typeof value === "object"
      ? (value as IntelligenceNotificationPreferences)
      : {};
  const minimumSeverity =
    input.minimumSeverity === "medium" ||
    input.minimumSeverity === "high" ||
    input.minimumSeverity === "critical"
      ? input.minimumSeverity
      : "high";
  return {
    tripMonitoring: input.tripMonitoring !== false,
    inApp: input.inApp !== false,
    email: input.email === true,
    minimumSeverity,
    notifyOnRecovery: input.notifyOnRecovery !== false,
  };
}

function normalizeLocation(value: unknown): IntelligenceLocation | undefined {
  if (!value || typeof value !== "object") return undefined;
  const location = value as Partial<IntelligenceLocation>;
  const island = normalizeIsland(location.island);
  if (
    !island ||
    typeof location.name !== "string" ||
    !location.name.trim()
  ) {
    return undefined;
  }
  return {
    ...(typeof location.id === "string"
      ? { id: location.id.slice(0, 160) }
      : {}),
    name: location.name.trim().slice(0, 160),
    island,
    ...(finite(location.lat) ? { lat: location.lat } : {}),
    ...(finite(location.lng) ? { lng: location.lng } : {}),
    ...(typeof location.kind === "string"
      ? { kind: location.kind.slice(0, 80) }
      : {}),
  };
}

function normalizeIsland(value: unknown) {
  return value === "stt" || value === "stj" || value === "stx"
    ? value
    : undefined;
}

function strings(value: unknown, limit: number) {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim().slice(0, 160))
        .filter(Boolean),
    ),
  ).slice(0, limit);
}

function clamp(value: unknown, minimum: number, maximum: number) {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.max(minimum, Math.min(maximum, number))
    : minimum;
}

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function validDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function validTime(value: unknown): value is string {
  return (
    typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
  );
}

function unauthorized() {
  return NextResponse.json(
    { error: "Authentication required." },
    { status: 401 },
  );
}

function unavailable() {
  return NextResponse.json(
    { error: "Authenticated traveler profiles are not configured." },
    { status: 503 },
  );
}
