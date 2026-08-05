import { randomUUID } from "node:crypto";

import {
  FieldValue,
  type DocumentReference,
  type Firestore,
} from "firebase-admin/firestore";

import type { BookingNotificationAudience } from "@/lib/notifications/booking-notification-outbox";

const DELIVERY_TIMEOUT_MS = 3_500;
const DELIVERY_LEASE_MS = 60_000;
const UNRESOLVED_RETRY_MS = 6 * 60 * 60 * 1_000;
const MAX_ATTEMPTS = 8;

type BookingNotificationDeliveryRecord = {
  id: string;
  bookingId: string;
  reference: string;
  audience: BookingNotificationAudience;
  listingId: string;
  listingName: string;
  recipientEmail?: string | null;
  title: string;
  message: string;
  href: string;
  status?: string;
  attempts?: number;
  nextAttemptAt?: string | null;
  leaseId?: string | null;
  leaseUntil?: string | null;
};

type DeliveryResult =
  | { outcome: "delivered"; id: string; providerMessageId: string | null }
  | { outcome: "deferred"; id: string; reason: string }
  | { outcome: "skipped"; id: string; reason: string }
  | { outcome: "failed"; id: string; reason: string };

export function notificationRetryDelayMs(attempts: number) {
  const normalizedAttempts = Math.max(1, Math.min(20, Math.round(attempts)));
  return Math.min(
    24 * 60 * 60 * 1_000,
    60_000 * 2 ** (normalizedAttempts - 1),
  );
}

export function normalizeNotificationRecipients(value: unknown) {
  const candidates = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];

  return Array.from(
    new Set(
      candidates
        .map((candidate) =>
          typeof candidate === "string"
            ? candidate.trim().toLowerCase().slice(0, 220)
            : "",
        )
        .filter((candidate) => /^\S+@\S+\.\S+$/.test(candidate)),
    ),
  ).slice(0, 20);
}

export function notificationIsDue(
  input: Pick<
    BookingNotificationDeliveryRecord,
    "status" | "nextAttemptAt" | "leaseUntil"
  >,
  now: Date = new Date(),
) {
  if (input.status === "delivered" || input.status === "failed") return false;

  const nowMs = now.getTime();
  const leaseUntil = parseTime(input.leaseUntil);
  if (input.status === "processing" && leaseUntil > nowMs) return false;

  const nextAttemptAt = parseTime(input.nextAttemptAt);
  return !nextAttemptAt || nextAttemptAt <= nowMs;
}

export function notificationClaimIsCurrent(
  input: Pick<BookingNotificationDeliveryRecord, "status" | "leaseId">,
  leaseId: string,
) {
  return input.status === "processing" && input.leaseId === leaseId;
}

export async function processBookingNotificationOutboxIds(
  db: Firestore,
  ids: string[],
) {
  const uniqueIds = Array.from(
    new Set(ids.map((id) => id.trim()).filter(Boolean)),
  ).slice(0, 25);

  const results = await Promise.all(
    uniqueIds.map((id) => attemptBookingNotificationDelivery(db, id)),
  );

  return summarizeDeliveryResults(results);
}

export async function processDueBookingNotifications(
  db: Firestore,
  limit = 20,
) {
  const safeLimit = Math.max(1, Math.min(50, Math.round(limit)));
  const now = new Date();
  const nowIso = now.toISOString();

  const [pending, expiredLeases] = await Promise.all([
    db
      .collection("notificationOutbox")
      .where("nextAttemptAt", "<=", nowIso)
      .orderBy("nextAttemptAt", "asc")
      .limit(safeLimit * 3)
      .get(),
    db
      .collection("notificationOutbox")
      .where("leaseUntil", "<=", nowIso)
      .orderBy("leaseUntil", "asc")
      .limit(safeLimit * 2)
      .get(),
  ]);

  const dueDocuments = new Map<
    string,
    FirebaseFirestore.QueryDocumentSnapshot
  >();

  for (const document of [...pending.docs, ...expiredLeases.docs]) {
    const data = document.data() as BookingNotificationDeliveryRecord;
    if (notificationIsDue(data, now)) {
      dueDocuments.set(document.id, document);
    }
  }

  const dueIds = Array.from(dueDocuments.values())
    .sort((left, right) =>
      dueSortKey(
        left.data() as BookingNotificationDeliveryRecord,
      ).localeCompare(
        dueSortKey(right.data() as BookingNotificationDeliveryRecord),
      ),
    )
    .slice(0, safeLimit)
    .map((document) => document.id);

  return processBookingNotificationOutboxIds(db, dueIds);
}

