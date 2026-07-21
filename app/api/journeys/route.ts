import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { getAdminAuth, getAdminDb, hasFirebaseAdminConfiguration } from "@/lib/firebase-admin";
import { normalizeJourneyPlan, type JourneyPlan } from "@/lib/journey-planner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PLANS = 24;

export async function GET(request: NextRequest) {
  const userId = await authenticate(request);
  if (!userId) return unauthorized();
  if (!hasFirebaseAdminConfiguration()) return unavailable();

  const snapshot = await getAdminDb()
    .collection("users")
    .doc(userId)
    .collection("journeys")
    .orderBy("updatedAt", "desc")
    .limit(MAX_PLANS)
    .get();

  const plans = snapshot.docs
    .map((document) => normalizeJourneyPlan(document.data()))
    .filter(isJourneyPlan);

  return NextResponse.json({ plans }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: NextRequest) {
  const userId = await authenticate(request);
  if (!userId) return unauthorized();
  if (!hasFirebaseAdminConfiguration()) return unavailable();

  const payload = (await request.json().catch(() => null)) as { plans?: unknown } | null;
  if (!payload || !Array.isArray(payload.plans) || payload.plans.length > MAX_PLANS) {
    return NextResponse.json({ error: "Invalid journey payload." }, { status: 400 });
  }

  const plans = payload.plans.map(normalizeJourneyPlan).filter(isJourneyPlan);
  const db = getAdminDb();
  const collection = db.collection("users").doc(userId).collection("journeys");
  const existing = await collection.limit(MAX_PLANS * 2).get();
  const incomingIds = new Set(plans.map((plan) => plan.id));
  const batch = db.batch();

  for (const plan of plans) {
    batch.set(
      collection.doc(plan.id),
      {
        ...plan,
        ownerId: userId,
        serverUpdatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  for (const document of existing.docs) {
    if (!incomingIds.has(document.id)) batch.delete(document.ref);
  }

  await batch.commit();
  return NextResponse.json({ ok: true, plans });
}

async function authenticate(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice(7).trim();
  if (!token) return null;

  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

function unavailable() {
  return NextResponse.json(
    { error: "Authenticated journey storage is not configured." },
    { status: 503 },
  );
}

function isJourneyPlan(value: JourneyPlan | null): value is JourneyPlan {
  return value !== null;
}
