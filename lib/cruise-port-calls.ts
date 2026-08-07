import type { IntelligenceIsland } from "@/types/intelligence";

export type OfficialCruisePortId =
  | "havensight"
  | "crown_bay"
  | "cruz_bay"
  | "frederiksted";

export type OfficialCruisePortCallStatus = "scheduled" | "cancelled";

export type OfficialCruiseScheduleSource = {
  id: string;
  name: string;
  url: string;
  official: true;
  publishedRevision: string;
};

export type OfficialCruisePortCall = {
  id: string;
  date: string;
  island: IntelligenceIsland;
  portId: OfficialCruisePortId;
  terminalLabel: string;
  shipName: string;
  arrivesAt: string;
  departsAt: string;
  status: OfficialCruisePortCallStatus;
  sourceId: string;
  berthCode?: string;
};

export const OFFICIAL_CRUISE_SCHEDULE_TIMEZONE = "America/St_Thomas";
export const OFFICIAL_CRUISE_SCHEDULE_COVERAGE = {
  from: "2026-08-04",
  through: "2026-09-30",
  assembledAt: "2026-08-06T22:30:00-04:00",
} as const;

export const OFFICIAL_CRUISE_SCHEDULE_SOURCES: OfficialCruiseScheduleSource[] = [
  {
    id: "vipa_crown_bay_fy2026",
    name: "Virgin Islands Port Authority · Crown Bay / St. John FY2026",
    url: "https://www.viport.com/_files/ugd/e0a2e7_393ee3413a6a415f9e6d7dcd65d35ab0.pdf",
    official: true,
    publishedRevision: "updated 21 Jul 2026",
  },
  {
    id: "vipa_frederiksted_fy2026",
    name: "Virgin Islands Port Authority · Frederiksted FY2026",
    url: "https://www.viport.com/_files/ugd/e0a2e7_de74a26de775451590120b2211180fc2.pdf",
    official: true,
    publishedRevision: "updated 29 Jun 2026",
  },
  {
    id: "wico_aug_2026",
    name: "The West Indian Company Limited · August 2026",
    url: "https://wico-ltd.com/wp-content/uploads/2026/07/August-2026-Ship-Schedule.pdf",
    official: true,
    publishedRevision: "Original",
  },
  {
    id: "wico_fy2026_rev12",
    name: "The West Indian Company Limited · FY2026",
    url: "https://wico-ltd.com/wp-content/uploads/2026/07/FY-2026-SHIP-SCHEDULE-REV-12.pdf",
    official: true,
    publishedRevision: "Revision 12",
  },
];

const PORTS: Record<
  OfficialCruisePortId,
  { island: IntelligenceIsland; terminalLabel: string }
> = {
  havensight: {
    island: "stt",
    terminalLabel: "Havensight · WICO Dock",
  },
  crown_bay: {
    island: "stt",
    terminalLabel: "Crown Bay · Austin “Babe” Monsanto Marine Terminal",
  },
  cruz_bay: {
    island: "stj",
    terminalLabel: "Cruz Bay Harbor · Tender",
  },
  frederiksted: {
    island: "stx",
    terminalLabel: "Frederiksted · Ann E. Abramson Marine Facility",
  },
};

type PortCallRow = readonly [
  date: string,
  island: IntelligenceIsland,
  portId: OfficialCruisePortId,
  shipName: string,
  arrivesAt: string,
  departsAt: string,
  status: OfficialCruisePortCallStatus,
  sourceId: string,
  berthCode: string,
];

