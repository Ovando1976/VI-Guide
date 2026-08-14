import type { CruisePortCall, CruiseSailing } from "@/lib/cruise-inventory/types";
import type { JourneyPlan } from "@/lib/journey-planner";
import type { IntelligenceIsland, IntelligenceMemory } from "@/types/intelligence";

export const CRUISE_TRIP_STORAGE_KEY = "vi-guide.cruise.selected-trip";
export const CRUISE_TRIP_UPDATED_EVENT = "vi-guide-cruise-trip-updated";
const CRUISE_CONTEXT_MARKER = "[VI_GUIDE_CRUISE_CONTEXT]";
const PLANNING_ALL_ABOARD_OFFSET_MINUTES = 30;

export type CruiseTripPortCall = {
  sequence: number;
  portId: string;
  portName: string;
  city?: string;
  date: string;
  island?: IntelligenceIsland;
  arrivesAt: string | null;
  departsAt: string | null;
  arrivalTime?: string;
  departureTime?: string;
  planningAllAboardTime?: string;
  planningAllAboardSource: "derived_from_scheduled_departure" | "unavailable";
  shorePortId?: string;
};

export type CanonicalCruiseTrip = {
  id: string;
  sailingId: string;
  supplierSailingId: string;
  provider: CruiseSailing["provider"];
  cruiseLine: CruiseSailing["cruiseLine"];
  ship: CruiseSailing["ship"];
  departurePort: CruiseSailing["departurePort"];
  arrivalPort: CruiseSailing["arrivalPort"];
  departureDate: string;
  returnDate: string;
  nights: number;
  destinationNames: string[];
  portCalls: CruiseTripPortCall[];
  selectedAt: string;
  lastVerifiedAt: string;
  liveVerified: boolean;
};

export type CruiseJourneyContext = {
  cruiseTripId: string;
  sailingId: string;
  provider: CruiseSailing["provider"];
  cruiseLine: string;
  ship: string;
  portId: string;
  portName: string;
  island: IntelligenceIsland;
  date: string;
  arrivalTime?: string;
  departureTime?: string;
  allAboardTime?: string;
  allAboardSource: "derived_from_scheduled_departure" | "unavailable";
  shorePortId?: string;
};

export function createCanonicalCruiseTrip(
  sailing: CruiseSailing,
  now = new Date(),
): CanonicalCruiseTrip {
  return {
    id: canonicalCruiseTripId(sailing),
    sailingId: sailing.id,
    supplierSailingId: sailing.supplierSailingId,
    provider: sailing.provider,
    cruiseLine: sailing.cruiseLine,
    ship: sailing.ship,
    departurePort: sailing.departurePort,
    arrivalPort: sailing.arrivalPort,
    departureDate: sailing.departureDate,
    returnDate: sailing.returnDate,
    nights: sailing.nights,
    destinationNames: sailing.destinationNames.slice(0, 12),
    portCalls: sailing.itinerary.map((call) => normalizePortCall(call, sailing)),
    selectedAt: now.toISOString(),
    lastVerifiedAt: sailing.lastVerifiedAt,
    liveVerified: sailing.liveVerified,
  };
}

export function materializeCruiseJourneyPlans(
  trip: CanonicalCruiseTrip,
  now = new Date(),
): JourneyPlan[] {
  const createdAt = now.toISOString();
  return trip.portCalls
    .filter(
      (call): call is CruiseTripPortCall & { island: IntelligenceIsland } =>
        Boolean(call.island && call.date),
    )
    .sort((a, b) => a.date.localeCompare(b.date) || a.sequence - b.sequence)
    .map((call) => {
      const context: CruiseJourneyContext = {
        cruiseTripId: trip.id,
        sailingId: trip.sailingId,
        provider: trip.provider,
        cruiseLine: trip.cruiseLine.name,
        ship: trip.ship.name,
        portId: call.portId,
        portName: call.portName,
        island: call.island,
        date: call.date,
        ...(call.arrivalTime ? { arrivalTime: call.arrivalTime } : {}),
        ...(call.departureTime ? { departureTime: call.departureTime } : {}),
        ...(call.planningAllAboardTime
          ? { allAboardTime: call.planningAllAboardTime }
          : {}),
        allAboardSource: call.planningAllAboardSource,
        ...(call.shorePortId ? { shorePortId: call.shorePortId } : {}),
      };
      const summary = cruisePortCallSummary(context);
      const shoreHref = buildShoreExcursionHref(trip, call);
      return {
        id: `cruise_port_${safeId(`${trip.id}_${call.sequence}`)}`.slice(0, 160),
        title: `${trip.ship.name} · ${islandLabel(call.island)} port day`.slice(0, 120),
        island: call.island,
        date: call.date,
        createdAt,
        updatedAt: createdAt,
        status: "draft" as const,
        notes: encodeCruiseJourneyNotes(context, summary),
        plan: [
          {
            id: `cruise_arrival_${safeId(`${trip.id}_${call.sequence}`)}`.slice(0, 160),
            placeId: `cruise-port-${safeId(call.portId || call.portName)}`.slice(0, 160),
            title: `${trip.ship.name} at ${call.portName}`.slice(0, 160),
            island: call.island,
            kind: "cruise-port",
            summary: summary.slice(0, 1200),
            ...(call.arrivalTime ? { startTime: call.arrivalTime } : {}),
            durationMinutes: 30,
            href: "/cruises",
            bookingHref: shoreHref,
            mobility: {
              to: call.portName.slice(0, 160),
              mode: "transfer" as const,
              estimatedMinutes: 45,
            },
          },
        ],
      } satisfies JourneyPlan;
    });
}

