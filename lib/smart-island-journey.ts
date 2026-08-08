import { FERRY_ROUTES, type FerryPortId, type FerryRoute } from "@/lib/ferry-planner";

export type JourneyIsland = "stt" | "stj" | "stx";
export type JourneyTimeMode = "departAfter" | "arriveBy";

export type JourneyPlace = {
  id: string;
  label: string;
  island: JourneyIsland;
  kind: "airport" | "town" | "terminal" | "beach" | "destination";
  terminalTransfers: Partial<Record<FerryPortId, number>>;
};

export type SmartJourneyLeg = {
  mode: "taxi" | "ferry";
  from: string;
  to: string;
  minutes: number;
  startTime: string;
  endTime: string;
  note: string;
  mobilityHref?: string;
};

export type SmartJourneyPlan = {
  origin: JourneyPlace;
  destination: JourneyPlace;
  route: FerryRoute;
  travelDate: string;
  timeMode: JourneyTimeMode;
  requestedTime: string;
  leaveOriginTime: string;
  ferryDepartureTime: string;
  destinationArrivalTime: string;
  totalMinutes: number;
  legs: SmartJourneyLeg[];
  warning?: string;
};

export const JOURNEY_PLACES: JourneyPlace[] = [
  { id: "stt-airport", label: "Cyril E. King Airport", island: "stt", kind: "airport", terminalTransfers: { "charlotte-amalie": 15, "red-hook": 35 } },
  { id: "charlotte-amalie", label: "Charlotte Amalie", island: "stt", kind: "town", terminalTransfers: { "charlotte-amalie": 5, "red-hook": 30 } },
  { id: "havensight", label: "Havensight / WICO", island: "stt", kind: "destination", terminalTransfers: { "charlotte-amalie": 10, "red-hook": 25 } },
  { id: "red-hook", label: "Red Hook", island: "stt", kind: "terminal", terminalTransfers: { "red-hook": 3, "charlotte-amalie": 30 } },
  { id: "cruz-bay", label: "Cruz Bay", island: "stj", kind: "terminal", terminalTransfers: { "cruz-bay": 3 } },
  { id: "trunk-bay", label: "Trunk Bay", island: "stj", kind: "beach", terminalTransfers: { "cruz-bay": 20 } },
  { id: "coral-bay", label: "Coral Bay", island: "stj", kind: "town", terminalTransfers: { "cruz-bay": 35 } },
  { id: "gallows-bay", label: "Gallows Bay", island: "stx", kind: "terminal", terminalTransfers: { "gallows-bay": 3 } },
  { id: "christiansted", label: "Christiansted", island: "stx", kind: "town", terminalTransfers: { "gallows-bay": 5 } },
  { id: "stx-airport", label: "Henry E. Rohlsen Airport", island: "stx", kind: "airport", terminalTransfers: { "gallows-bay": 20 } },
  { id: "frederiksted", label: "Frederiksted", island: "stx", kind: "town", terminalTransfers: { "gallows-bay": 40 } },
];

export function getJourneyPlace(id: string) {
  return JOURNEY_PLACES.find((place) => place.id === id) ?? null;
}

export function planSmartIslandJourney(input: {
  originId: string;
  destinationId: string;
  travelDate: string;
  requestedTime: string;
  timeMode: JourneyTimeMode;
}): SmartJourneyPlan | null {
  const origin = getJourneyPlace(input.originId);
  const destination = getJourneyPlace(input.destinationId);
  if (!origin || !destination || origin.island === destination.island) return null;

  const candidates = FERRY_ROUTES
    .filter((route) => routeConnectsIslands(route, origin.island, destination.island))
    .filter((route) => routeOperatesOnDate(route, input.travelDate))
    .map((route) => buildCandidate(origin, destination, route, input.travelDate, input.requestedTime, input.timeMode))
    .filter((plan): plan is SmartJourneyPlan => Boolean(plan));

  if (!candidates.length) return null;

  return candidates.sort((a, b) => {
    if (input.timeMode === "arriveBy") {
      return toMinutes(b.leaveOriginTime) - toMinutes(a.leaveOriginTime);
    }
    return toMinutes(a.destinationArrivalTime) - toMinutes(b.destinationArrivalTime);
  })[0];
}

