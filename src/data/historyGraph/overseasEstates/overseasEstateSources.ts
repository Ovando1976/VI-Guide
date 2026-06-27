import type { ArchivalProvenance } from "./overseasEstateTypes";

export const overseasEstateSourceFamilies: ArchivalProvenance[] = [
  {
    sourceRef: "source:rigsarkivet:plantager-vestindien",
    sourceFamily: "state_assets",
    repository: "Rigsarkivet",
    collection: "Plantager (Vestindien)",
    notes: "High-signal plantation intervention and administration files.",
  },
  {
    sourceRef: "source:rigsarkivet:debt-liquidation",
    sourceFamily: "debt_liquidation",
    repository: "Rigsarkivet",
    collection: "West India Debt Liquidation Directorate and commissions",
    notes: "Debt, appraisal, foreclosure, and liquidation evidence.",
  },
  {
    sourceRef: "source:rigsarkivet:matrikler",
    sourceFamily: "matrikel",
    repository: "Rigsarkivet",
    collection: "Land lists and matrikels",
    notes: "Canonical owner, quarter, estate-name, and tax backbone.",
  },
  {
    sourceRef: "source:nara:rg55",
    sourceFamily: "nara_rg55",
    repository: "NARA",
    collection: "Record Group 55",
    notes: "U.S.-side continuity, tax, labor, and government plantation evidence.",
  },
  {
    sourceRef: "source:usvi:recorder-gis",
    sourceFamily: "recorder_of_deeds",
    repository: "USVI Lieutenant Governor / Recorder of Deeds / GIS",
    notes: "Final modern title and GIS validation layer.",
  },
];