export function cruiseJourneyContextFromPlan(
  plan: JourneyPlan | null | undefined,
): CruiseJourneyContext | null {
  if (!plan?.notes.startsWith(CRUISE_CONTEXT_MARKER)) return null;
  const firstLine = plan.notes.split("\n", 1)[0];
  const raw = firstLine.slice(CRUISE_CONTEXT_MARKER.length);
  try {
    return normalizeCruiseJourneyContext(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function cruiseMemoryFromJourneyPlan(
  plan: JourneyPlan | null | undefined,
): IntelligenceMemory["cruise"] | undefined {
  const context = cruiseJourneyContextFromPlan(plan);
  if (!context) return undefined;
  return {
    tripId: context.cruiseTripId,
    sailingId: context.sailingId,
    cruiseLine: context.cruiseLine,
    ship: context.ship,
    portCallDate: context.date,
    port: {
      id: context.portId,
      name: context.portName,
      island: context.island,
      kind: "cruise-port",
    },
    ...(context.arrivalTime ? { arrivalTime: context.arrivalTime } : {}),
    ...(context.allAboardTime ? { allAboardTime: context.allAboardTime } : {}),
    allAboardSource: context.allAboardSource,
  };
}

export function buildShoreExcursionHref(
  trip: CanonicalCruiseTrip,
  call: CruiseTripPortCall,
) {
  const params = new URLSearchParams({
    cruiseTrip: trip.id,
    sailing: trip.sailingId,
    ship: trip.ship.name,
    cruiseLine: trip.cruiseLine.name,
    date: call.date,
    portName: call.portName,
  });
  if (call.island) params.set("island", call.island);
  if (call.shorePortId) params.set("portId", call.shorePortId);
  if (call.arrivalTime) params.set("arrival", call.arrivalTime);
  if (call.planningAllAboardTime) {
    params.set("allAboard", call.planningAllAboardTime);
    params.set("allAboardEstimated", "1");
  }
  return `/shore-excursions?${params.toString()}`;
}

export function canonicalCruiseTripId(sailing: CruiseSailing) {
  return `cruise_${safeId(`${sailing.provider}_${sailing.supplierSailingId || sailing.id}`)}`.slice(
    0,
    160,
  );
}

function normalizePortCall(call: CruisePortCall, sailing: CruiseSailing): CruiseTripPortCall {
  const island = detectUsviIsland(call);
  const departureTime = localTime(call.departsAt);
  return {
    sequence: call.sequence,
    portId: call.port.id,
    portName: call.port.name,
    ...(call.port.city ? { city: call.port.city } : {}),
    date: portCallDate(call, sailing),
    ...(island ? { island } : {}),
    arrivesAt: call.arrivesAt,
    departsAt: call.departsAt,
    ...(localTime(call.arrivesAt) ? { arrivalTime: localTime(call.arrivesAt)! } : {}),
    ...(departureTime ? { departureTime } : {}),
    ...(departureTime
      ? {
          planningAllAboardTime: subtractMinutes(
            departureTime,
            PLANNING_ALL_ABOARD_OFFSET_MINUTES,
          ),
        }
      : {}),
    planningAllAboardSource: departureTime
      ? "derived_from_scheduled_departure"
      : "unavailable",
    ...(shorePortId(call, island) ? { shorePortId: shorePortId(call, island)! } : {}),
  };
}

function detectUsviIsland(call: CruisePortCall): IntelligenceIsland | undefined {
  const haystack = [call.port.id, call.port.name, call.port.city, call.dayLabel]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (
    /st\.?\s*thomas|saint\s*thomas|charlotte\s*amalie|havensight|crown\s*bay/.test(
      haystack,
    )
  ) {
    return "stt";
  }
  if (/st\.?\s*john|saint\s*john|cruz\s*bay/.test(haystack)) return "stj";
  if (
    /st\.?\s*croix|saint\s*croix|frederiksted|christiansted/.test(haystack)
  ) {
    return "stx";
  }
  return undefined;
}

function shorePortId(
  call: CruisePortCall,
  island: IntelligenceIsland | undefined,
): string | undefined {
  const haystack = [call.port.id, call.port.name, call.port.city]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (island === "stt") {
    if (haystack.includes("havensight")) return "havensight";
    if (haystack.includes("crown bay")) return "crown_bay";
    if (haystack.includes("anchor")) return "charlotte_amalie_anchorage";
  }
  if (island === "stj") return "cruz_bay";
  if (island === "stx") {
    if (haystack.includes("christiansted")) return "christiansted_tender";
    if (haystack.includes("frederiksted")) return "frederiksted";
  }
  return undefined;
}

function portCallDate(call: CruisePortCall, sailing: CruiseSailing) {
  const exact = datePart(call.arrivesAt) || datePart(call.departsAt);
  if (exact) return exact;
  const match = call.dayLabel.match(/\bday\s*(\d+)\b/i);
  const day = match ? Number(match[1]) : call.sequence + 1;
  const base = new Date(`${sailing.departureDate}T12:00:00.000Z`);
  if (!Number.isFinite(base.getTime())) return sailing.departureDate;
  base.setUTCDate(base.getUTCDate() + Math.max(0, day - 1));
  return base.toISOString().slice(0, 10);
}

function encodeCruiseJourneyNotes(context: CruiseJourneyContext, summary: string) {
  const machine = `${CRUISE_CONTEXT_MARKER}${JSON.stringify(context)}`;
  const warning =
    context.allAboardSource === "derived_from_scheduled_departure"
      ? "USVI Explorer planning note: the all-aboard time is a conservative planning proxy set 30 minutes before the supplier's scheduled departure. Verify the ship's actual all-aboard announcement onboard."
      : "USVI Explorer planning note: verify the ship's actual all-aboard time before committing to port-day activities.";
  return `${machine}\n\n${summary}\n\n${warning}`.slice(0, 2000);
}

function cruisePortCallSummary(context: CruiseJourneyContext) {
  const pieces = [
    `${context.cruiseLine} · ${context.ship}`,
    `${context.portName} on ${context.date}`,
    context.arrivalTime ? `scheduled arrival ${context.arrivalTime}` : "arrival time not supplied",
    context.departureTime
      ? `scheduled departure ${context.departureTime}`
      : "departure time not supplied",
    context.allAboardTime
      ? `USVI Explorer planning all-aboard ${context.allAboardTime}`
      : "all-aboard time still needs confirmation",
  ];
  return pieces.join(" · ");
}

function normalizeCruiseJourneyContext(value: unknown): CruiseJourneyContext | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<CruiseJourneyContext>;
  const island =
    candidate.island === "stt" || candidate.island === "stj" || candidate.island === "stx"
      ? candidate.island
      : null;
  if (
    !island ||
    typeof candidate.cruiseTripId !== "string" ||
    typeof candidate.sailingId !== "string" ||
    typeof candidate.cruiseLine !== "string" ||
    typeof candidate.ship !== "string" ||
    typeof candidate.portId !== "string" ||
    typeof candidate.portName !== "string" ||
    typeof candidate.date !== "string"
  ) {
    return null;
  }
  const source =
    candidate.allAboardSource === "derived_from_scheduled_departure"
      ? candidate.allAboardSource
      : "unavailable";
  return {
    cruiseTripId: candidate.cruiseTripId.slice(0, 160),
    sailingId: candidate.sailingId.slice(0, 160),
    provider:
      candidate.provider === "traveltek" ||
      candidate.provider === "revelex" ||
      candidate.provider === "mock"
        ? candidate.provider
        : "mock",
    cruiseLine: candidate.cruiseLine.slice(0, 160),
    ship: candidate.ship.slice(0, 160),
    portId: candidate.portId.slice(0, 160),
    portName: candidate.portName.slice(0, 160),
    island,
    date: candidate.date.slice(0, 10),
    ...(validTime(candidate.arrivalTime) ? { arrivalTime: candidate.arrivalTime } : {}),
    ...(validTime(candidate.departureTime)
      ? { departureTime: candidate.departureTime }
      : {}),
    ...(validTime(candidate.allAboardTime)
      ? { allAboardTime: candidate.allAboardTime }
      : {}),
    allAboardSource: source,
    ...(typeof candidate.shorePortId === "string" && candidate.shorePortId
      ? { shorePortId: candidate.shorePortId.slice(0, 80) }
      : {}),
  };
}

function datePart(value: string | null) {
  if (!value) return "";
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? "";
}

function localTime(value: string | null) {
  if (!value) return undefined;
  const explicit = value.match(/T(\d{2}):(\d{2})/);
  if (explicit) return `${explicit[1]}:${explicit[2]}`;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return undefined;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/St_Thomas",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parsed);
}

function subtractMinutes(value: string, minutes: number) {
  const [hour, minute] = value.split(":").map(Number);
  const total = Math.max(0, hour * 60 + minute - minutes);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function validTime(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function islandLabel(island: IntelligenceIsland) {
  if (island === "stj") return "St. John";
  if (island === "stx") return "St. Croix";
  return "St. Thomas";
}

function safeId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
