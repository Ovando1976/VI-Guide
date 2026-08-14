import { createHash } from "node:crypto";

import { FieldValue, type Firestore } from "firebase-admin/firestore";

import { normalizeActiveTrip } from "@/lib/intelligence/active-trip";
import {
  evaluateTripRisk,
  type TripRiskIssue,
  type TripRiskReport,
  type TripRiskSeverity,
  type TripWeatherAlert,
} from "@/lib/intelligence/trip-risk";
import type {
  IntelligenceMemory,
  IntelligenceNotificationPreferences,
} from "@/types/intelligence";

const DEFAULT_LOOKAHEAD_DAYS = 14;
const DEFAULT_PROFILE_LIMIT = 250;
const NOTIFICATION_COOLDOWN_MS = 6 * 60 * 60 * 1_000;

const SEVERITY_RANK: Record<TripRiskSeverity, number> = {
  info: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export type NormalizedTripNotificationPreferences = {
  tripMonitoring: boolean;
  inApp: boolean;
  email: boolean;
  minimumSeverity: "medium" | "high" | "critical";
  notifyOnRecovery: boolean;
};

type ProactiveTripWatch = {
  fingerprint?: string | null;
  severity?: TripRiskSeverity | null;
  materialIssueCount?: number;
  lastNotifiedAt?: string | null;
  lastEvaluatedAt?: string | null;
};

type TravelerProfileRecord = {
  ownerId?: unknown;
  ownerEmail?: unknown;
  memory?: unknown;
};

export type ProactiveTripNotificationSummary = {
  scannedProfiles: number;
  eligibleTrips: number;
  evaluatedTrips: number;
  notificationsCreated: number;
  recoveriesCreated: number;
  emailOutboxIds: string[];
  skippedDisabled: number;
  skippedUnchanged: number;
  weatherStatus: "available" | "unavailable";
};

export async function processProactiveTripNotifications(
  db: Firestore,
  options: {
    now?: Date;
    weatherAlerts?: TripWeatherAlert[];
    weatherStatus?: "available" | "unavailable";
    profileLimit?: number;
    lookaheadDays?: number;
  } = {},
): Promise<ProactiveTripNotificationSummary> {
  const now = options.now ?? new Date();
  const profileLimit = Math.max(
    1,
    Math.min(500, Math.round(options.profileLimit ?? DEFAULT_PROFILE_LIMIT)),
  );
  const lookaheadDays = Math.max(
    1,
    Math.min(60, Math.round(options.lookaheadDays ?? DEFAULT_LOOKAHEAD_DAYS)),
  );
  const snapshot = await db.collectionGroup("profile").limit(profileLimit).get();
  const summary: ProactiveTripNotificationSummary = {
    scannedProfiles: snapshot.size,
    eligibleTrips: 0,
    evaluatedTrips: 0,
    notificationsCreated: 0,
    recoveriesCreated: 0,
    emailOutboxIds: [],
    skippedDisabled: 0,
    skippedUnchanged: 0,
    weatherStatus: options.weatherStatus ?? "unavailable",
  };

  const earliest = territoryDate(now);
  const latest = territoryDate(
    new Date(now.getTime() + lookaheadDays * 86_400_000),
  );

  for (const document of snapshot.docs) {
    if (document.id !== "travel") continue;
    const profile = document.data() as TravelerProfileRecord;
    const ownerId = clean(profile.ownerId, 160);
    if (!ownerId) continue;
    const memory = normalizeMemory(profile.memory);
    const trip = normalizeActiveTrip(memory.activeTrip);
    if (!trip || trip.date < earliest || trip.date > latest) continue;
    summary.eligibleTrips += 1;

    const preferences = normalizeTripNotificationPreferences(
      memory.notifications,
    );
    if (!preferences.tripMonitoring || (!preferences.inApp && !preferences.email)) {
      summary.skippedDisabled += 1;
      continue;
    }

    const report = evaluateTripRisk(trip, memory, {
      now,
      weatherAlerts: options.weatherAlerts ?? [],
    });
    summary.evaluatedTrips += 1;

    const result = await evaluateAndPersistTripNotification(db, {
      ownerId,
      ownerEmail: cleanEmail(profile.ownerEmail),
      memory,
      report,
      preferences,
      now,
    });
    if (result.created) summary.notificationsCreated += 1;
    if (result.recovery) summary.recoveriesCreated += 1;
    if (result.emailOutboxId) summary.emailOutboxIds.push(result.emailOutboxId);
    if (!result.created && !result.recovery) summary.skippedUnchanged += 1;
  }

  return summary;
}

export function normalizeTripNotificationPreferences(
  value: unknown,
): NormalizedTripNotificationPreferences {
  const input =
    value && typeof value === "object"
      ? (value as IntelligenceNotificationPreferences)
      : {};
  const minimumSeverity =
    input.minimumSeverity === "medium" ||
    input.minimumSeverity === "high" ||
    input.minimumSeverity === "critical"
      ? input.minimumSeverity
      : "high";
  return {
    tripMonitoring: input.tripMonitoring !== false,
    inApp: input.inApp !== false,
    email: input.email === true,
    minimumSeverity,
    notifyOnRecovery: input.notifyOnRecovery !== false,
  };
}

export function materialTripRiskIssues(
  report: TripRiskReport,
  minimumSeverity: NormalizedTripNotificationPreferences["minimumSeverity"],
) {
  const threshold = SEVERITY_RANK[minimumSeverity];
  return report.issues.filter(
    (issue) => SEVERITY_RANK[issue.severity] >= threshold,
  );
}

export function proactiveTripRiskFingerprint(
  report: TripRiskReport,
  issues: TripRiskIssue[],
) {
  const payload = {
    status: report.status,
    score: Math.round(report.score / 5) * 5,
    returnWindow: report.returnWindow
      ? {
          allAboardTime: report.returnWindow.allAboardTime,
          safeReturnByTime: report.returnWindow.safeReturnByTime,
          latestScheduledEndTime: report.returnWindow.latestScheduledEndTime,
        }
      : null,
    issues: issues.map((issue) => ({
      id: issue.id,
      severity: issue.severity,
      category: issue.category,
      title: issue.title,
      recommendation: issue.recommendation,
    })),
  };
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export function shouldCreateTripRiskNotification(
  previous: ProactiveTripWatch | null,
  fingerprint: string,
  severity: TripRiskSeverity,
  now: Date,
) {
  if (!previous?.fingerprint) return true;
  if (previous.fingerprint === fingerprint) return false;

  const previousSeverity = previous.severity ?? "info";
  if (SEVERITY_RANK[severity] > SEVERITY_RANK[previousSeverity]) return true;
  const lastNotifiedAt = parseTime(previous.lastNotifiedAt);
  return !lastNotifiedAt || now.getTime() - lastNotifiedAt >= NOTIFICATION_COOLDOWN_MS;
}

async function evaluateAndPersistTripNotification(
  db: Firestore,
  input: {
    ownerId: string;
    ownerEmail: string;
    memory: IntelligenceMemory;
    report: TripRiskReport;
    preferences: NormalizedTripNotificationPreferences;
    now: Date;
  },
) {
  const trip = input.memory.activeTrip!;
  const materialIssues = materialTripRiskIssues(
    input.report,
    input.preferences.minimumSeverity,
  );
  const materialSeverity = highestSeverity(materialIssues);
  const fingerprint = proactiveTripRiskFingerprint(input.report, materialIssues);
  const nowIso = input.now.toISOString();
  const watchRef = db
    .collection("users")
    .doc(input.ownerId)
    .collection("tripRiskWatches")
    .doc(safeId(trip.id));

  return db.runTransaction(async (transaction) => {
    const watchSnapshot = await transaction.get(watchRef);
    const previous = watchSnapshot.exists
      ? (watchSnapshot.data() as ProactiveTripWatch)
      : null;
    const previouslyMaterial = Number(previous?.materialIssueCount ?? 0) > 0;
    const isRecovery = !materialIssues.length && previouslyMaterial;
    const shouldNotifyRisk =
      materialIssues.length > 0 &&
      shouldCreateTripRiskNotification(
        previous,
        fingerprint,
        materialSeverity,
        input.now,
      );
    const shouldNotifyRecovery =
      isRecovery &&
      input.preferences.notifyOnRecovery &&
      previous?.fingerprint !== `recovered:${fingerprint}`;

    let notificationId: string | null = null;
    let emailOutboxId: string | null = null;

    if (shouldNotifyRisk || shouldNotifyRecovery) {
      const content = shouldNotifyRecovery
        ? buildRecoveryContent(trip.title)
        : buildRiskContent(trip.title, input.report, materialIssues);
      const eventFingerprint = shouldNotifyRecovery
        ? `recovered:${fingerprint}`
        : fingerprint;
      notificationId = `trip_${createHash("sha256")
        .update(`${input.ownerId}:${trip.id}:${eventFingerprint}`)
        .digest("hex")
        .slice(0, 40)}`;

      if (input.preferences.inApp) {
        transaction.set(db.collection("notifications").doc(notificationId), {
          audience: "traveler",
          recipientUid: input.ownerId,
          kind: "trip",
          priority: shouldNotifyRecovery
            ? "normal"
            : materialSeverity === "critical" || materialSeverity === "high"
              ? "high"
              : "normal",
          title: content.title,
          message: content.message,
          href: "/planner",
          reference: trip.title.slice(0, 120),
          dedupeKey: eventFingerprint,
          tripId: trip.id,
          tripDate: trip.date,
          riskStatus: input.report.status,
          readAt: null,
          createdAt: nowIso,
          updatedAt: nowIso,
          serverCreatedAt: FieldValue.serverTimestamp(),
          serverUpdatedAt: FieldValue.serverTimestamp(),
        });
      }

      if (input.preferences.email && input.ownerEmail) {
        emailOutboxId = `triprisk__${notificationId}`;
        transaction.set(db.collection("notificationOutbox").doc(emailOutboxId), {
          bookingId: trip.id,
          reference: trip.title.slice(0, 160),
          event: shouldNotifyRecovery ? "trip_risk_recovered" : "trip_risk_changed",
          audience: "traveler",
          listingId: "trip-intelligence",
          listingName: "USVI Explorer Trip Protection",
          recipientEmail: input.ownerEmail,
          recipientUid: input.ownerId,
          title: content.title,
          message: content.message,
          href: "/planner",
          status: "pending",
          attempts: 0,
          nextAttemptAt: nowIso,
          deliveredAt: null,
          failedAt: null,
          lastError: null,
          createdAt: nowIso,
          updatedAt: nowIso,
          serverCreatedAt: FieldValue.serverTimestamp(),
          serverUpdatedAt: FieldValue.serverTimestamp(),
        });
      }
    }

    transaction.set(
      watchRef,
      {
        ownerId: input.ownerId,
        tripId: trip.id,
        tripTitle: trip.title,
        tripDate: trip.date,
        fingerprint:
          shouldNotifyRecovery && !materialIssues.length
            ? `recovered:${fingerprint}`
            : fingerprint,
        severity: materialIssues.length ? materialSeverity : "info",
        materialIssueCount: materialIssues.length,
        issueIds: materialIssues.map((issue) => issue.id).slice(0, 20),
        reportStatus: input.report.status,
        score: input.report.score,
        lastEvaluatedAt: nowIso,
        lastNotifiedAt:
          shouldNotifyRisk || shouldNotifyRecovery
            ? nowIso
            : previous?.lastNotifiedAt ?? null,
        updatedAt: nowIso,
        serverUpdatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return {
      created: Boolean(shouldNotifyRisk && notificationId),
      recovery: Boolean(shouldNotifyRecovery && notificationId),
      notificationId,
      emailOutboxId,
    };
  });
}

function buildRiskContent(
  tripTitle: string,
  report: TripRiskReport,
  issues: TripRiskIssue[],
) {
  const leading = issues[0];
  const additional = Math.max(0, issues.length - 1);
  const title =
    leading.severity === "critical"
      ? `Critical trip change: ${leading.title}`
      : `Trip needs attention: ${leading.title}`;
  const message = [
    `${tripTitle} is now ${report.score}/100.`,
    leading.recommendation,
    additional
      ? `${additional} additional ${additional === 1 ? "issue also needs" : "issues also need"} review.`
      : "",
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 800);
  return { title: title.slice(0, 160), message };
}

function buildRecoveryContent(tripTitle: string) {
  return {
    title: "Trip protection check improved",
    message: `${tripTitle} no longer has the high-priority risks from the previous USVI Explorer check. Review the current plan before departure.`,
  };
}

function highestSeverity(issues: TripRiskIssue[]): TripRiskSeverity {
  return issues.reduce<TripRiskSeverity>(
    (highest, issue) =>
      SEVERITY_RANK[issue.severity] > SEVERITY_RANK[highest]
        ? issue.severity
        : highest,
    "info",
  );
}

function normalizeMemory(value: unknown): IntelligenceMemory {
  return value && typeof value === "object"
    ? (value as IntelligenceMemory)
    : {};
}

function territoryDate(value: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/St_Thomas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${lookup.year}-${lookup.month}-${lookup.day}`;
}

function safeId(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 40);
}

function cleanEmail(value: unknown) {
  const email = clean(value, 220).toLowerCase();
  return /^\S+@\S+\.\S+$/.test(email) ? email : "";
}

function clean(value: unknown, limit: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, limit)
    : "";
}

function parseTime(value: unknown) {
  const parsed = typeof value === "string" ? Date.parse(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : 0;
}
