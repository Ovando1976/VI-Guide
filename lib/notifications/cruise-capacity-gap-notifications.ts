import { createHash } from "node:crypto";

import { FieldValue, type Firestore } from "firebase-admin/firestore";

import { addCalendarDays, getUsviToday } from "@/lib/booking/booking-dates";
import {
  OFFICIAL_USVI_CRUISE_PORT_CALLS,
  type OfficialCruisePortCall,
} from "@/lib/cruise-port-calls";

const DEFAULT_LOOKAHEAD_DAYS = 14;
const DEFAULT_PROFILE_LIMIT = 150;

export type CruiseCapacityGapNotificationSummary = {
  scannedProfiles: number;
  eligibleProfiles: number;
  profilesWithMissingCapacity: number;
  notificationsCreated: number;
  notificationsAlreadyPresent: number;
  emailOutboxIds: string[];
};

type CruiseCapacityGapProfile = {
  offerId: string;
  listingId: string;
  listingName: string;
  offerTitle: string;
  supportedPorts: string[];
};

type OfferWindow = {
  active: boolean;
  validFrom: string;
  validThrough: string;
};

export type CruiseCapacityGapSelection = {
  date: string;
  calls: OfficialCruisePortCall[];
  additionalMissingDates: number;
};

export async function processCruiseCapacityGapNotifications(
  db: Firestore,
  options: {
    now?: Date;
    lookaheadDays?: number;
    profileLimit?: number;
  } = {},
): Promise<CruiseCapacityGapNotificationSummary> {
  const now = options.now ?? new Date();
  const lookaheadDays = Math.max(
    1,
    Math.min(30, Math.round(options.lookaheadDays ?? DEFAULT_LOOKAHEAD_DAYS)),
  );
  const profileLimit = Math.max(
    1,
    Math.min(300, Math.round(options.profileLimit ?? DEFAULT_PROFILE_LIMIT)),
  );
  const today = getUsviToday(now);
  const latest = addCalendarDays(today, lookaheadDays);

  const profileSnapshot = await db
    .collection("shoreExcursions")
    .where("status", "==", "active")
    .limit(profileLimit)
    .get();

  const profiles = profileSnapshot.docs
    .map((document) => normalizeProfile(document.id, document.data()))
    .filter((profile): profile is CruiseCapacityGapProfile => Boolean(profile));

  const summary: CruiseCapacityGapNotificationSummary = {
    scannedProfiles: profileSnapshot.size,
    eligibleProfiles: 0,
    profilesWithMissingCapacity: 0,
    notificationsCreated: 0,
    notificationsAlreadyPresent: 0,
    emailOutboxIds: [],
  };

  if (!profiles.length || !latest) return summary;

  const uniqueListingIds = Array.from(
    new Set(profiles.map((profile) => profile.listingId)),
  );
  const [offerDocuments, operationsDocuments] = await Promise.all([
    Promise.all(
      profiles.map((profile) =>
        db.collection("merchantOffers").doc(profile.offerId).get(),
      ),
    ),
    Promise.all(
      uniqueListingIds.map((listingId) =>
        db.collection("providerOperations").doc(listingId).get(),
      ),
    ),
  ]);

  const offerById = new Map(
    offerDocuments.map((document) => [
      document.id,
      normalizeOfferWindow(document.data()),
    ] as const),
  );
  const savedDatesByListingId = new Map(
    operationsDocuments.map((document) => [
      document.id,
      savedProviderDates(document.data()),
    ] as const),
  );

  const scheduledCalls = OFFICIAL_USVI_CRUISE_PORT_CALLS.filter(
    (call) =>
      call.status === "scheduled" && call.date >= today && call.date <= latest,
  );

  for (const profile of profiles) {
    const offer = offerById.get(profile.offerId);
    if (!offer?.active || !offer.validFrom || !offer.validThrough) continue;
    summary.eligibleProfiles += 1;

    const selection = selectNearestCruiseCapacityGap({
      today,
      latest,
      supportedPorts: profile.supportedPorts,
      offerValidFrom: offer.validFrom,
      offerValidThrough: offer.validThrough,
      savedAvailabilityDates:
        savedDatesByListingId.get(profile.listingId) ?? new Set<string>(),
      calls: scheduledCalls,
    });
    if (!selection) continue;
    summary.profilesWithMissingCapacity += 1;

    const outboxId = cruiseCapacityGapOutboxId(
      profile.offerId,
      selection.date,
    );
    const outboxRef = db.collection("notificationOutbox").doc(outboxId);
    const created = await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(outboxRef);
      if (existing.exists) return false;

      const nowIso = now.toISOString();
      const ships = uniqueStrings(selection.calls.map((call) => call.shipName));
      const terminals = uniqueStrings(
        selection.calls.map((call) => call.terminalLabel),
      );
      const shipText = ships.slice(0, 3).join(", ");
      const extraShips = Math.max(0, ships.length - 3);
      const additionalDateText = selection.additionalMissingDates
        ? ` ${selection.additionalMissingDates} additional sellable cruise ${selection.additionalMissingDates === 1 ? "date also needs" : "dates also need"} a saved capacity decision.`
        : "";
      const message = [
        `${profile.offerTitle} has no saved availability record for ${selection.date}.`,
        shipText
          ? `Expected ship${ships.length === 1 ? "" : "s"}: ${shipText}${extraShips ? ` +${extraShips} more` : ""}.`
          : "",
        terminals.length
          ? `Port: ${terminals.slice(0, 2).join(" / ")}.`
          : "",
        "Open the date and publish operating hours/capacity if you intend to sell it, or save it closed if you do not.",
        additionalDateText.trim(),
      ]
        .filter(Boolean)
        .join(" ")
        .slice(0, 1200);

      transaction.set(outboxRef, {
        bookingId: `cruise-capacity-${shortHash(`${profile.offerId}:${selection.date}`)}`,
        reference: profile.offerTitle.slice(0, 160),
        event: "cruise_capacity_missing",
        audience: "merchant",
        listingId: profile.listingId,
        listingName: profile.listingName,
        recipientEmail: null,
        recipientUid: null,
        title: `Cruise capacity needs attention: ${selection.date}`,
        message,
        href: `/merchant/availability?listingId=${encodeURIComponent(profile.listingId)}`,
        status: "pending",
        attempts: 0,
        nextAttemptAt: nowIso,
        deliveredAt: null,
        failedAt: null,
        lastError: null,
        cruiseOfferId: profile.offerId,
        cruiseCallDate: selection.date,
        cruiseShipNames: ships.slice(0, 12),
        cruiseTerminalLabels: terminals.slice(0, 6),
        additionalMissingDates: selection.additionalMissingDates,
        createdAt: nowIso,
        updatedAt: nowIso,
        serverCreatedAt: FieldValue.serverTimestamp(),
        serverUpdatedAt: FieldValue.serverTimestamp(),
      });
      return true;
    });

    if (created) {
      summary.notificationsCreated += 1;
      summary.emailOutboxIds.push(outboxId);
    } else {
      summary.notificationsAlreadyPresent += 1;
    }
  }

  return summary;
}

