import {
  derivePlanningAllAboard,
  type OfficialCruisePortCall,
} from "@/lib/cruise-port-calls";
import type { MerchantOfferBookingSnapshot } from "@/lib/merchant-offer-booking";
import {
  shoreExcursionDateWithinOfferWindow,
  type ShoreExcursionProfile,
} from "@/lib/shore-excursions";
import type { ProviderAvailabilityDay } from "@/types/provider-operations";

export type CruiseExcursionFitStatus =
  | "available"
  | "cancelled_port_call"
  | "wrong_port"
  | "offer_outside_window"
  | "capacity_unconfigured"
  | "capacity_unverified"
  | "provider_closed"
  | "sold_out"
  | "insufficient_capacity"
  | "time_conflict";

export type CruiseExcursionFit = {
  status: CruiseExcursionFitStatus;
  planningAllAboardTime: string | null;
  allAboardSource: "derived_from_scheduled_departure";
  earliestStartTime: string | null;
  latestSafeStartTime: string | null;
  safeReturnDeadline: string | null;
  remainingCapacity: number | null;
  capacityVerified: boolean;
  requestedPartySize: number;
};

const DEFAULT_DISEMBARK_BUFFER_MINUTES = 45;
const DEFAULT_ALL_ABOARD_OFFSET_MINUTES = 30;

export function evaluateOfficialPortCallExcursionFit(input: {
  call: OfficialCruisePortCall;
  profile: ShoreExcursionProfile;
  offer: MerchantOfferBookingSnapshot;
  availabilityDay?: ProviderAvailabilityDay | null;
  reservedGuests?: number;
  partySize?: number;
  capacityDataComplete?: boolean;
  disembarkBufferMinutes?: number;
}): CruiseExcursionFit {
  const partySize = clampWhole(input.partySize, 1, 100, 1);
  const reservedGuests = clampWhole(input.reservedGuests, 0, 10000, 0);
  const planningAllAboardTime = derivePlanningAllAboard(
    input.call.departsAt,
    DEFAULT_ALL_ABOARD_OFFSET_MINUTES,
  );
  const base = {
    planningAllAboardTime,
    allAboardSource: "derived_from_scheduled_departure" as const,
    earliestStartTime: null,
    latestSafeStartTime: null,
    safeReturnDeadline: null,
    remainingCapacity: null,
    capacityVerified: false,
    requestedPartySize: partySize,
  };

  if (input.call.status !== "scheduled") {
    return { ...base, status: "cancelled_port_call" };
  }
  if (
    input.call.island !== input.profile.island ||
    !input.profile.supportedPorts.includes(input.call.portId)
  ) {
    return { ...base, status: "wrong_port" };
  }
  if (
    !shoreExcursionDateWithinOfferWindow({
      startDate: input.call.date,
      validFrom: input.offer.validFrom,
      validThrough: input.offer.validThrough,
    })
  ) {
    return { ...base, status: "offer_outside_window" };
  }

  const arrival = minutesFromTime(input.call.arrivesAt);
  const allAboard = minutesFromTime(planningAllAboardTime);
  if (arrival === null || allAboard === null) {
    return { ...base, status: "time_conflict" };
  }
  const disembarkBuffer = clampWhole(
    input.disembarkBufferMinutes,
    0,
    180,
    DEFAULT_DISEMBARK_BUFFER_MINUTES,
  );
  const shipEarliestStart = arrival + disembarkBuffer;
  const safeReturnDeadline = allAboard - input.profile.minReturnBufferMinutes;
  const latestByShip = safeReturnDeadline - input.profile.durationMinutes;
  const shipTimedBase = {
    ...base,
    earliestStartTime: timeFromMinutes(shipEarliestStart),
    latestSafeStartTime:
      latestByShip >= 0 ? timeFromMinutes(latestByShip) : null,
    safeReturnDeadline:
      safeReturnDeadline >= 0 ? timeFromMinutes(safeReturnDeadline) : null,
  };
  if (latestByShip < shipEarliestStart) {
    return { ...shipTimedBase, status: "time_conflict" };
  }

  if (!input.availabilityDay) {
    return { ...shipTimedBase, status: "capacity_unconfigured" };
  }
  if (!input.availabilityDay.isOpen) {
    return {
      ...shipTimedBase,
      status: "provider_closed",
      remainingCapacity: 0,
      capacityVerified: true,
    };
  }
  if (input.capacityDataComplete === false) {
    return { ...shipTimedBase, status: "capacity_unverified" };
  }

  const remainingCapacity = Math.max(
    0,
    Math.min(
      input.profile.maxGuests,
      input.availabilityDay.capacity - reservedGuests,
    ),
  );
  const capacityBase = {
    ...shipTimedBase,
    remainingCapacity,
    capacityVerified: true,
  };
  if (remainingCapacity <= 0) {
    return { ...capacityBase, status: "sold_out" };
  }
  if (partySize > input.profile.maxGuests || remainingCapacity < partySize) {
    return { ...capacityBase, status: "insufficient_capacity" };
  }

  const providerStart = minutesFromTime(input.availabilityDay.startTime);
  const providerEnd = minutesFromTime(input.availabilityDay.endTime);
  if (providerStart === null || providerEnd === null) {
    return { ...capacityBase, status: "time_conflict" };
  }

  const earliestStart = Math.max(shipEarliestStart, providerStart);
  const latestByProvider = providerEnd - input.profile.durationMinutes;
  const latestSafeStart = Math.min(latestByShip, latestByProvider);
  const timed = {
    ...capacityBase,
    earliestStartTime: timeFromMinutes(earliestStart),
    latestSafeStartTime:
      latestSafeStart >= 0 ? timeFromMinutes(latestSafeStart) : null,
  };

  if (latestSafeStart < earliestStart) {
    return { ...timed, status: "time_conflict" };
  }
  return { ...timed, status: "available" };
}

export function cruiseExcursionCapacityHoldStatus(value: unknown) {
  return (
    value === "requested" ||
    value === "reviewing" ||
    value === "payment_required" ||
    value === "paid" ||
    value === "confirmed"
  );
}

export function reservedGuestCount(
  records: Array<Record<string, unknown>>,
  date: string,
) {
  return records.reduce((sum, record) => {
    if (record.startDate !== date) return sum;
    if (!cruiseExcursionCapacityHoldStatus(record.status)) return sum;
    const adults = nonNegativeWhole(record.adults);
    const children = nonNegativeWhole(record.children);
    return sum + adults + children;
  }, 0);
}

function minutesFromTime(value: unknown) {
  if (typeof value !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    return null;
  }
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function timeFromMinutes(value: number) {
  const minutes = Math.max(0, Math.min(23 * 60 + 59, Math.round(value)));
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(
    minutes % 60,
  ).padStart(2, "0")}`;
}

function nonNegativeWhole(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.trunc(number)) : 0;
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
