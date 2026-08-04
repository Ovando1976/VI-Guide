import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import type {
  NotificationAudience,
  NotificationKind,
  NotificationPriority,
  ViNotification,
} from "@/types/notification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AUDIENCES: NotificationAudience[] = ["traveler", "merchant", "operations"];
const KINDS: NotificationKind[] = [
  "booking",
  "mission",
  "provider",
  "concierge",
  "operations",
];
const PRIORITIES: NotificationPriority[] = ["normal", "high"];

export async function GET(request: NextRequest) {
  if (!hasFirebaseAdminConfiguration()) {
    return NextResponse.json(
      { error: "Notifications are not configured on the server." },
      { status: 503 },
    );
  }

  const audience = clean(request.nextUrl.searchParams.get("audience"), 40);
  if (!isAudience(audience)) {
    return NextResponse.json({ error: "A valid audience is required." }, { status: 400 });
  }

  const snapshot = await getAdminDb()
    .collection("notifications")
    .where("audience", "==", audience)
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();

  const notifications = snapshot.docs.map((document) => {
    const data = document.data();
    return normalizeStoredNotification(document.id, data, audience);
  });

  return NextResponse.json({ notifications });
}

export async function POST(request: NextRequest) {
  if (!hasFirebaseAdminConfiguration()) {
    return NextResponse.json(
      { error: "Notifications are not configured on the server." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | Partial<ViNotification>
    | null;
  const notification = normalizeInput(body);

  if (!notification) {
    return NextResponse.json(
      { error: "Complete the notification details." },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const document = await getAdminDb().collection("notifications").add({
    ...notification,
    createdAt: now,
    updatedAt: now,
    readAt: null,
    serverCreatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json(
    {
      notification: {
        id: document.id,
        ...notification,
        createdAt: now,
        updatedAt: now,
        readAt: null,
      },
    },
    { status: 201 },
  );
}

function normalizeInput(
  body: Partial<ViNotification> | null,
): Omit<ViNotification, "id" | "createdAt" | "updatedAt" | "readAt"> | null {
  if (!body) return null;

  const audience = body.audience;
  const kind = body.kind;
  const priority = body.priority ?? "normal";
  const title = clean(body.title, 160);
  const message = clean(body.message, 800);

  if (
    !isAudience(audience) ||
    !isKind(kind) ||
    !isPriority(priority) ||
    !title ||
    !message
  ) {
    return null;
  }

  return {
    audience,
    kind,
    priority,
    title,
    message,
    ...(clean(body.href, 500) ? { href: clean(body.href, 500) } : {}),
    ...(clean(body.reference, 120)
      ? { reference: clean(body.reference, 120) }
      : {}),
  };
}

function normalizeStoredNotification(
  id: string,
  data: FirebaseFirestore.DocumentData,
  audience: NotificationAudience,
): ViNotification {
  const kind = isKind(data.kind) ? data.kind : "operations";
  const priority = isPriority(data.priority) ? data.priority : "normal";

  return {
    id,
    audience,
    kind,
    priority,
    title: String(data.title ?? "VI Guide update"),
    message: String(data.message ?? "A new update is available."),
    ...(data.href ? { href: String(data.href) } : {}),
    ...(data.reference ? { reference: String(data.reference) } : {}),
    readAt: data.readAt ? String(data.readAt) : null,
    createdAt: String(data.createdAt ?? ""),
    updatedAt: String(data.updatedAt ?? data.createdAt ?? ""),
  };
}

function isAudience(value: unknown): value is NotificationAudience {
  return typeof value === "string" && AUDIENCES.includes(value as NotificationAudience);
}

function isKind(value: unknown): value is NotificationKind {
  return typeof value === "string" && KINDS.includes(value as NotificationKind);
}

function isPriority(value: unknown): value is NotificationPriority {
  return typeof value === "string" && PRIORITIES.includes(value as NotificationPriority);
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
