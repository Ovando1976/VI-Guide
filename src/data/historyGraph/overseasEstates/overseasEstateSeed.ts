import type { HistoricalEstateNode } from "./overseasEstateTypes";

export const overseasEstateSeed: HistoricalEstateNode[] = [
  {
    canonicalId: "estate:annas-retreat",
    canonicalName: "Anna's Retreat",
    island: "st_thomas",
    quarterOrJurisdiction: "East End / New Quarter",
    modernEstateMatch: "Anna's Retreat / Tutu",
    aliasNames: [
      { name: "Tutu", aliasType: "historical_name", confidence: 0.9, sourceRefs: ["source:rigsarkivet:matrikler"] },
      { name: "Tabor", aliasType: "merged_complex", confidence: 0.85, sourceRefs: ["source:rigsarkivet:matrikler"] },
      { name: "Harmonie", aliasType: "merged_complex", confidence: 0.85, sourceRefs: ["source:rigsarkivet:matrikler"] },
    ],
    geometryCandidates: [],
    provenanceSummary: [],
  },
  {
    canonicalId: "estate:zufriedenheit",
    canonicalName: "Zufriedenheit / Magens Bay",
    island: "st_thomas",
    modernEstateMatch: "Magens Bay / Louisenhoj successor landscape",
    aliasNames: [
      { name: "Magens Bay", aliasType: "modern_gazetteer", confidence: 0.8, sourceRefs: ["source:usvi:recorder-gis"] },
      { name: "Louisenhoj", aliasType: "subdivision", confidence: 0.7, sourceRefs: ["source:usvi:recorder-gis"] },
    ],
    geometryCandidates: [],
    provenanceSummary: [],
  },
];
