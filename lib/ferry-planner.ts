export type FerryPortId = "red-hook" | "cruz-bay" | "charlotte-amalie" | "gallows-bay";

export type FerryFare = {
  currency: "USD";
  adultOneWay: number;
  adultRoundTrip?: number;
  childOneWay?: number;
  residentOneWay?: number;
  residentSeniorOneWay?: number;
  bagOneWay?: number;
};

export type FerryRoute = {
  id: string;
  from: FerryPortId;
  to: FerryPortId;
  fromLabel: string;
  toLabel: string;
  serviceLabel: string;
  durationMinutes: number;
  departures: string[];
  operatingDays: string;
  serviceDays?: number[];
  fareNote: string;
  fare?: FerryFare;
  checkInMinutes: number;
  sourceLabel: string;
  sourceUrl: string;
  seasonal?: boolean;
};

export type NextFerryDeparture = {
  label: string;
  dayLabel: string;
  minutesUntil: number;
  leaveForTerminalInMinutes: number;
};

export const FERRY_PORTS = [
  { id: "red-hook" as const, label: "Red Hook", island: "St. Thomas" },
  { id: "charlotte-amalie" as const, label: "Charlotte Amalie", island: "St. Thomas" },
  { id: "cruz-bay" as const, label: "Cruz Bay", island: "St. John" },
  { id: "gallows-bay" as const, label: "Gallows Bay / Christiansted", island: "St. Croix" },
];

const VIPA = "https://www.viport.com/schedules-ferrycargoschedules";
const DAILY = [0, 1, 2, 3, 4, 5, 6];
const THURSDAY_TO_MONDAY = [0, 1, 4, 5, 6];

const RED_HOOK_FARE: FerryFare = {
  currency: "USD",
  adultOneWay: 8.15,
  adultRoundTrip: 16.3,
  childOneWay: 1,
  residentOneWay: 6,
  residentSeniorOneWay: 1.5,
  bagOneWay: 4,
};

export const FERRY_ROUTES: FerryRoute[] = [
  {
    id: "red-hook-cruz-bay",
    from: "red-hook",
    to: "cruz-bay",
    fromLabel: "Red Hook, St. Thomas",
    toLabel: "Cruz Bay, St. John",
    serviceLabel: "Passenger ferry",
    durationMinutes: 20,
    departures: ["5:30 AM*", "6:30 AM", "7:30 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM"],
    operatingDays: "Daily; 5:30 AM departure except weekends",
    serviceDays: DAILY,
    fareNote: "VIPA lists $8.15 non-resident adult, $6 resident, $1 child and $4 per bag each way.",
    fare: RED_HOOK_FARE,
    checkInMinutes: 15,
    sourceLabel: "Virgin Islands Port Authority / Department of Public Works",
    sourceUrl: VIPA,
  },
  {
    id: "cruz-bay-red-hook",
    from: "cruz-bay",
    to: "red-hook",
    fromLabel: "Cruz Bay, St. John",
    toLabel: "Red Hook, St. Thomas",
    serviceLabel: "Passenger ferry",
    durationMinutes: 20,
    departures: ["6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM"],
    operatingDays: "Daily",
    serviceDays: DAILY,
    fareNote: "VIPA lists $8.15 non-resident adult, $6 resident, $1 child and $4 per bag each way.",
    fare: RED_HOOK_FARE,
    checkInMinutes: 15,
    sourceLabel: "Virgin Islands Port Authority / Department of Public Works",
    sourceUrl: VIPA,
  },
  {
    id: "charlotte-amalie-cruz-bay",
    from: "charlotte-amalie",
    to: "cruz-bay",
    fromLabel: "Charlotte Amalie, St. Thomas",
    toLabel: "Cruz Bay, St. John",
    serviceLabel: "Passenger ferry",
    durationMinutes: 40,
    departures: ["10:00 AM", "3:00 PM", "5:30 PM"],
    operatingDays: "Service is subject to seasonal change",
    serviceDays: DAILY,
    fareNote: "VIPA publishes current operator schedules and rates; verify before travel.",
    checkInMinutes: 15,
    sourceLabel: "Virgin Islands Port Authority",
    sourceUrl: VIPA,
    seasonal: true,
  },
  {
    id: "cruz-bay-charlotte-amalie",
    from: "cruz-bay",
    to: "charlotte-amalie",
    fromLabel: "Cruz Bay, St. John",
    toLabel: "Charlotte Amalie, St. Thomas",
    serviceLabel: "Passenger ferry",
    durationMinutes: 40,
    departures: ["8:45 AM", "11:15 AM", "3:45 PM"],
    operatingDays: "Service is subject to seasonal change",
    serviceDays: DAILY,
    fareNote: "VIPA publishes current operator schedules and rates; verify before travel.",
    checkInMinutes: 15,
    sourceLabel: "Virgin Islands Port Authority",
    sourceUrl: VIPA,
    seasonal: true,
  },
  {
    id: "charlotte-amalie-gallows-bay",
    from: "charlotte-amalie",
    to: "gallows-bay",
    fromLabel: "Charlotte Amalie, St. Thomas",
    toLabel: "Gallows Bay / Christiansted, St. Croix",
    serviceLabel: "Inter-island passenger ferry",
    durationMinutes: 130,
    departures: ["3:00 PM"],
    operatingDays: "Thursday, Friday, Saturday, Sunday and Monday",
    serviceDays: THURSDAY_TO_MONDAY,
    fareNote: "$60 one way listed by VIPA; verify current fare before travel.",
    fare: { currency: "USD", adultOneWay: 60 },
    checkInMinutes: 30,
    sourceLabel: "Virgin Islands Port Authority",
    sourceUrl: VIPA,
  },
  {
    id: "gallows-bay-charlotte-amalie",
    from: "gallows-bay",
    to: "charlotte-amalie",
    fromLabel: "Gallows Bay / Christiansted, St. Croix",
    toLabel: "Charlotte Amalie, St. Thomas",
    serviceLabel: "Inter-island passenger ferry",
    durationMinutes: 130,
    departures: ["8:00 AM"],
    operatingDays: "Thursday, Friday, Saturday, Sunday and Monday",
    serviceDays: THURSDAY_TO_MONDAY,
    fareNote: "$60 one way listed by VIPA; verify current fare before travel.",
    fare: { currency: "USD", adultOneWay: 60 },
    checkInMinutes: 30,
    sourceLabel: "Virgin Islands Port Authority",
    sourceUrl: VIPA,
  },
];

