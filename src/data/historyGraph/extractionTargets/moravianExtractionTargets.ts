export type MoravianExtractionStatus =
  | "open"
  | "in_progress"
  | "extracted"
  | "blocked"
  | "verified";

export type MoravianExtractionTarget = {
  id: string;
  estateCanonicalId: string;
  estateName: string;
  island: "st_thomas" | "st_john" | "st_croix";
  priority: 1 | 2 | 3 | 4 | 5;
  status: MoravianExtractionStatus;
  item: string;
  archive: "Moravian Archives";
  series: string;
  goal: string;
  expectedFields: string[];
  notes?: string;
};

export const moravianExtractionTargets: MoravianExtractionTarget[] = [
  {
    id: "moravian-krum-bay-wi-101-22",
    estateCanonicalId: "stt_krum_bay",
    estateName: "Krum Bay",
    island: "st_thomas",
    priority: 1,
    status: "verified",
    archive: "Moravian Archives",
    item: "W.I.101.22",
    series: "St. Thomas estate papers",
    goal: "Extract Moravian evidence for Krum Bay ownership, mission activity, boundaries, and historical references.",
    expectedFields: ["estate name", "owner", "year", "mission reference", "boundary notes", "neighboring estates", "source item"],
  },
  {
    id: "moravian-new-herrnhut-wi-102-7-8",
    estateCanonicalId: "stt_new_herrnhut",
    estateName: "New Herrnhut",
    island: "st_thomas",
    priority: 1,
    status: "verified",
    archive: "Moravian Archives",
    item: "W.I.102.7-8",
    series: "Boundary papers and surveys",
    goal: "Extract boundary and survey evidence for New Herrnhut and connect it to the estate graph.",
    expectedFields: ["estate name", "survey date", "acreage", "boundary notes", "neighboring estates", "map reference"],
  },
  {
    id: "moravian-nisky-wi-102-15-17-18-21-23",
    estateCanonicalId: "stt_nisky",
    estateName: "Nisky",
    island: "st_thomas",
    priority: 2,
    status: "verified",
    archive: "Moravian Archives",
    item: "W.I.102.15/17/18/21/23",
    series: "Nisky estate and boundary papers",
    goal: "Extract Nisky ownership, boundary, and parcel evidence from Moravian archive items.",
    expectedFields: ["estate name", "owner", "year", "parcel", "acreage", "boundary notes", "source item"],
  },
  {
    id: "moravian-savan-wi-101-10",
    estateCanonicalId: "stt_savan",
    estateName: "Savan",
    island: "st_thomas",
    priority: 2,
    status: "verified",
    archive: "Moravian Archives",
    item: "W.I.101.10",
    series: "St. Thomas Savan papers",
    goal: "Extract Savan historical references, ownership, and Moravian institutional context.",
    expectedFields: ["place name", "owner or institution", "year", "mission reference", "location note", "source item"],
  },
];