const PORT_CALL_ROWS: PortCallRow[] = [
  ["2026-08-04","stt","havensight","Norwegian Luna","11:00","19:00","scheduled","wico_aug_2026","WICO"],
  ["2026-08-05","stt","havensight","Disney Treasure","06:30","16:00","scheduled","wico_aug_2026","WICO"],
  ["2026-08-05","stt","crown_bay","Icon of the Seas","07:00","14:30","scheduled","vipa_crown_bay_fy2026","AMSS"],
  ["2026-08-05","stt","havensight","Carnival Celebration","09:00","18:00","scheduled","wico_aug_2026","WICO"],
  ["2026-08-05","stt","crown_bay","Celebrity Beyond","12:30","19:00","cancelled","vipa_crown_bay_fy2026","AMNS"],
  ["2026-08-06","stx","frederiksted","Rhapsody of the Seas","08:00","18:00","scheduled","vipa_frederiksted_fy2026","FSTED"],
  ["2026-08-09","stt","crown_bay","Rhapsody of the Seas","08:00","18:00","scheduled","vipa_crown_bay_fy2026","AMSS"],
  ["2026-08-10","stx","frederiksted","Rhapsody of the Seas","08:00","18:00","scheduled","vipa_frederiksted_fy2026","FSTED"],
  ["2026-08-11","stt","havensight","Norwegian Luna","11:00","19:00","scheduled","wico_aug_2026","WICO"],
  ["2026-08-12","stt","crown_bay","Icon of the Seas","07:00","14:30","scheduled","vipa_crown_bay_fy2026","AMSS"],
  ["2026-08-12","stt","havensight","Norwegian Prima","13:30","20:00","scheduled","wico_aug_2026","WICO"],
  ["2026-08-13","stt","havensight","Carnival Magic","07:00","16:00","scheduled","wico_aug_2026","WICO"],
  ["2026-08-18","stt","havensight","Norwegian Luna","11:00","19:00","scheduled","wico_aug_2026","WICO"],
  ["2026-08-19","stt","havensight","Disney Treasure","06:30","16:00","scheduled","wico_aug_2026","WICO"],
  ["2026-08-19","stt","havensight","Regal Princess","07:00","17:00","scheduled","wico_aug_2026","WICO"],
  ["2026-08-19","stt","crown_bay","Star of the Seas","12:30","20:00","scheduled","vipa_crown_bay_fy2026","AMSS"],
  ["2026-08-20","stx","frederiksted","Rhapsody of the Seas","08:00","18:00","scheduled","vipa_frederiksted_fy2026","FSTED"],
  ["2026-08-23","stt","crown_bay","Rhapsody of the Seas","08:00","18:00","scheduled","vipa_crown_bay_fy2026","AMSS"],
  ["2026-08-24","stx","frederiksted","Rhapsody of the Seas","08:00","18:00","scheduled","vipa_frederiksted_fy2026","FSTED"],
  ["2026-08-24","stt","havensight","Carnival Conquest","08:00","17:00","scheduled","wico_aug_2026","WICO"],
  ["2026-08-24","stt","havensight","Norwegian Escape","08:00","16:00","scheduled","wico_aug_2026","WICO"],
  ["2026-08-25","stt","crown_bay","Harmony of the Seas","07:00","14:30","scheduled","vipa_crown_bay_fy2026","AMSS"],
  ["2026-08-25","stx","frederiksted","Carnival Conquest","08:00","18:00","scheduled","vipa_frederiksted_fy2026","FSTED"],
  ["2026-08-25","stt","havensight","Adventure of the Seas","08:00","18:00","scheduled","wico_aug_2026","WICO"],
  ["2026-08-25","stt","havensight","Carnival Vista","09:00","18:00","scheduled","wico_aug_2026","WICO"],
  ["2026-08-25","stt","havensight","Norwegian Luna","11:00","19:00","scheduled","wico_aug_2026","WICO"],
  ["2026-08-26","stt","crown_bay","Icon of the Seas","07:00","14:30","scheduled","vipa_crown_bay_fy2026","AMSS"],
  ["2026-08-26","stx","frederiksted","Adventure of the Seas","07:00","16:00","scheduled","vipa_frederiksted_fy2026","FSTED"],
  ["2026-08-26","stt","havensight","Norwegian Prima","13:30","20:00","scheduled","wico_aug_2026","WICO"],
  ["2026-09-01","stt","crown_bay","Icon of the Seas","08:00","18:00","scheduled","vipa_crown_bay_fy2026","AMSS"],
  ["2026-09-01","stt","havensight","Norwegian Luna","11:00","19:00","scheduled","wico_fy2026_rev12","WICO"],
  ["2026-09-02","stt","havensight","Disney Treasure","06:30","16:00","scheduled","wico_fy2026_rev12","WICO"],
  ["2026-09-02","stt","havensight","Regal Princess","07:00","17:00","scheduled","wico_fy2026_rev12","WICO"],
  ["2026-09-03","stx","frederiksted","Rhapsody of the Seas","08:00","18:00","scheduled","vipa_frederiksted_fy2026","FSTED"],
  ["2026-09-06","stt","crown_bay","Rhapsody of the Seas","08:00","18:00","scheduled","vipa_crown_bay_fy2026","AMSS"],
  ["2026-09-07","stx","frederiksted","Rhapsody of the Seas","08:00","18:00","scheduled","vipa_frederiksted_fy2026","FSTED"],
  ["2026-09-08","stt","havensight","Norwegian Luna","11:00","19:00","scheduled","wico_fy2026_rev12","WICO"],
  ["2026-09-09","stt","crown_bay","Star of the Seas","12:30","20:00","scheduled","vipa_crown_bay_fy2026","AMSS"],
  ["2026-09-09","stt","havensight","Norwegian Prima","13:30","20:00","scheduled","wico_fy2026_rev12","WICO"],
  ["2026-09-10","stt","havensight","Carnival Magic","07:00","16:00","scheduled","wico_fy2026_rev12","WICO"],
  ["2026-09-15","stt","havensight","Norwegian Luna","11:00","19:00","scheduled","wico_fy2026_rev12","WICO"],
  ["2026-09-16","stt","havensight","Disney Treasure","06:30","16:00","scheduled","wico_fy2026_rev12","WICO"],
  ["2026-09-16","stt","crown_bay","Icon of the Seas","07:00","14:30","scheduled","vipa_crown_bay_fy2026","AMSS"],
  ["2026-09-16","stt","havensight","Carnival Celebration","07:00","16:00","scheduled","wico_fy2026_rev12","WICO"],
  ["2026-09-17","stx","frederiksted","Rhapsody of the Seas","08:00","18:00","scheduled","vipa_frederiksted_fy2026","FSTED"],
  ["2026-09-20","stt","crown_bay","Rhapsody of the Seas","08:00","18:00","scheduled","vipa_crown_bay_fy2026","AMSS"],
  ["2026-09-21","stx","frederiksted","Adventure of the Seas","08:00","18:00","scheduled","vipa_frederiksted_fy2026","FSTED"],
  ["2026-09-21","stx","frederiksted","Rhapsody of the Seas","08:00","18:00","cancelled","vipa_frederiksted_fy2026","FSTED"],
  ["2026-09-22","stt","crown_bay","Harmony of the Seas","07:00","14:30","scheduled","vipa_crown_bay_fy2026","AMSS"],
  ["2026-09-22","stt","havensight","Adventure of the Seas","08:00","18:00","scheduled","wico_fy2026_rev12","WICO"],
  ["2026-09-22","stt","havensight","Carnival Vista","09:00","18:00","scheduled","wico_fy2026_rev12","WICO"],
  ["2026-09-22","stt","havensight","Norwegian Luna","11:00","19:00","scheduled","wico_fy2026_rev12","WICO"],
  ["2026-09-23","stt","crown_bay","Icon of the Seas","07:00","14:30","scheduled","vipa_crown_bay_fy2026","AMSS"],
  ["2026-09-23","stt","havensight","Norwegian Prima","13:30","20:00","scheduled","wico_fy2026_rev12","WICO"],
  ["2026-09-29","stt","havensight","Norwegian Luna","11:00","19:00","scheduled","wico_fy2026_rev12","WICO"],
  ["2026-09-30","stt","havensight","Disney Treasure","06:30","16:00","scheduled","wico_fy2026_rev12","WICO"],
  ["2026-09-30","stt","havensight","Carnival Celebration","09:00","18:00","scheduled","wico_fy2026_rev12","WICO"],
  ["2026-09-30","stt","crown_bay","Star of the Seas","12:30","20:00","scheduled","vipa_crown_bay_fy2026","AMSS"],
];

