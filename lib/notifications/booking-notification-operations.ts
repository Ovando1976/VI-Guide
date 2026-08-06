export type NotificationOutboxStatus =
  | "pending"
  | "processing"
  | "delivered"
  | "failed";

export type NotificationOutboxOperationsRecord = {
  status?: unknown;
  leaseUntil?: unknown;
};

export type NotificationOutboxSummary = {
  total: number;
  pending: number;
  processing: number;
  delivered: number;
  failed: number;
  retryable: number;
};

const OUTBOX_STATUSES = new Set<NotificationOutboxStatus>([
  "pending",
  "processing",
  "delivered",
  "failed",
]);

export function normalizeNotificationOutboxStatus(
  value: unknown,
): NotificationOutboxStatus | null {
  return typeof value === "string" &&
    OUTBOX_STATUSES.has(value as NotificationOutboxStatus)
    ? (value as NotificationOutboxStatus)
    : null;
}

export function normalizeNotificationRetryIds(value: unknown) {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .map((candidate) =>
          typeof candidate === "string" ? candidate.trim().slice(0, 500) : "",
        )
        .filter(
          (candidate) =>
            Boolean(candidate) && /^[A-Za-z0-9_-]+$/.test(candidate),
        ),
    ),
  ).slice(0, 25);
}

export function notificationCanBeManuallyRetried(
  record: NotificationOutboxOperationsRecord,
  now: Date = new Date(),
) {
  const status = normalizeNotificationOutboxStatus(record.status);
  if (status === "failed" || status === "pending") return true;
  if (status !== "processing") return false;

  const leaseUntil = parseTime(record.leaseUntil);
  return !leaseUntil || leaseUntil <= now.getTime();
}

export function manualNotificationRetryPatch(input: {
  actorUid: string;
  actorEmail?: string | null;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();

  return {
    status: "pending" as const,
    attempts: 0,
    nextAttemptAt: timestamp,
    leaseId: null,
    leaseUntil: null,
    failedAt: null,
    lastError: null,
    manualRetryAt: timestamp,
    manualRetryActorUid: clean(input.actorUid, 160),
    manualRetryActorEmail: cleanEmail(input.actorEmail) || null,
    updatedAt: timestamp,
  };
}

export function summarizeNotificationOutbox(
  value: unknown,
  now: Date = new Date(),
): NotificationOutboxSummary {
  const records = Array.isArray(value) ? value : [];
  const summary: NotificationOutboxSummary = {
    total: 0,
    pending: 0,
    processing: 0,
    delivered: 0,
    failed: 0,
    retryable: 0,
  };

  for (const record of records) {
    if (!record || typeof record !== "object") continue;
    const normalized = record as NotificationOutboxOperationsRecord;
    const status = normalizeNotificationOutboxStatus(normalized.status);
    if (!status) continue;

    summary.total += 1;
    summary[status] += 1;
    if (notificationCanBeManuallyRetried(normalized, now)) {
      summary.retryable += 1;
    }
  }

  return summary;
}

function cleanEmail(value: unknown) {
  const email = clean(value, 220).toLowerCase();
  return /^\S+@\S+\.\S+$/.test(email) ? email : "";
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}

function parseTime(value: unknown) {
  const parsed = typeof value === "string" ? Date.parse(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : 0;
}
