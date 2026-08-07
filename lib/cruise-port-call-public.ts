import "server-only";

import {
  evaluateOfficialPortCallExcursionFit,
  reservedGuestCount,
  type CruiseExcursionFit,
} from "@/lib/cruise-port-call-match";
import {
  derivePlanningAllAboard,
  getOfficialCruisePortCall,
  listOfficialCruisePortCalls,
  sourceForOfficialCruisePortCall,
  type OfficialCruisePortCall,
} from "@/lib/cruise-port-calls";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import {
  loadPublicShoreExcursions,
  type PublicShoreExcursion,
} from "@/lib/shore-excursion-public";
import type { IntelligenceIsland } from "@/types/intelligence";
import type {
  ProviderAvailabilityDay,
  ProviderOperationsConfig,
} from "@/types/provider-operations";

export type PublicCruiseExcursionMatch = {
  excursion: PublicShoreExcursion;
  fit: CruiseExcursionFit;
  bookingHref: string;
};

export type PublicCruisePortCallBoardItem = {
  call: OfficialCruisePortCall;
  planningAllAboardTime: string | null;
  availableMatches: PublicCruiseExcursionMatch[];
  unverifiedMatches: PublicCruiseExcursionMatch[];
  source: ReturnType<typeof sourceForOfficialCruisePortCall>;
};

export async function loadOfficialPortCallMatches(input: {
  callId: string;
  partySize?: number;
}) {
  const call = getOfficialCruisePortCall(input.callId);
  if (!call) return null;
  const excursions = await loadPublicShoreExcursions();
  const resources = await loadCapacityResources(excursions);
  const matches = buildMatches({
    call,
    excursions,
    partySize: input.partySize,
    resources,
  });
  return {
    call,
    planningAllAboardTime: derivePlanningAllAboard(call.departsAt),
    source: sourceForOfficialCruisePortCall(call),
    availableMatches: matches.filter((match) => match.fit.status === "available"),
    unverifiedMatches: matches.filter(
      (match) => match.fit.status === "capacity_unconfigured",
    ),
    allMatches: matches,
  };
}

export async function loadOfficialPortCallBoard(input: {
  from: string;
  through?: string;
  island?: IntelligenceIsland;
  partySize?: number;
}) {
  const calls = listOfficialCruisePortCalls({
    from: input.from,
    through: input.through,
    island: input.island,
  });
  const excursions = await loadPublicShoreExcursions();
  const resources = await loadCapacityResources(excursions);

  return calls.map((call) => {
    const matches = buildMatches({
      call,
      excursions,
      partySize: input.partySize,
      resources,
    });
    return {
      call,
      planningAllAboardTime: derivePlanningAllAboard(call.departsAt),
      source: sourceForOfficialCruisePortCall(call),
      availableMatches: matches.filter((match) => match.fit.status === "available"),
      unverifiedMatches: matches.filter(
        (match) => match.fit.status === "capacity_unconfigured",
      ),
    } satisfies PublicCruisePortCallBoardItem;
  });
}

function buildMatches(input: {
  call: OfficialCruisePortCall;
  excursions: PublicShoreExcursion[];
  partySize?: number;
  resources: CapacityResources;
}) {
  return input.excursions
    .filter(
      (excursion) =>
        excursion.island === input.call.island &&
        excursion.supportedPorts.includes(input.call.portId),
    )
    .map((excursion) => {
      const providerConfig = input.resources.providerOperations.get(
        excursion.offer.listingId,
      );
      const availabilityDay = providerConfig
        ? providerAvailabilityDay(providerConfig, input.call.date)
        : null;
      const bookingRecords =
        input.resources.bookingsByListing.get(excursion.offer.listingId) ?? [];
      const reservedGuests = reservedGuestCount(bookingRecords, input.call.date);
      const fit = evaluateOfficialPortCallExcursionFit({
        call: input.call,
        profile: excursion,
        offer: excursion.offer,
        availabilityDay,
        reservedGuests,
        partySize: input.partySize,
      });
      return {
        excursion,
        fit,
        bookingHref: excursionHref(input.call, excursion.offer.offerId),
      } satisfies PublicCruiseExcursionMatch;
    })
    .sort((left, right) => {
      const leftRank = fitRank(left.fit.status);
      const rightRank = fitRank(right.fit.status);
      if (leftRank !== rightRank) return leftRank - rightRank;
      const leftCapacity = left.fit.remainingCapacity ?? -1;
      const rightCapacity = right.fit.remainingCapacity ?? -1;
      if (leftCapacity !== rightCapacity) return rightCapacity - leftCapacity;
      return left.excursion.offer.offerTitle.localeCompare(
        right.excursion.offer.offerTitle,
      );
    });
}

