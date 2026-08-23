import {
  CAR_BARGE_ROUTES as BASE_CAR_BARGE_ROUTES,
  FERRY_PORT_COORDINATES,
  FERRY_PORTS,
  FERRY_ROUTES as BASE_FERRY_ROUTES,
  getDeparturesForWeekday as getBaseDeparturesForWeekday,
  getNextFerryDeparture as getBaseNextFerryDeparture,
  type FerryMode,
  type FerryPortId,
  type FerryRoute as BaseFerryRoute,
  type NextFerryDeparture,
} from "@/lib/ferry-planner-base";

export { FERRY_PORT_COORDINATES, FERRY_PORTS };
export type { FerryMode, FerryPortId, NextFerryDeparture };

export type FerryScheduleStatus =
  | "verified-current"
  | "temporary-override"
  | "operator-dependent"
  | "verify-current";

export type FerryRoute = BaseFerryRoute & {
  scheduleStatus: FerryScheduleStatus;
  verifiedAt: string;
  sourceAuthority: string;
  scheduleNotice?: string;
  temporarySchedule?: {
    startsOn: string;
    endsOn: string;
    label: string;
  };
};

export type FerryScheduleSource = {
  id: string;
  label: string;
  authority: string;
  url: string;
  verifiedAt: string;
};

const VERIFIED_AT = "2026-08-23";
const VIPA = "https://www.viport.com/schedules-ferrycargoschedules";
const WATER_ISLAND = "https://waterislandferry.com/";
const BVI_TOURISM = "https://www.bvitourism.com/ferry-schedules";

export const FERRY_SCHEDULE_SOURCES: readonly FerryScheduleSource[] = [
  {
    id: "vipa-current-seaport-schedules",
    label: "Virgin Islands Port Authority Ferry & Cargo Vessel Schedules",
    authority: "Virgin Islands Port Authority",
    url: VIPA,
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "water-island-ferry-current",
    label: "Water Island Ferry Schedule & Fares",
    authority: "Water Island Ferry",
    url: WATER_ISLAND,
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "bvi-tourism-current-ferries",
    label: "British Virgin Islands Tourist Board Ferry Schedules",
    authority: "British Virgin Islands Tourist Board",
    url: BVI_TOURISM,
    verifiedAt: VERIFIED_AT,
  },
] as const;

function uniqueStrings(values: readonly string[]) {
  return [...new Set(values.filter(Boolean))];
}

