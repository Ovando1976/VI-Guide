import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, hasFirebaseAdminConfiguration } from "@/lib/firebase-admin";
import type { ConciergeTravelerProfile } from "@/types/concierge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanProfile(value: unknown): ConciergeTravelerProfile {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const list = (key: string) => Array.isArray(source[key])
    ? source[key].filter((item): item is string => typeof item === "string").slice(0, 12).map((item) => item.slice(0, 80))
    : undefined;

  const budget = ["value", "moderate", "premium", "luxury"].includes(String(source.budget))
    ? source.budget as ConciergeTravelerProfile["budget"]
    : undefined;
  const pace = ["relaxed", "balanced", "active"].includes(String(source.pace))
    ? source.pace as ConciergeTravelerProfile["pace"]
    : undefined;

  return {
    partySize: Math.max(1, Math.min(12, Number(source.partySize) || 1)),
    children: Math.max(0, Math.min(12, Number(source.children) || 0)),
    seniors: Math.max(0, Math.min(12, Number(source.seniors) || 0)),
    accessibilityNeeds: list("accessibilityNeeds"),
    budget,
    interests: list("interests"),
    pace,
    dislikes: list("dislikes"),
    lodgingName: typeof source.lodgingName === "string" ? source.lodgingName.slice(0, 120) : null,
    cruiseShip: typeof source.cruiseShip === "string" ? source.cruiseShip.slice(0, 120) : null,
    arrivalTime: typeof source.arrivalTime === "string" ? source.arrivalTime.slice(0, 20) : null,
    departureTime: typeof source.departureTime === "string" ? source.departureTime.slice(0, 20) : null,
  };
}

export async function POST(request: NextRequest) {
  if (!hasFirebaseAdminConfiguration()) {
    return NextResponse.json({ memoryStatus: "session-only", profile: null });
  }

  const body = (await request.json().catch(() => null)) as { clientId?: unknown; profile?: unknown } | null;
  if (!body || typeof body.clientId !== "string" || body.clientId.length < 8 || body.clientId.length > 100) {
    return NextResponse.json({ error: "A valid clientId is required." }, { status: 400 });
  }

  const profile = cleanProfile(body.profile);
  const db = getAdminDb();
  const ref = db.collection("conciergeProfiles").doc(body.clientId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 100));
  await ref.set({ ...profile, updatedAt: FieldValue.serverTimestamp() }, { merge: true });

  return NextResponse.json({ memoryStatus: "durable", profile });
}

export async function GET(request: NextRequest) {
  if (!hasFirebaseAdminConfiguration()) {
    return NextResponse.json({ memoryStatus: "session-only", profile: null });
  }

  const clientId = request.nextUrl.searchParams.get("clientId") ?? "";
  if (!/^[a-zA-Z0-9_-]{8,100}$/.test(clientId)) {
    return NextResponse.json({ error: "A valid clientId is required." }, { status: 400 });
  }

  const snapshot = await getAdminDb().collection("conciergeProfiles").doc(clientId).get();
  return NextResponse.json({
    memoryStatus: snapshot.exists ? "durable" : "session-only",
    profile: snapshot.exists ? snapshot.data() : null,
  }, { headers: { "Cache-Control": "no-store" } });
}
