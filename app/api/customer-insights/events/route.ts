import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth-server";
import {
  CUSTOMER_INSIGHT_CONSENT_VERSION,
  cleanInsightProperties,
  isCustomerInsightEventName,
} from "@/lib/customer-insights";
import { getAdminDb, hasFirebaseAdminConfiguration } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!hasFirebaseAdminConfiguration()) {
    return NextResponse.json({ error: "insights_unavailable" }, { status: 503 });
  }
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || body.consentVersion !== CUSTOMER_INSIGHT_CONSENT_VERSION) {
    return NextResponse.json({ error: "consent_required" }, { status: 400 });
  }
  if (!isCustomerInsightEventName(body.name)) {
    return NextResponse.json({ error: "invalid_event" }, { status: 400 });
  }
  const sessionId = clean(body.sessionId, 80);
  if (!/^[a-zA-Z0-9-]{16,80}$/.test(sessionId)) {
    return NextResponse.json({ error: "invalid_session" }, { status: 400 });
  }
  const session = await getSession();
  const island = ["stt", "stj", "stx"].includes(String(body.island))
    ? String(body.island)
    : null;
  await getAdminDb().collection("customerInsightEvents").add({
    name: body.name,
    sessionId,
    ...(session ? { userId: session.uid } : {}),
    path: clean(body.path, 240) || "/",
    island,
    properties: cleanInsightProperties(body.properties),
    consentVersion: CUSTOMER_INSIGHT_CONSENT_VERSION,
    createdAt: FieldValue.serverTimestamp(),
  });
  return NextResponse.json({ ok: true }, { status: 202 });
}

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}
