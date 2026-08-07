import { createHash } from "node:crypto";

import type { MerchantOfferBookingSnapshot } from "@/lib/merchant-offer-booking";
import type { IntelligenceIsland } from "@/types/intelligence";

export const SHORE_EXCURSION_STATUSES = [
  "draft",
  "active",
  "paused",
  "archived",
] as const;

export type ShoreExcursionStatus = (typeof SHORE_EXCURSION_STATUSES)[number];

export const SHORE_EXCURSION_PORTS = [
  {
    id: "havensight",
    island: "stt",
    label: "Havensight / WICO",
    shortLabel: "Havensight",
  },
  {
    id: "crown_bay",
    island: "stt",
    label: "Crown Bay",
    shortLabel: "Crown Bay",
  },
  {
    id: "charlotte_amalie_anchorage",
    island: "stt",
    label: "Charlotte Amalie anchorage",
    shortLabel: "Charlotte Amalie",
  },
  {
    id: "cruz_bay",
    island: "stj",
    label: "Cruz Bay tender / ferry area",
    shortLabel: "Cruz Bay",
  },
  {
    id: "frederiksted",
    island: "stx",
    label: "Frederiksted Cruise Pier",
    shortLabel: "Frederiksted",
  },
  {
    id: "christiansted_tender",
    island: "stx",
    label: "Christiansted tender area",
    shortLabel: "Christiansted",
  },
] as const;

export type ShoreExcursionPortId = (typeof SHORE_EXCURSION_PORTS)[number]["id"];

export type ShoreExcursionProfileInput = {
  offerId?: unknown;
  supportedPorts?: unknown;
  meetingPoint?: unknown;
  durationMinutes?: unknown;
  minReturnBufferMinutes?: unknown;
  pickupIncluded?: unknown;
  maxGuests?: unknown;
  mobilityNotes?: unknown;
  accessibilityNotes?: unknown;
};

export type ShoreExcursionProfile = {
  offerId: string;
  island: IntelligenceIsland;
  supportedPorts: ShoreExcursionPortId[];
  meetingPoint: string;
  durationMinutes: number;
  minReturnBufferMinutes: number;
  pickupIncluded: boolean;
  maxGuests: number;
  mobilityNotes: string | null;
  accessibilityNotes: string | null;
};

export type ShoreExcursionPublicSnapshot = ShoreExcursionProfile & {
  status: ShoreExcursionStatus;
  offer: MerchantOfferBookingSnapshot;
};

export type ShoreExcursionTimingResult =
  | {
      ok: true;
      excursionEndsAt: string;
      safeReturnDeadline: string;
      latestSafeStartTime: string;
      bufferMinutes: number;
    }
  | {
      ok: false;
      reason:
        | "invalid_time"
        | "all_aboard_before_start"
        | "insufficient_return_buffer";
      excursionEndsAt?: string;
      safeReturnDeadline?: string;
      latestSafeStartTime?: string;
      bufferMinutes?: number;
    };

const STATUS_TRANSITIONS: Record<ShoreExcursionStatus, ShoreExcursionStatus[]> = {
  draft: ["active", "archived"],
  active: ["paused", "archived"],
  paused: ["active", "archived"],
  archived: [],
};

export function normalizeShoreExcursionProfile(input: {
  profile: ShoreExcursionProfileInput;
  offer: MerchantOfferBookingSnapshot;
}): { ok: true; profile: ShoreExcursionProfile } | { ok: false; error: string } {
  const { offer } = input;
  if (offer.kind !== "tour" && offer.kind !== "experience") {
    return {
      ok: false,
      error: "Only tour or experience offers can become shore excursions.",
    };
  }

  const supportedPorts = normalizePorts(input.profile.supportedPorts).filter(
    (portId) => shoreExcursionPort(portId)?.island === offer.island,
  );
  const meetingPoint = clean(input.profile.meetingPoint, 240);
  const durationMinutes = normalizeWholeNumber(
    input.profile.durationMinutes,
    30,
    720,
  );
  const minReturnBufferMinutes = normalizeWholeNumber(
    input.profile.minReturnBufferMinutes,
    60,
    300,
  );
  const maxGuests = normalizeWholeNumber(input.profile.maxGuests, 1, 100);
  const pickupIncluded = input.profile.pickupIncluded === true;
  const mobilityNotes = cleanMultiline(input.profile.mobilityNotes, 1200) || null;
  const accessibilityNotes =
    cleanMultiline(input.profile.accessibilityNotes, 1200) || null;

  if (!supportedPorts.length) {
    return { ok: false, error: "Choose at least one cruise port on this island." };
  }
  if (meetingPoint.length < 8) {
    return { ok: false, error: "Describe the cruise guest meeting point." };
  }
  if (durationMinutes === null) {
    return {
      ok: false,
      error: "Set an excursion duration between 30 minutes and 12 hours.",
    };
  }
  if (minReturnBufferMinutes === null) {
    return {
      ok: false,
      error: "Set a return-to-ship buffer between 60 minutes and 5 hours.",
    };
  }
  if (maxGuests === null) {
    return { ok: false, error: "Set a maximum group size between 1 and 100." };
  }

  return {
    ok: true,
    profile: {
      offerId: offer.offerId,
      island: offer.island,
      supportedPorts,
      meetingPoint,
      durationMinutes,
      minReturnBufferMinutes,
      pickupIncluded,
      maxGuests,
      mobilityNotes,
      accessibilityNotes,
    },
  };
}

