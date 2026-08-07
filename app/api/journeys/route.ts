import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { getAdminAuth, getAdminDb, hasFirebaseAdminConfiguration } from "@/lib/firebase-admin";
import {
  normalizeJourneyPlan,
  type JourneyPlan,
} from "@/lib/journey-planner";
import {
  journeyTombstoneIds,
  mergeJourneyTombstones,
  normalizeJourneyTombstones,
} from "@/lib/journey-sync-state";
import {
  normalizeTravelerTripSelection,
  resolveTravelerTripSelection,
} from "@/lib/traveler-trip-selection";
import { parseJsonBody } from "@/lib/api/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PLANS = 24;
const MAX_TOMBSTONES = 120;

export async function GET(request: NextRequest) {
  const userId = await authenticate(request);
  if (!userId) return unauthorized();
  if (!hasFirebaseAdminConfiguration()) return unavailable();

  const db = getAdminDb();
  const userRef = db.collection("users").doc(userId);
  const journeys = userRef.collection("journeys");
  const syncStateRef = userRef.collection("journeySync").doc("state");
  const [snapshot, syncStateSnapshot] = await Promise.all([
    journeys.orderBy("updatedAt", "desc").limit(MAX_PLANS).get(),
    syncStateRef.get(),
  ]);

  const tombstones = normalizeJourneyTombstones(syncStateSnapshot.data()?.tombstones);
  const deleted = journeyTombstoneIds(tombstones);
  const plans = snapshot.docs
    .map((document) => normalizeJourneyPlan(document.data()))
    .filter(isJourneyPlan)
    .filter((plan) => !deleted.has(plan.id));
  const selection = resolveTravelerTripSelection({
    remote: normalizeTravelerTripSelection({
      planId: syncStateSnapshot.data()?.activePlanId,
      updatedAt: syncStateSnapshot.data()?.activePlanUpdatedAt,
    }),
    availablePlanIds: plans.map((plan) => plan.id),
  });

  return NextResponse.json(
    syncPayload(plans, tombstones, selection),
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PUT(request: NextRequest) {
  const userId = await authenticate(request);
  if (!userId) return unauthorized();
  if (!hasFirebaseAdminConfiguration()) return unavailable();

  const parsed = await parseJsonBody<{
    plans?: unknown;
    tombstones?: unknown;
    activePlanId?: unknown;
    activePlanUpdatedAt?: unknown;
  }>(request);
  if (
    !parsed.ok ||
    !Array.isArray(parsed.value.plans) ||
    parsed.value.plans.length > MAX_PLANS ||
    (parsed.value.tombstones !== undefined &&
      (!Array.isArray(parsed.value.tombstones) ||
        parsed.value.tombstones.length > MAX_TOMBSTONES))
  ) {
    return NextResponse.json({ error: "Invalid journey payload." }, { status: 400 });
  }

  const plans = parsed.value.plans.map(normalizeJourneyPlan);
  if (plans.some((plan) => !plan)) {
    return NextResponse.json({ error: "Invalid journey payload." }, { status: 400 });
  }
  const normalizedPlans = plans.filter(isJourneyPlan);
  const incomingTombstones = normalizeJourneyTombstones(
    parsed.value.tombstones ?? [],
  );
  const incomingSelection = normalizeTravelerTripSelection({
    planId: parsed.value.activePlanId,
    updatedAt: parsed.value.activePlanUpdatedAt,
  });

  const db = getAdminDb();
  const userRef = db.collection("users").doc(userId);
  const collection = userRef.collection("journeys");
  const syncStateRef = userRef.collection("journeySync").doc("state");
  const [existing, syncStateSnapshot] = await Promise.all([
    collection.limit(MAX_PLANS * 2).get(),
    syncStateRef.get(),
  ]);

  const serverTombstones = normalizeJourneyTombstones(
    syncStateSnapshot.data()?.tombstones,
  );
  const tombstones = mergeJourneyTombstones(
    serverTombstones,
    incomingTombstones,
  );
  const deleted = journeyTombstoneIds(tombstones);
  const acceptedPlans = normalizedPlans.filter((plan) => !deleted.has(plan.id));
  const incomingIds = new Set(acceptedPlans.map((plan) => plan.id));
  const serverSelection = normalizeTravelerTripSelection({
    planId: syncStateSnapshot.data()?.activePlanId,
    updatedAt: syncStateSnapshot.data()?.activePlanUpdatedAt,
  });
  const selection = resolveTravelerTripSelection({
    local: serverSelection,
    remote: incomingSelection,
    availablePlanIds: acceptedPlans.map((plan) => plan.id),
  });
  const batch = db.batch();

  for (const plan of acceptedPlans) {
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
    if (!incomingIds.has(document.id) || deleted.has(document.id)) {
      batch.delete(document.ref);
    }
  }

  batch.set(
    syncStateRef,
    {
      ownerId: userId,
      tombstones,
      activePlanId: selection.planId,
      activePlanUpdatedAt: selection.updatedAt,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await batch.commit();
  return NextResponse.json(
    syncPayload(acceptedPlans, tombstones, selection),
    { headers: { "Cache-Control": "no-store" } },
  );
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

function syncPayload(
  plans: JourneyPlan[],
  tombstones: ReturnType<typeof normalizeJourneyTombstones>,
  selection: ReturnType<typeof normalizeTravelerTripSelection>,
) {
  return {
    plans,
    tombstones,
    activePlanId: selection.planId,
    activePlanUpdatedAt: selection.updatedAt,
  };
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