const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function islandClock(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/St_Thomas",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return { weekday: WEEKDAY_INDEX[value("weekday")], minutes: Number(value("hour")) * 60 + Number(value("minute")) };
}

function departureMinutes(label: string) {
  const match = label.replace("*", "").match(/^(\d{1,2}):(\d{2})\s(AM|PM)$/);
  if (!match) return null;
  let hour = Number(match[1]) % 12;
  if (match[3] === "PM") hour += 12;
  return hour * 60 + Number(match[2]);
}

export function getNextFerryDeparture(route: FerryRoute, now = new Date()): NextFerryDeparture | null {
  const clock = islandClock(now);
  const dayFormatter = new Intl.DateTimeFormat("en-US", { timeZone: "America/St_Thomas", weekday: "short" });

  for (let dayOffset = 0; dayOffset < 8; dayOffset += 1) {
    const weekday = (clock.weekday + dayOffset) % 7;
    if (route.serviceDays && !route.serviceDays.includes(weekday)) continue;

    for (const departure of route.departures) {
      if (departure.endsWith("*") && (weekday === 0 || weekday === 6)) continue;
      const minutes = departureMinutes(departure);
      if (minutes === null) continue;
      const minutesUntil = dayOffset * 1440 + minutes - clock.minutes;
      if (minutesUntil < 0) continue;
      const dayLabel = dayOffset === 0 ? "Today" : dayOffset === 1 ? "Tomorrow" : dayFormatter.format(new Date(now.getTime() + dayOffset * 86400000));
      return {
        label: departure.replace("*", ""),
        dayLabel,
        minutesUntil,
        leaveForTerminalInMinutes: minutesUntil - route.checkInMinutes,
      };
    }
  }

  return null;
}

export function ferryRoutesFrom(from: FerryPortId) {
  return FERRY_ROUTES.filter((route) => route.from === from);
}

export function findFerryRoute(from: FerryPortId, to: FerryPortId) {
  return FERRY_ROUTES.find((route) => route.from === from && route.to === to) ?? null;
}