async function attemptBookingNotificationDelivery(
  db: Firestore,
  outboxId: string,
): Promise<DeliveryResult> {
  const outboxRef = db.collection("notificationOutbox").doc(outboxId);
  const leaseId = randomUUID();
  const claimed = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(outboxRef);
    if (!snapshot.exists) return null;

    const data = snapshot.data() as BookingNotificationDeliveryRecord;
    const now = new Date();
    if (!notificationIsDue(data, now)) return null;

    const attempts = Math.max(0, Number(data.attempts ?? 0)) + 1;
    const leaseUntil = new Date(
      now.getTime() + DELIVERY_LEASE_MS,
    ).toISOString();
    const claimedRecord: BookingNotificationDeliveryRecord = {
      ...data,
      id: outboxId,
      attempts,
      status: "processing",
      leaseId,
      leaseUntil,
    };

    transaction.update(outboxRef, {
      status: "processing",
      attempts,
      leaseId,
      leaseUntil,
      updatedAt: now.toISOString(),
      serverUpdatedAt: FieldValue.serverTimestamp(),
    });

    return claimedRecord;
  });

  if (!claimed) {
    return { outcome: "skipped", id: outboxId, reason: "not_due_or_missing" };
  }

  try {
    const recipients = await resolveRecipients(db, claimed);
    if (!recipients.length) {
      const deferred = await deferNotification(
        db,
        outboxRef,
        claimed,
        "recipient_unresolved",
        UNRESOLVED_RETRY_MS,
      );
      return deferred
        ? {
            outcome: "deferred",
            id: outboxId,
            reason: "recipient_unresolved",
          }
        : {
            outcome: "skipped",
            id: outboxId,
            reason: "stale_delivery_claim",
          };
    }

    const apiKey = process.env.RESEND_API_KEY?.trim();
    const from = process.env.VI_GUIDE_EMAIL_FROM?.trim();
    if (!apiKey || !from) {
      const deferred = await deferNotification(
        db,
        outboxRef,
        claimed,
        "email_provider_not_configured",
        UNRESOLVED_RETRY_MS,
      );
      return deferred
        ? {
            outcome: "deferred",
            id: outboxId,
            reason: "email_provider_not_configured",
          }
        : {
            outcome: "skipped",
            id: outboxId,
            reason: "stale_delivery_claim",
          };
    }

    const appUrl = safeAppUrl(process.env.VI_GUIDE_APP_URL);
    const destination = new URL(claimed.href || "/bookings", appUrl).toString();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": claimed.id,
        },
        body: JSON.stringify({
          from,
          to: recipients,
          subject: claimed.title,
          text: `${claimed.message}\n\nOpen VI Guide: ${destination}`,
          html: buildEmailHtml(claimed, destination),
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const payload = (await response.json().catch(() => null)) as
      | { id?: unknown; message?: unknown; error?: unknown }
      | null;
    if (!response.ok) {
      const providerReason = cleanError(
        payload?.message ?? payload?.error ?? `provider_http_${response.status}`,
      );
      throw new Error(providerReason);
    }

    const deliveredAt = new Date().toISOString();
    const providerMessageId =
      typeof payload?.id === "string" ? payload.id.slice(0, 220) : null;
    const finalized = await finalizeClaimedNotification(
      db,
      outboxRef,
      claimed,
      {
        status: "delivered",
        deliveredAt,
        failedAt: null,
        lastError: null,
        nextAttemptAt: null,
        provider: "resend",
        providerMessageId,
        updatedAt: deliveredAt,
      },
    );

    return finalized
      ? {
          outcome: "delivered",
          id: outboxId,
          providerMessageId,
        }
      : {
          outcome: "skipped",
          id: outboxId,
          reason: "stale_delivery_claim",
        };
  } catch (error) {
    const reason = cleanError(
      error instanceof Error ? error.message : "notification_delivery_failed",
    );
    const attempts = Math.max(1, Number(claimed.attempts ?? 1));
    const failed = attempts >= MAX_ATTEMPTS;
    const now = new Date();
    const finalized = await finalizeClaimedNotification(
      db,
      outboxRef,
      claimed,
      {
        status: failed ? "failed" : "pending",
        failedAt: failed ? now.toISOString() : null,
        lastError: reason,
        nextAttemptAt: failed
          ? null
          : new Date(
              now.getTime() + notificationRetryDelayMs(attempts),
            ).toISOString(),
        updatedAt: now.toISOString(),
      },
    );

    return finalized
      ? {
          outcome: failed ? "failed" : "deferred",
          id: outboxId,
          reason,
        }
      : {
          outcome: "skipped",
          id: outboxId,
          reason: "stale_delivery_claim",
        };
  }
}