export function selectNearestCruiseCapacityGap(input: {
  today: string;
  latest: string;
  supportedPorts: string[];
  offerValidFrom: string;
  offerValidThrough: string;
  savedAvailabilityDates: Set<string>;
  calls: OfficialCruisePortCall[];
}): CruiseCapacityGapSelection | null {
  const supportedPorts = new Set(input.supportedPorts);
  const callsByDate = new Map<string, OfficialCruisePortCall[]>();

  for (const call of input.calls) {
    if (call.status !== "scheduled") continue;
    if (call.date < input.today || call.date > input.latest) continue;
    if (
      call.date < input.offerValidFrom ||
      call.date > input.offerValidThrough ||
      !supportedPorts.has(call.portId)
    ) {
      continue;
    }
    const current = callsByDate.get(call.date) ?? [];
    current.push(call);
    callsByDate.set(call.date, current);
  }

  const missingDates = Array.from(callsByDate.keys())
    .filter((date) => !input.savedAvailabilityDates.has(date))
    .sort();
  const date = missingDates[0];
  if (!date) return null;

  return {
    date,
    calls: callsByDate.get(date) ?? [],
    additionalMissingDates: Math.max(0, missingDates.length - 1),
  };
}

export function cruiseCapacityGapOutboxId(offerId: string, date: string) {
  return `cruise_capacity__${shortHash(`${offerId}:${date}`)}`;
}

function normalizeProfile(
  offerId: string,
  data: FirebaseFirestore.DocumentData,
): CruiseCapacityGapProfile | null {
  const listingId = clean(data.listingId, 160);
  const listingName = clean(data.listingName, 180);
  const offerTitle = clean(data.offerTitle, 120);
  const supportedPorts = Array.isArray(data.supportedPorts)
    ? uniqueStrings(
        data.supportedPorts.filter(
          (value: unknown): value is string => typeof value === "string",
        ),
      )
    : [];
  if (!offerId || !listingId || !listingName || !offerTitle || !supportedPorts.length) {
    return null;
  }
  return { offerId, listingId, listingName, offerTitle, supportedPorts };
}

function normalizeOfferWindow(
  data: FirebaseFirestore.DocumentData | undefined,
): OfferWindow {
  return {
    active: clean(data?.status, 30) === "active",
    validFrom: isoDate(data?.validFrom),
    validThrough: isoDate(data?.validThrough),
  };
}

function savedProviderDates(data: FirebaseFirestore.DocumentData | undefined) {
  const days = Array.isArray(data?.days) ? data.days : [];
  return new Set(
    days.flatMap((value: unknown) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return [];
      const date = isoDate((value as { date?: unknown }).date);
      return date ? [date] : [];
    }),
  );
}

function isoDate(value: unknown) {
  const date = clean(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "";
}

function uniqueStrings(values: string[]) {
  return Array.from(
    new Set(values.map((value) => clean(value, 220)).filter(Boolean)),
  );
}

function shortHash(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 40);
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