type CapacityResources = {
  providerOperations: Map<string, ProviderOperationsConfig>;
  bookingsByListing: Map<string, Array<Record<string, unknown>>>;
};

async function loadCapacityResources(
  excursions: PublicShoreExcursion[],
): Promise<CapacityResources> {
  const listingIds = Array.from(
    new Set(excursions.map((excursion) => excursion.offer.listingId).filter(Boolean)),
  );
  const providerOperations = new Map<string, ProviderOperationsConfig>();
  const bookingsByListing = new Map<string, Array<Record<string, unknown>>>();
  if (!listingIds.length || !hasFirebaseAdminConfiguration()) {
    return { providerOperations, bookingsByListing };
  }

  const db = getAdminDb();
  const results = await Promise.all(
    listingIds.map(async (listingId) => {
      const [operationsDocument, bookingsSnapshot] = await Promise.all([
        db.collection("providerOperations").doc(listingId).get(),
        db
          .collection("commerceBookings")
          .where("listingId", "==", listingId)
          .limit(500)
          .get(),
      ]);
      return {
        listingId,
        operations: operationsDocument.exists
          ? normalizeProviderOperations(operationsDocument.data(), listingId)
          : null,
        bookings: bookingsSnapshot.docs.map((document) => document.data()),
      };
    }),
  );

  for (const result of results) {
    if (result.operations) {
      providerOperations.set(result.listingId, result.operations);
    }
    bookingsByListing.set(result.listingId, result.bookings);
  }
  return { providerOperations, bookingsByListing };
}

function normalizeProviderOperations(
  data: FirebaseFirestore.DocumentData | undefined,
  listingId: string,
): ProviderOperationsConfig {
  const days = Array.isArray(data?.days)
    ? data.days.map(normalizeAvailabilityDay).filter(isAvailabilityDay)
    : [];
  return {
    listingId,
    listingName: String(data?.listingName ?? "Provider"),
    timezone: String(data?.timezone ?? "America/St_Thomas"),
    defaultCapacity: clampWhole(data?.defaultCapacity, 1, 500, 10),
    days,
    updatedAt: String(data?.updatedAt ?? ""),
  };
}

function providerAvailabilityDay(config: ProviderOperationsConfig, date: string) {
  return config.days.find((day) => day.date === date) ?? null;
}

function normalizeAvailabilityDay(value: unknown): ProviderAvailabilityDay | null {
  if (!value || typeof value !== "object") return null;
  const day = value as Partial<ProviderAvailabilityDay>;
  if (typeof day.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day.date)) {
    return null;
  }
  return {
    date: day.date,
    isOpen: day.isOpen === true,
    capacity: clampWhole(day.capacity, 0, 500, 0),
    startTime: validTime(day.startTime) ? day.startTime : "09:00",
    endTime: validTime(day.endTime) ? day.endTime : "17:00",
    ...(typeof day.note === "string" && day.note.trim()
      ? { note: day.note.trim().slice(0, 300) }
      : {}),
  };
}

function excursionHref(call: OfficialCruisePortCall, offerId: string) {
  const allAboard = derivePlanningAllAboard(call.departsAt);
  const params = new URLSearchParams({
    officialPortCall: call.id,
    ship: call.shipName,
    date: call.date,
    portName: call.terminalLabel,
    island: call.island,
    portId: call.portId,
    arrival: call.arrivesAt,
  });
  if (allAboard) {
    params.set("allAboard", allAboard);
    params.set("allAboardEstimated", "1");
  }
  return `/shore-excursions/${encodeURIComponent(offerId)}?${params.toString()}`;
}

function fitRank(status: CruiseExcursionFit["status"]) {
  if (status === "available") return 0;
  if (status === "capacity_unconfigured") return 1;
  if (status === "insufficient_capacity") return 2;
  if (status === "sold_out") return 3;
  return 4;
}

function validTime(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function clampWhole(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number,
) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(minimum, Math.min(maximum, Math.trunc(number)));
}

function isAvailabilityDay(
  value: ProviderAvailabilityDay | null,
): value is ProviderAvailabilityDay {
  return value !== null;
}