export function normalizeShoreExcursionStatus(
  value: unknown,
): ShoreExcursionStatus | null {
  return typeof value === "string" &&
    SHORE_EXCURSION_STATUSES.includes(value as ShoreExcursionStatus)
    ? (value as ShoreExcursionStatus)
    : null;
}

export function canTransitionShoreExcursion(
  current: unknown,
  next: unknown,
) {
  const currentStatus = normalizeShoreExcursionStatus(current);
  const nextStatus = normalizeShoreExcursionStatus(next);
  return Boolean(
    currentStatus &&
      nextStatus &&
      (currentStatus === nextStatus ||
        STATUS_TRANSITIONS[currentStatus].includes(nextStatus)),
  );
}

export function shoreExcursionPort(value: unknown) {
  return SHORE_EXCURSION_PORTS.find((port) => port.id === value) ?? null;
}

export function shoreExcursionPortsForIsland(island: IntelligenceIsland) {
  return SHORE_EXCURSION_PORTS.filter((port) => port.island === island);
}

export function evaluateShoreExcursionTiming(input: {
  startTime: unknown;
  allAboardTime: unknown;
  durationMinutes: number;
  minReturnBufferMinutes: number;
}): ShoreExcursionTimingResult {
  const start = parseTime(input.startTime);
  const allAboard = parseTime(input.allAboardTime);
  if (start === null || allAboard === null) {
    return { ok: false, reason: "invalid_time" };
  }
  if (allAboard <= start) {
    return { ok: false, reason: "all_aboard_before_start" };
  }

  const excursionEnds = start + input.durationMinutes;
  const safeReturnDeadline = allAboard - input.minReturnBufferMinutes;
  const latestSafeStart = safeReturnDeadline - input.durationMinutes;
  const shared = {
    excursionEndsAt: formatMinutes(excursionEnds),
    safeReturnDeadline: formatMinutes(safeReturnDeadline),
    latestSafeStartTime: formatMinutes(latestSafeStart),
    bufferMinutes: allAboard - excursionEnds,
  };

  if (excursionEnds > safeReturnDeadline) {
    return {
      ok: false,
      reason: "insufficient_return_buffer",
      ...shared,
    };
  }

  return { ok: true, ...shared };
}

export function shoreExcursionBookingDocumentId(input: {
  offerId: string;
  email: string;
  startDate: string;
  preferredTime: string;
  shipName: string;
  portId: ShoreExcursionPortId;
  allAboardTime: string;
  offerPriceCents: number;
}) {
  const digest = createHash("sha256")
    .update(
      [
        "shore-excursion-v1",
        clean(input.offerId, 160),
        clean(input.email, 220).toLowerCase(),
        clean(input.startDate, 10),
        clean(input.preferredTime, 5),
        clean(input.shipName, 160).toLowerCase(),
        input.portId,
        clean(input.allAboardTime, 5),
        String(input.offerPriceCents),
      ].join("|"),
    )
    .digest("hex")
    .slice(0, 40);
  return `shore_${digest}`;
}

export function normalizeShipName(value: unknown) {
  return clean(value, 160);
}

export function normalizeCruiseLine(value: unknown) {
  return clean(value, 160);
}

export function normalizeTime(value: unknown) {
  return parseTime(value) === null ? "" : String(value);
}

function normalizePorts(value: unknown): ShoreExcursionPortId[] {
  if (!Array.isArray(value)) return [];
  const valid = new Set(SHORE_EXCURSION_PORTS.map((port) => port.id));
  return Array.from(
    new Set(
      value.filter(
        (entry): entry is ShoreExcursionPortId =>
          typeof entry === "string" && valid.has(entry as ShoreExcursionPortId),
      ),
    ),
  );
}

function normalizeWholeNumber(value: unknown, minimum: number, maximum: number) {
  const amount = Number(value);
  return Number.isInteger(amount) && amount >= minimum && amount <= maximum
    ? amount
    : null;
}

function parseTime(value: unknown) {
  if (typeof value !== "string" || !/^\d{2}:\d{2}$/.test(value)) return null;
  const [hour, minute] = value.split(":").map(Number);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return hour * 60 + minute;
}

function formatMinutes(value: number) {
  const normalized = Math.max(0, Math.min(23 * 60 + 59, value));
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function cleanMultiline(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value
        .replace(/\r\n?/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
        .slice(0, maxLength)
    : "";
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