export const OFFICIAL_USVI_CRUISE_PORT_CALLS: OfficialCruisePortCall[] =
  PORT_CALL_ROWS.map(
    ([
      date,
      island,
      portId,
      shipName,
      arrivesAt,
      departsAt,
      status,
      sourceId,
      berthCode,
    ]) => ({
      id: `${date}_${portId}_${slug(shipName)}`,
      date,
      island,
      portId,
      terminalLabel: PORTS[portId].terminalLabel,
      shipName,
      arrivesAt,
      departsAt,
      status,
      sourceId,
      ...(berthCode ? { berthCode } : {}),
    }),
  );

export function listOfficialCruisePortCalls(input: {
  from?: string;
  through?: string;
  island?: IntelligenceIsland;
  portId?: OfficialCruisePortId;
  shipName?: string;
  includeCancelled?: boolean;
} = {}) {
  const shipNeedle = input.shipName?.trim().toLowerCase();
  return OFFICIAL_USVI_CRUISE_PORT_CALLS.filter((call) => {
    if (!input.includeCancelled && call.status !== "scheduled") return false;
    if (input.from && call.date < input.from) return false;
    if (input.through && call.date > input.through) return false;
    if (input.island && call.island !== input.island) return false;
    if (input.portId && call.portId !== input.portId) return false;
    if (shipNeedle && !call.shipName.toLowerCase().includes(shipNeedle)) return false;
    return true;
  });
}

export function getOfficialCruisePortCall(id: string) {
  const normalized = id.trim().slice(0, 220);
  return OFFICIAL_USVI_CRUISE_PORT_CALLS.find((call) => call.id === normalized) ?? null;
}

export function sourceForOfficialCruisePortCall(call: OfficialCruisePortCall) {
  return (
    OFFICIAL_CRUISE_SCHEDULE_SOURCES.find((source) => source.id === call.sourceId) ??
    null
  );
}

export function derivePlanningAllAboard(
  departsAt: string,
  minutesBeforeDeparture = 30,
) {
  const departure = minutesFromTime(departsAt);
  if (departure === null) return null;
  return timeFromMinutes(Math.max(0, departure - minutesBeforeDeparture));
}

export function officialCruisePortIsland(portId: OfficialCruisePortId) {
  return PORTS[portId].island;
}

function minutesFromTime(value: string) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function timeFromMinutes(value: number) {
  const minutes = Math.max(0, Math.min(23 * 60 + 59, Math.round(value)));
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(
    minutes % 60,
  ).padStart(2, "0")}`;
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}
