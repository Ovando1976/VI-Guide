import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { parseJsonBody } from "@/lib/api/request";
import { getAdminAuth, getAdminDb, hasFirebaseAdminConfiguration } from "@/lib/firebase-admin";
import { normalizeJourneyPlan } from "@/lib/journey-planner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

async function authenticate(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  try {
    return (await getAdminAuth().verifyIdToken(authorization.slice(7).trim())).uid;
  } catch {
    return null;
  }
}
