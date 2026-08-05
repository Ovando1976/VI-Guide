import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { getAdminDb, hasFirebaseAdminConfiguration } from "@/lib/firebase-admin";
import { processBookingNotificationOutboxIds } from "@/lib/notifications/booking-notification-delivery";
import {
  manualNotificationRetryPatch,
  normalizeNotificationOutboxStatus,
  normalizeNotificationRetryIds,
  notificationCanBeManuallyRetried,
  summarizeNotificationOutbox,
} from "@/lib/notifications/booking-notification-operations";
import { normalizeTimestampOrEpoch } from "@/lib/timestamps";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireSession(["admin", "dispatcher"]);
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Notification operations are not configured." },
        { status: 503 },
      );
    }

    const snapshot = await getAdminDb()
      .collection("notificationOutbox")
      .orderBy("updatedAt", "desc")
      .limit(200)
      .get();
    const now = new Date();
    const deliveries = snapshot.docs.map((document) => {
      const data = document.data();
      return {
        id: document.id,
        bookingId: clean(data.bookingId, 160),
        reference: clean(data.reference, 160) || document.id,
        event: clean(data.event, 80),
        audience: clean(data.audience, 40),
        listingId: clean(data.listingId, 160),
        listingName: clean(data.listingName, 180) || "VI Guide booking",
        recipientEmail: clean(data.recipientEmail, 220) || null,
        title: clean(data.title, 180),
        status: normalizeNotificationOutboxStatus(data.status) ?? "pending",
        attempts: Math.max(0, Number(data.attempts ?? 0)),
        provider: clean(data.provider, 40) || null,
        providerMessageId: clean(data.providerMessageId, 220) || null,
        lastError: clean(data.lastError, 500) || null,
        nextAttemptAt: nullableTimestamp(data.nextAttemptAt),
        leaseUntil: nullableTimestamp(data.leaseUntil),
        deliveredAt: nullableTimestamp(data.deliveredAt),
        failedAt: nullableTimestamp(data.failedAt),
        createdAt: normalizeTimestampOrEpoch(data.createdAt),
        updatedAt: normalizeTimestampOrEpoch(data.updatedAt ?? data.createdAt),
        retryable: notificationCanBeManuallyRetried(data, now),
      };
    });

    return NextResponse.json({
      canRetry: session.role === "admin",
      summary: summarizeNotificationOutbox(deliveries, now),
      deliveries,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("notification outbox list error", error);
    return NextResponse.json(
      { error: "Unable to load notification delivery operations." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(["admin"]);
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Notification operations are not configured." },
        { status: 503 },
      );
    }

    const body = (await request.json().catch(() => null)) as
      | { ids?: unknown }
      | null;
    const ids = normalizeNotificationRetryIds(body?.ids);
    if (!ids.length) {
      return NextResponse.json(
        { error: "Choose at least one retryable notification." },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const now = new Date();
    const retryPatch = manualNotificationRetryPatch({
      actorUid: session.uid,
      actorEmail: session.email,
      now,
    });

    const requeuedIds = await db.runTransaction(async (transaction) => {
      const records: Array<{
        id: string;
        ref: FirebaseFirestore.DocumentReference;
        data: FirebaseFirestore.DocumentData | null;
      }> = [];

      for (const id of ids) {
        const ref = db.collection("notificationOutbox").doc(id);
        const snapshot = await transaction.get(ref);
        records.push({
          id,
          ref,
          data: snapshot.exists ? snapshot.data() ?? {} : null,
        });
      }

      const eligible: string[] = [];
      for (const record of records) {
        if (
          !record.data ||
          !notificationCanBeManuallyRetried(record.data, now)
        ) {
          continue;
        }

        transaction.update(record.ref, {
          ...retryPatch,
          serverUpdatedAt: FieldValue.serverTimestamp(),
        });
        transaction.set(db.collection("notificationOutboxAudit").doc(), {
          action: "manual_retry",
          outboxId: record.id,
          previousStatus:
            normalizeNotificationOutboxStatus(record.data.status) ?? "unknown",
          previousAttempts: Math.max(0, Number(record.data.attempts ?? 0)),
          actorUid: session.uid,
          actorEmail: session.email ?? null,
          createdAt: now.toISOString(),
          serverCreatedAt: FieldValue.serverTimestamp(),
        });
        eligible.push(record.id);
      }

      return eligible;
    });

    if (!requeuedIds.length) {
      return NextResponse.json(
        {
          error:
            "None of the selected notifications are currently eligible for retry.",
        },
        { status: 409 },
      );
    }

    const delivery = await processBookingNotificationOutboxIds(db, requeuedIds);
    return NextResponse.json({
      ok: true,
      requested: ids.length,
      requeued: requeuedIds.length,
      delivery,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("notification outbox retry error", error);
    return NextResponse.json(
      { error: "Unable to retry notification delivery." },
      { status: 500 },
    );
  }
}

function nullableTimestamp(value: unknown) {
  return value ? normalizeTimestampOrEpoch(value) : null;
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