function withCurrentPassengerGovernance(route: BaseFerryRoute): FerryRoute {
  const governed: FerryRoute = {
    ...route,
    scheduleStatus: "verified-current",
    verifiedAt: VERIFIED_AT,
    sourceAuthority: route.sourceLabel,
  };

  switch (route.id) {
    case "red-hook-cruz-bay":
    case "cruz-bay-red-hook":
      return {
        ...governed,
        durationMinutes: 15,
        departures: [],
        weekdayDepartures: [],
        weekendDepartures: [],
        saturdayDepartures: undefined,
        sundayDepartures: undefined,
        operatingDays:
          "Temporary VIPA off-season schedule active July 26–October 31, 2026 — verify official schedule",
        scheduleStatus: "temporary-override",
        sourceLabel: "Virgin Islands Port Authority",
        sourceUrl: VIPA,
        sourceAuthority: "Virgin Islands Port Authority",
        temporarySchedule: {
          startsOn: "2026-07-26",
          endsOn: "2026-10-31",
          label: "VIPA temporary off-season passenger ferry schedule",
        },
        scheduleNotice:
          "VIPA states that a temporary off-season Red Hook–Cruz Bay schedule is in effect July 26 through October 31, 2026. The temporary departure times are published by VIPA as an official schedule image, so USVI Explorer intentionally suppresses the regular timetable and next-departure calculation during that override rather than guessing.",
        terminalNote: `${route.terminalNote ?? ""} Temporary off-season schedule is active through October 31, 2026; verify VIPA before leaving.`.trim(),
        goodToKnow: uniqueStrings([
          "Temporary off-season schedule is active July 26–October 31, 2026; verify the official VIPA schedule before leaving.",
          "USVI Explorer suppresses the regular timetable while the temporary override is active rather than presenting a stale next-ferry time.",
          ...(route.goodToKnow ?? []),
        ]),
      };

    case "charlotte-amalie-cruz-bay":
    case "cruz-bay-charlotte-amalie":
      return {
        ...governed,
        sourceLabel: "Virgin Islands Port Authority",
        sourceUrl: VIPA,
        sourceAuthority: "Virgin Islands Port Authority",
        scheduleNotice:
          "VIPA currently lists this downtown St. Thomas–Cruz Bay service and explicitly marks it subject to seasonal change. Confirm the same-day schedule before travel.",
        goodToKnow: uniqueStrings([
          "VIPA marks this route subject to seasonal change; verify the same-day departure before leaving.",
          ...(route.goodToKnow ?? []),
        ]),
      };

    case "charlotte-amalie-gallows-bay":
    case "gallows-bay-charlotte-amalie":
      return {
        ...governed,
        sourceLabel: "Virgin Islands Port Authority",
        sourceUrl: VIPA,
        sourceAuthority: "Virgin Islands Port Authority",
        scheduleNotice:
          "VIPA currently lists QE IV service Thursday through Monday: St. Croix departs 8:00 AM and St. Thomas departs 3:00 PM. Arrive 30 minutes early; check-in closes 15 minutes before departure.",
        goodToKnow: uniqueStrings([
          "Arrive 30 minutes before departure; VIPA says check-in ends 15 minutes before departure.",
          "Current VIPA fare is $60 one way; one small bag plus one personal item is included.",
          ...(route.goodToKnow ?? []),
        ]),
      };

    case "crown-bay-cruz-bay":
      return {
        ...governed,
        departures: ["3:30 PM", "5:30 PM"],
        weekdayDepartures: ["3:30 PM", "5:30 PM"],
        weekendDepartures: undefined,
        saturdayDepartures: ["2:15 PM", "3:30 PM", "5:30 PM"],
        sundayDepartures: ["2:15 PM", "3:30 PM", "5:30 PM"],
        operatingDays: "Daily; 2:15 PM also operates Saturday and Sunday",
        sourceLabel: "Virgin Islands Port Authority / Inter Island Boat Services",
        sourceUrl: VIPA,
        sourceAuthority: "Virgin Islands Port Authority",
        operatorPhones: ["(340) 201-6311", "(340) 776-6597"],
        scheduleNotice:
          "Current VIPA listing: 3:30 PM and 5:30 PM daily, plus 2:15 PM on Saturday and Sunday.",
        goodToKnow: [
          "One personal item is free.",
          "Additional luggage is $5 each according to the current VIPA listing.",
          "The extra 2:15 PM departure operates Saturday and Sunday only.",
        ],
      };

    case "cruz-bay-crown-bay":
      return {
        ...governed,
        departures: ["11:00 AM", "4:15 PM"],
        weekdayDepartures: ["11:00 AM", "4:15 PM"],
        weekendDepartures: undefined,
        saturdayDepartures: ["11:00 AM", "1:15 PM", "4:15 PM"],
        sundayDepartures: ["11:00 AM", "1:15 PM", "4:15 PM"],
        operatingDays: "Daily; 1:15 PM also operates Saturday and Sunday",
        sourceLabel: "Virgin Islands Port Authority / Inter Island Boat Services",
        sourceUrl: VIPA,
        sourceAuthority: "Virgin Islands Port Authority",
        operatorPhones: ["(340) 201-6311", "(340) 776-6597"],
        scheduleNotice:
          "Current VIPA listing: 11:00 AM and 4:15 PM daily, plus 1:15 PM on Saturday and Sunday.",
        goodToKnow: [
          "One personal item is free.",
          "Additional luggage is $5 each according to the current VIPA listing.",
          "The extra 1:15 PM departure operates Saturday and Sunday only.",
        ],
      };

    case "crown-bay-phillips-landing":
    case "phillips-landing-crown-bay":
      return {
        ...governed,
        sourceLabel: "Water Island Ferry",
        sourceUrl: WATER_ISLAND,
        sourceAuthority: "Water Island Ferry",
        scheduleNotice:
          "Current Water Island Ferry schedule: weekday service begins at 7:00/7:15 AM, Saturday at 8:00/8:15 AM, and Sunday/public-holiday service at 9:00/9:15 AM, continuing hourly through the evening schedule shown here.",
      };

    case "red-hook-road-town":
      return governBviRoute({
        ...route,
        departures: ["5:45 PM"],
        operatingDays: "Daily; stops at West End, Tortola",
        serviceDays: [0, 1, 2, 3, 4, 5, 6],
        operatorName: "Road Town Fast Ferry",
      });

    case "road-town-red-hook":
      return governBviRoute({
        ...route,
        departures: ["6:45 AM"],
        operatingDays: "Daily; stops at West End, Tortola",
        serviceDays: [0, 1, 2, 3, 4, 5, 6],
        operatorName: "Road Town Fast Ferry",
      });

    case "red-hook-west-end":
      return governBviRoute({
        ...route,
        departures: ["8:30 AM", "1:45 PM", "5:45 PM"],
        operatingDays: "Daily",
        serviceDays: [0, 1, 2, 3, 4, 5, 6],
        operatorName: "Road Town Fast Ferry",
      });

    case "west-end-red-hook":
      return governBviRoute({
        ...route,
        departures: ["7:15 AM", "10:00 AM", "4:00 PM"],
        operatingDays: "Daily",
        serviceDays: [0, 1, 2, 3, 4, 5, 6],
        operatorName: "Road Town Fast Ferry",
      });

    default:
      if (
        route.sourceUrl === BVI_TOURISM ||
        route.requiresPassport ||
        route.serviceLabel.includes("BVI domestic")
      ) {
        return governBviRoute(route);
      }
      return governed;
  }
}