function buildCandidate(
  origin: JourneyPlace,
  destination: JourneyPlace,
  route: FerryRoute,
  travelDate: string,
  requestedTime: string,
  timeMode: JourneyTimeMode,
): SmartJourneyPlan | null {
  const originTransfer = origin.terminalTransfers[route.from];
  const arrivalTransfer = destination.terminalTransfers[route.to];
  if (originTransfer == null || arrivalTransfer == null) return null;

  const sailings = route.departures
    .map(cleanDeparture)
    .map((label) => ({ label, minutes: toMinutes(label) }))
    .filter((sailing) => Number.isFinite(sailing.minutes));
  if (!sailings.length) return null;

  const requested = toMinutes(requestedTime);
  const departure = timeMode === "arriveBy"
    ? [...sailings].reverse().find((sailing) => sailing.minutes + route.durationMinutes + arrivalTransfer <= requested)
    : sailings.find((sailing) => sailing.minutes - route.checkInMinutes - originTransfer >= requested);
  if (!departure) return null;

  const leaveOrigin = departure.minutes - route.checkInMinutes - originTransfer;
  const ferryArrival = departure.minutes + route.durationMinutes;
  const destinationArrival = ferryArrival + arrivalTransfer;
  const legs: SmartJourneyLeg[] = [];

  if (originTransfer > 5) {
    legs.push({
      mode: "taxi",
      from: origin.label,
      to: route.fromLabel,
      minutes: originTransfer,
      startTime: fromMinutes(leaveOrigin),
      endTime: fromMinutes(leaveOrigin + originTransfer),
      note: `Planning estimate. Arrive about ${route.checkInMinutes} minutes before the published sailing.`,
      mobilityHref: mobilityHref(origin.label, route.fromLabel),
    });
  }

  legs.push({
    mode: "ferry",
    from: route.fromLabel,
    to: route.toLabel,
    minutes: route.durationMinutes,
    startTime: fromMinutes(departure.minutes),
    endTime: fromMinutes(ferryArrival),
    note: `${route.serviceLabel}. ${route.operatingDays}. Verify the sailing with ${route.sourceLabel} before travel.`,
  });

  if (arrivalTransfer > 5) {
    legs.push({
      mode: "taxi",
      from: route.toLabel,
      to: destination.label,
      minutes: arrivalTransfer,
      startTime: fromMinutes(ferryArrival),
      endTime: fromMinutes(destinationArrival),
      note: "Planning estimate for the arrival transfer; actual travel time varies with traffic and pickup conditions.",
      mobilityHref: mobilityHref(route.toLabel, destination.label),
    });
  }

  return {
    origin,
    destination,
    route,
    travelDate,
    timeMode,
    requestedTime,
    leaveOriginTime: fromMinutes(leaveOrigin),
    ferryDepartureTime: fromMinutes(departure.minutes),
    destinationArrivalTime: fromMinutes(destinationArrival),
    totalMinutes: destinationArrival - leaveOrigin,
    legs,
    ...(route.seasonal ? { warning: "This sailing is seasonal. Verify the current operating schedule before relying on it." } : {}),
  };
}

function routeConnectsIslands(route: FerryRoute, origin: JourneyIsland, destination: JourneyIsland) {
  return portIsland(route.from) === origin && portIsland(route.to) === destination;
}

function portIsland(port: FerryPortId): JourneyIsland {
  if (port === "cruz-bay") return "stj";
  if (port === "gallows-bay") return "stx";
  return "stt";
}

function routeOperatesOnDate(route: FerryRoute, date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return true;
  if (!route.id.includes("gallows-bay")) return true;
  const weekday = new Date(`${date}T12:00:00-04:00`).getDay();
  return weekday === 0 || weekday === 1 || weekday === 4 || weekday === 5 || weekday === 6;
}

function cleanDeparture(value: string) {
  return value.replace("*", "").trim();
}

function toMinutes(value: string) {
  const normalized = value.trim().toUpperCase();
  const ampm = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (ampm) {
    let hour = Number(ampm[1]);
    const minute = Number(ampm[2]);
    if (ampm[3] === "AM" && hour === 12) hour = 0;
    if (ampm[3] === "PM" && hour !== 12) hour += 12;
    return hour * 60 + minute;
  }
  const twentyFour = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (!twentyFour) return Number.NaN;
  return Number(twentyFour[1]) * 60 + Number(twentyFour[2]);
}

function fromMinutes(value: number) {
  const safe = ((value % 1440) + 1440) % 1440;
  const hour24 = Math.floor(safe / 60);
  const minute = safe % 60;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function mobilityHref(from: string, to: string) {
  return `/mobility?mode=ferry-transfer&pickupName=${encodeURIComponent(from)}&destinationName=${encodeURIComponent(to)}`;
}
