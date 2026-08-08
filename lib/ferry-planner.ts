export type FerryPortId = "red-hook" | "cruz-bay" | "charlotte-amalie" | "gallows-bay";

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
  fareNote: string;
  checkInMinutes: number;
  sourceLabel: string;
  sourceUrl: string;
  seasonal?: boolean;
};

export const FERRY_PORTS = [
  { id: "red-hook" as const, label: "Red Hook", island: "St. Thomas" },
  { id: "charlotte-amalie" as const, label: "Charlotte Amalie", island: "St. Thomas" },
  { id: "cruz-bay" as const, label: "Cruz Bay", island: "St. John" },
  { id: "gallows-bay" as const, label: "Gallows Bay / Christiansted", island: "St. Croix" },
];

const DPW = "https://dpw.vi.gov/ferries/";
const VIPA = "https://www.viport.com/schedules-ferrycargoschedules";

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
    fareNote: "DPW lists resident and non-resident passenger fares; verify before travel.",
    checkInMinutes: 15,
    sourceLabel: "Virgin Islands Department of Public Works",
    sourceUrl: DPW,
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
    fareNote: "DPW lists resident and non-resident passenger fares; verify before travel.",
    checkInMinutes: 15,
    sourceLabel: "Virgin Islands Department of Public Works",
    sourceUrl: DPW,
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
    fareNote: "$60 one way listed by VIPA; verify current fare before travel.",
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
    fareNote: "$60 one way listed by VIPA; verify current fare before travel.",
    checkInMinutes: 30,
    sourceLabel: "Virgin Islands Port Authority",
    sourceUrl: VIPA,
  },
];

export function ferryRoutesFrom(from: FerryPortId) {
  return FERRY_ROUTES.filter((route) => route.from === from);
}

export function findFerryRoute(from: FerryPortId, to: FerryPortId) {
  return FERRY_ROUTES.find((route) => route.from === from && route.to === to) ?? null;
}