function governBviRoute(route: BaseFerryRoute): FerryRoute {
  return {
    ...route,
    scheduleStatus: "verify-current",
    verifiedAt: VERIFIED_AT,
    sourceLabel: "British Virgin Islands Tourist Board",
    sourceUrl: BVI_TOURISM,
    sourceAuthority: "British Virgin Islands Tourist Board",
    scheduleNotice:
      "The BVI Tourist Board currently publishes this planning schedule and warns that schedules are subject to change. Confirm the operating ferry company before leaving for the terminal.",
    goodToKnow: uniqueStrings([
      ...(route.requiresPassport
        ? [
            "A valid passport is required for USVI–BVI travel.",
            "Allow extra time for immigration and customs; taxes and port fees may be collected separately.",
          ]
        : [
            "This is domestic BVI travel; confirm the operating provider and current sailing before departure.",
          ]),
      ...(route.goodToKnow ?? []),
    ]),
  };
}

function withCurrentCarBargeGovernance(route: BaseFerryRoute): FerryRoute {
  return {
    ...route,
    departures: [],
    weekdayDepartures: undefined,
    weekendDepartures: undefined,
    saturdayDepartures: undefined,
    sundayDepartures: undefined,
    scheduleStatus: "operator-dependent",
    verifiedAt: VERIFIED_AT,
    sourceLabel: "Virgin Islands Port Authority",
    sourceUrl: VIPA,
    sourceAuthority: "Virgin Islands Port Authority",
    bookingUrl: undefined,
    operatorName: "Big Red Barge / Global Marine / Love City Car Ferries",
    operatingDays:
      "Daily; three private operators publish separate sailing schedules — verify VIPA/operator",
    scheduleNotice:
      "VIPA lists three private St. Thomas–St. John car-ferry companies. Tickets are not interchangeable, and loading is first-come/first-loaded regardless of an online reservation. USVI Explorer therefore does not calculate a single next barge from the combined operator timetable.",
    terminalNote: `${route.terminalNote ?? ""} Verify the selected operator's sailing before entering the loading queue.`.trim(),
    goodToKnow: [
      "Tickets from one car-ferry company cannot be used on another operator.",
      "Online purchase does not guarantee a spot on a specific barge; vehicles are loaded first-come/first-loaded.",
      "Current VIPA listings show $50 one-way and $65 round-trip examples for a car, SUV, or small truck; verify the selected operator and vehicle class.",
      "VIPA ramp or port-use fees may be separate from the vessel operator fare.",
    ],
  };
}

export const FERRY_ROUTES: FerryRoute[] = BASE_FERRY_ROUTES.map(
  withCurrentPassengerGovernance,
);

export const CAR_BARGE_ROUTES: FerryRoute[] = BASE_CAR_BARGE_ROUTES.map(
  withCurrentCarBargeGovernance,
);

function dateRangeContains(
  startsOn: string,
  endsOn: string,
  now: Date,
): boolean {
  const start = Date.parse(`${startsOn}T00:00:00-04:00`);
  const end = Date.parse(`${endsOn}T23:59:59-04:00`);
  const timestamp = now.getTime();
  return timestamp >= start && timestamp <= end;
}

export function isScheduleSuppressed(route: FerryRoute, now = new Date()) {
  if (route.scheduleStatus === "operator-dependent") return true;
  if (
    route.scheduleStatus !== "temporary-override" ||
    !route.temporarySchedule
  ) {
    return false;
  }
  return dateRangeContains(
    route.temporarySchedule.startsOn,
    route.temporarySchedule.endsOn,
    now,
  );
}

export function getDeparturesForWeekday(route: FerryRoute, weekday: number) {
  return getBaseDeparturesForWeekday(route, weekday);
}

export function getNextFerryDeparture(
  route: FerryRoute,
  now = new Date(),
): NextFerryDeparture | null {
  if (isScheduleSuppressed(route, now)) return null;
  return getBaseNextFerryDeparture(route, now);
}

export function ferryRoutesFrom(
  from: FerryPortId,
  mode: FerryMode = "passenger",
) {
  const routes = mode === "car-barge" ? CAR_BARGE_ROUTES : FERRY_ROUTES;
  return routes.filter((route) => route.from === from);
}

export function findFerryRoute(
  from: FerryPortId,
  to: FerryPortId,
  mode: FerryMode = "passenger",
) {
  const routes = mode === "car-barge" ? CAR_BARGE_ROUTES : FERRY_ROUTES;
  return routes.find((route) => route.from === from && route.to === to) ?? null;
}
