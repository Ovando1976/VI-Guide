import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { parseJsonBody } from "@/lib/api/request";
import { getAdminAuth, getAdminDb, hasFirebaseAdminConfiguration } from "@/lib/firebase-admin";
import { normalizeJourneyPlan } from "@/lib/journey-planner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const userId = await authenticate(request);
  if (!userId) return NextResponse.json({ error: "Sign in to manage shared journeys." }, { status: 401 });
  if (!hasFirebaseAdminConfiguration()) {
    return NextResponse.json({ error: "Journey sharing is not configured." }, { status: 503 });
  }

  const snapshot = await getAdminDb()
    .collection("sharedJourneys")
    .where("ownerId", "==", userId)
    .limit(50)
    .get();
  const shares = snapshot.docs
    .flatMap((document) => {
      const plan = normalizeJourneyPlan(document.data().plan);
      if (!plan) return [];
      const createdAt = document.data().createdAt;
      return [{
        id: document.id,
        href: `/shared-trip/${document.id}`,
        planId: plan.id,
        title: plan.title,
        island: plan.island,
        date: plan.date,
        stopCount: plan.plan.length,
        createdAt: typeof createdAt?.toDate === "function" ? createdAt.toDate().toISOString() : "",
      }];
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return NextResponse.json({ shares }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const userId = await authenticate(request);
  if (!userId) return NextResponse.json({ error: "Sign in to share a journey." }, { status: 401 });
  if (!hasFirebaseAdminConfiguration()) {
    return NextResponse.json({ error: "Journey sharing is not configured." }, { status: 503 });
  }

  const parsed = await parseJsonBody<{ plan?: unknown }>(request);
  const plan = parsed.ok ? normalizeJourneyPlan(parsed.value.plan) : null;
  if (!plan) return NextResponse.json({ error: "Invalid journey." }, { status: 400 });

  const document = getAdminDb().collection("sharedJourneys").doc();
  await document.set({
    ownerId: userId,
    plan,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({
    shareId: document.id,
    href: `/shared-trip/${document.id}`,
  });
}

export async function DELETE(request: NextRequest) {
  const userId = await authenticate(request);
  if (!userId) return NextResponse.json({ error: "Sign in to revoke a shared journey." }, { status: 401 });
  if (!hasFirebaseAdminConfiguration()) {
    return NextResponse.json({ error: "Journey sharing is not configured." }, { status: 503 });
  }
  const parsed = await parseJsonBody<{ shareId?: unknown }>(request);
  const shareId = parsed.ok && typeof parsed.value.shareId === "string" ? parsed.value.shareId : "";
  if (!/^[a-zA-Z0-9]{12,40}$/.test(shareId)) {
    return NextResponse.json({ error: "Invalid shared journey." }, { status: 400 });
  }
  const reference = getAdminDb().collection("sharedJourneys").doc(shareId);
  const snapshot = await reference.get();
  if (!snapshot.exists || snapshot.data()?.ownerId !== userId) {
    return NextResponse.json({ error: "Shared journey not found." }, { status: 404 });
  }
  await reference.delete();
  return NextResponse.json({ ok: true });
}

async function authenticate(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  try {
    return (await getAdminAuth().verifyIdToken(authorization.slice(7).trim())).uid;
  } catch {
    return null;
  }
}
