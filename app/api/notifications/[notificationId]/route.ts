import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ notificationId: string }> },
) {
  if (!hasFirebaseAdminConfiguration()) {
    return NextResponse.json(
      { error: "Notifications are not configured on the server." },
      { status: 503 },
    );
  }

  const { notificationId } = await context.params;
  const id = clean(notificationId, 160);
  const body = (await request.json().catch(() => null)) as
    | { read?: unknown }
    | null;

  if (!id || typeof body?.read !== "boolean") {
    return NextResponse.json(
      { error: "A valid notification and read state are required." },
      { status: 400 },
    );
  }

  const reference = getAdminDb().collection("notifications").doc(id);
  const snapshot = await reference.get();
  if (!snapshot.exists) {
    return NextResponse.json({ error: "Notification not found." }, { status: 404 });
  }

  const updatedAt = new Date().toISOString();
  const readAt = body.read ? updatedAt : null;
  await reference.update({
    readAt,
    updatedAt,
    serverUpdatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ notification: { id, readAt, updatedAt } });
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
