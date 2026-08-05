import { FieldValue, type Firestore } from "firebase-admin/firestore";

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
  input: Pick<BookingNotificationDeliveryRecord, "status" | "nextAttemptAt" | "leaseUntil">,
  now: Date = new Date(),
) {
  if (input.status === "delivered" || input.status === "failed") return false;

  const nowMs = now.getTime();
  const leaseUntil = parseTime(input.leaseUntil);
  if (input.status === "processing" && leaseUntil > nowMs) return false;

  const nextAttemptAt = parseTime(input.nextAttemptAt);
  return !nextAttemptAt || nextAttemptAt <= nowMs;
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
  const [pending, processing] = await Promise.all([
    db
      .collection("notificationOutbox")
      .where("status", "==", "pending")
      .limit(safeLimit * 2)
      .get(),
    db
      .collection("notificationOutbox")
      .where("status", "==", "processing")
      .limit(safeLimit)
      .get(),
  ]);

  const now = new Date();
  const dueIds = [...pending.docs, ...processing.docs]
    .filter((document) =>
      notificationIsDue(
        document.data() as BookingNotificationDeliveryRecord,
        now,
      ),
    )
    .sort((left, right) =>
      String(left.data().nextAttemptAt ?? "").localeCompare(
        String(right.data().nextAttemptAt ?? ""),
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
  const claimed = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(outboxRef);
    if (!snapshot.exists) return null;

    const data = snapshot.data() as BookingNotificationDeliveryRecord;
    const now = new Date();
    if (!notificationIsDue(data, now)) return null;

    const attempts = Math.max(0, Number(data.attempts ?? 0)) + 1;
    const claimedRecord: BookingNotificationDeliveryRecord = {
      ...data,
      id: outboxId,
      attempts,
      status: "processing",
      leaseUntil: new Date(now.getTime() + DELIVERY_LEASE_MS).toISOString(),
    };

    transaction.update(outboxRef, {
      status: "processing",
      attempts,
      leaseUntil: claimedRecord.leaseUntil,
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
      await deferNotification(outboxRef, claimed, "recipient_unresolved", UNRESOLVED_RETRY_MS);
      return {
        outcome: "deferred",
        id: outboxId,
        reason: "recipient_unresolved",
      };
    }

    const apiKey = process.env.RESEND_API_KEY?.trim();
    const from = process.env.VI_GUIDE_EMAIL_FROM?.trim();
    if (!apiKey || !from) {
      await deferNotification(outboxRef, claimed, "email_provider_not_configured", UNRESOLVED_RETRY_MS);
      return {
        outcome: "deferred",
        id: outboxId,
        reason: "email_provider_not_configured",
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
    await outboxRef.update({
      status: "delivered",
      deliveredAt,
      failedAt: null,
      lastError: null,
      nextAttemptAt: null,
      leaseUntil: null,
      provider: "resend",
      providerMessageId,
      updatedAt: deliveredAt,
      serverUpdatedAt: FieldValue.serverTimestamp(),
    });

    return {
      outcome: "delivered",
      id: outboxId,
      providerMessageId,
    };
  } catch (error) {
    const reason = cleanError(
      error instanceof Error ? error.message : "notification_delivery_failed",
    );
    const attempts = Math.max(1, Number(claimed.attempts ?? 1));
    const failed = attempts >= MAX_ATTEMPTS;
    const now = new Date();

    await outboxRef.update({
      status: failed ? "failed" : "pending",
      failedAt: failed ? now.toISOString() : null,
      lastError: reason,
      nextAttemptAt: failed
        ? null
        : new Date(
            now.getTime() + notificationRetryDelayMs(attempts),
          ).toISOString(),
      leaseUntil: null,
      updatedAt: now.toISOString(),
      serverUpdatedAt: FieldValue.serverTimestamp(),
    });

    return {
      outcome: failed ? "failed" : "deferred",
      id: outboxId,
      reason,
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
    .where("enabled", "==", true)
    .limit(100)
    .get();

  return normalizeNotificationRecipients(
    snapshot.docs
      .map((document) => document.data())
      .filter((account) =>
        Array.isArray(account.listingIds)
          ? account.listingIds.includes(record.listingId)
          : false,
      )
      .map((account) => account.email),
  );
}

async function deferNotification(
  ref: FirebaseFirestore.DocumentReference,
  record: BookingNotificationDeliveryRecord,
  reason: string,
  delayMs: number,
) {
  const now = new Date();
  await ref.update({
    status: "pending",
    lastError: reason,
    nextAttemptAt: new Date(now.getTime() + delayMs).toISOString(),
    leaseUntil: null,
    updatedAt: now.toISOString(),
    serverUpdatedAt: FieldValue.serverTimestamp(),
    attempts: Math.max(1, Number(record.attempts ?? 1)),
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