async function resolveRecipients(
  db: Firestore,
  record: BookingNotificationDeliveryRecord,
) {
  if (record.audience === "traveler") {
    return normalizeNotificationRecipients(record.recipientEmail);
  }

  if (record.audience === "operations") {
    return normalizeNotificationRecipients(
      process.env.VI_GUIDE_OPERATIONS_EMAILS,
    );
  }

  const snapshot = await db
    .collection("merchantAccounts")
    .where("listingIds", "array-contains", record.listingId)
    .limit(50)
    .get();

  return normalizeNotificationRecipients(
    snapshot.docs
      .map((document) => document.data())
      .filter((account) => account.enabled === true)
      .map((account) => account.email),
  );
}

async function deferNotification(
  db: Firestore,
  ref: DocumentReference,
  record: BookingNotificationDeliveryRecord,
  reason: string,
  delayMs: number,
) {
  const now = new Date();
  return finalizeClaimedNotification(db, ref, record, {
    status: "pending",
    lastError: reason,
    nextAttemptAt: new Date(now.getTime() + delayMs).toISOString(),
    updatedAt: now.toISOString(),
    attempts: Math.max(1, Number(record.attempts ?? 1)),
  });
}

async function finalizeClaimedNotification(
  db: Firestore,
  ref: DocumentReference,
  record: BookingNotificationDeliveryRecord,
  patch: Record<string, unknown>,
) {
  const leaseId = record.leaseId;
  if (!leaseId) return false;

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) return false;

    const current = snapshot.data() as BookingNotificationDeliveryRecord;
    if (!notificationClaimIsCurrent(current, leaseId)) return false;

    transaction.update(ref, {
      ...patch,
      leaseId: null,
      leaseUntil: null,
      serverUpdatedAt: FieldValue.serverTimestamp(),
    });
    return true;
  });
}

function buildEmailHtml(
  record: BookingNotificationDeliveryRecord,
  destination: string,
) {
  return `<!doctype html><html><body style="margin:0;background:#f8f4ea;color:#043331;font-family:Arial,sans-serif"><div style="max-width:620px;margin:0 auto;padding:32px 20px"><div style="background:#043331;color:#fff;border-radius:24px;padding:28px"><div style="color:#f5c451;font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase">VI Guide</div><h1 style="margin:16px 0 8px;font-size:28px;line-height:1.1">${escapeHtml(record.title)}</h1><p style="margin:0;color:rgba(255,255,255,.75);font-size:15px;line-height:1.6">${escapeHtml(record.message)}</p></div><div style="padding:24px 4px"><p style="font-size:13px;color:#64748b">Booking ${escapeHtml(record.reference)}</p><a href="${escapeHtml(destination)}" style="display:inline-block;margin-top:8px;background:#f5c451;color:#043331;text-decoration:none;font-size:13px;font-weight:800;padding:14px 20px;border-radius:999px">Open VI Guide</a></div></div></body></html>`;
}

function summarizeDeliveryResults(results: DeliveryResult[]) {
  return results.reduce(
    (summary, result) => {
      summary[result.outcome] += 1;
      return summary;
    },
    { delivered: 0, deferred: 0, skipped: 0, failed: 0 },
  );
}

function safeAppUrl(value: unknown) {
  if (typeof value === "string") {
    try {
      const parsed = new URL(value);
      if (parsed.protocol === "https:") return parsed.origin;
    } catch {
      // Fall back to the canonical production origin.
    }
  }
  return "https://vi-guide.vercel.app";
}

function dueSortKey(record: BookingNotificationDeliveryRecord) {
  return (
    (record.status === "processing" ? record.leaseUntil : record.nextAttemptAt) ??
    ""
  );
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function cleanError(value: unknown) {
  const message = String(value ?? "notification_delivery_failed")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
  return message || "notification_delivery_failed";
}

function parseTime(value: unknown) {
  const parsed = typeof value === "string" ? Date.parse(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : 0;
}
