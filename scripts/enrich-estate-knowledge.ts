// scripts/enrich-estate-knowledge.ts
import fs from "fs";
import path from "path";

import { estateKnowledge } from "../src/data/estateKnowledge";
import type {
  EstateKnowledge,
  EstateKnowledgeIndex,
} from "../src/types/estateKnowledge";
import { normalizeEstateName } from "../src/lib/estate-normalize";

type EstateOverride = Partial<EstateKnowledge> & {
  matchNames: string[];
};

const now = new Date().toISOString();

const overrides: EstateOverride[] = [
  {
    matchNames: ["Anna's Retreat", "Annas Retreat"],
    description:
      "Anna's Retreat is a major estate area in eastern St. Thomas closely connected with the modern Tutu commercial and residential district.",
    historicSummary:
      "This estate should be treated as a high-priority research target because it connects Danish-era estate geography, modern Tutu, nearby Smith Bay, and eastern St. Thomas transportation routes.",
    relatedPlaces: ["Tutu", "Smith Bay", "Coki Point", "Red Hook"],
    relatedHistoricSites: ["Fort Mylner"],
    relatedArchives: [
      "Geographic Dictionary of the Virgin Islands",
      "Danish West Indies archive records",
      "Library of Congress Virgin Islands collections",
    ],
    tags: ["east-end", "tutu", "residential", "commercial", "archive-target"],
  },
  {
    matchNames: ["Tutu"],
    description:
      "Tutu is one of the most important modern place-name and estate references in eastern St. Thomas.",
    historicSummary:
      "Tutu functions as a bridge between older estate geography and the island's modern commercial, residential, and transportation network.",
    relatedPlaces: ["Anna's Retreat", "Smith Bay", "Red Hook"],
    relatedHistoricSites: ["Fort Mylner"],
    relatedArchives: [
      "Geographic Dictionary of the Virgin Islands",
      "Danish West Indies archive records",
    ],
    tags: ["east-end", "mobility", "commercial", "residential"],
  },
  {
    matchNames: ["Smith Bay"],
    description:
      "Smith Bay is an East End estate and coastal area associated with beaches, visitor destinations, and the Red Hook corridor.",
    historicSummary:
      "Smith Bay should remain one canonical estate record while beach, park, resort, and address references are attached as related places.",
    relatedPlaces: ["Coki Point", "Lindquist Beach", "Sapphire Beach", "Red Hook"],
    relatedHistoricSites: [],
    relatedArchives: [
      "Geographic Dictionary of the Virgin Islands",
      "historic maps",
      "land records",
    ],
    tags: ["east-end", "beach", "tourism", "coastal"],
  },
  {
    matchNames: ["Red Hook"],
    description:
      "Red Hook is a major East End mobility and marine hub on St. Thomas.",
    historicSummary:
      "Red Hook connects estate geography with ferry traffic, marina activity, beach access, and the broader East End visitor corridor.",
    relatedPlaces: [
      "Red Hook Ferry Terminal",
      "American Yacht Harbor",
      "Nazareth",
      "Smith Bay",
    ],
    relatedHistoricSites: [],
    relatedArchives: ["historic maps", "land records", "port records"],
    tags: ["east-end", "ferry", "marina", "mobility", "tourism"],
  },
  {
    matchNames: ["Magens Bay"],
    description:
      "Magens Bay is both a historic estate reference and one of the most recognizable coastal landscapes on St. Thomas.",
    historicSummary:
      "Magens Bay is a high-value record because it links estate geography, beach tourism, protected coastal landscape, and Northside estate relationships.",
    relatedPlaces: ["Magens Bay Beach", "Peterborg", "Northside"],
    relatedHistoricSites: [],
    relatedArchives: [
      "historic maps",
      "photographs",
      "Geographic Dictionary of the Virgin Islands",
    ],
    tags: ["northside", "beach", "tourism", "coastal"],
  },
  {
    matchNames: ["Peterborg"],
    description:
      "Peterborg is a Northside peninsula estate closely associated with Magens Bay and scenic coastal geography.",
    historicSummary:
      "Peterborg is useful for connecting Northside estate geography with Magens Bay, residential development, and coastal viewpoints.",
    relatedPlaces: ["Magens Bay", "Northside"],
    relatedHistoricSites: [],
    relatedArchives: ["historic maps", "land records", "photographs"],
    tags: ["northside", "peninsula", "coastal", "residential"],
  },
  {
    matchNames: ["Charlotte Amalie"],
    description:
      "Charlotte Amalie is the historic urban core of St. Thomas and one of the richest archive targets in the U.S. Virgin Islands.",
    historicSummary:
      "Charlotte Amalie connects Danish colonial administration, harbor commerce, historic districts, forts, churches, streets, and modern cruise tourism.",
    relatedPlaces: [
      "Fort Christian",
      "Charlotte Amalie Waterfront",
      "Main Street",
      "Havensight",
      "Crown Bay",
    ],
    relatedHistoricSites: [
      "Fort Christian",
      "Charlotte Amalie Historic District",
      "St. Thomas Synagogue",
      "Blackbeard's Castle",
    ],
    relatedArchives: [
      "DPNR SHPO historic district records",
      "Library of Congress",
      "Danish West Indies archive records",
      "National Register records",
    ],
    tags: ["town", "historic-district", "harbor", "archive-hub"],
  },
  {
    matchNames: ["Havensight"],
    description:
      "Havensight is a south-coast estate and visitor gateway closely tied to the Charlotte Amalie harbor and cruise activity.",
    historicSummary:
      "Havensight is important for connecting modern cruise tourism, harbor geography, and nearby historic Charlotte Amalie.",
    relatedPlaces: ["WICO Dock", "Havensight Mall", "Yacht Haven Grande"],
    relatedHistoricSites: ["Fort Christian", "Charlotte Amalie Historic District"],
    relatedArchives: ["historic maps", "photographs", "port records"],
    tags: ["cruise", "harbor", "tourism", "southside"],
  },
  {
    matchNames: ["Crown Bay"],
    description:
      "Crown Bay is a western harbor estate and major cruise, cargo, marina, and airport-adjacent mobility zone.",
    historicSummary:
      "Crown Bay helps connect estate geography with maritime infrastructure, airport access, and modern visitor movement.",
    relatedPlaces: ["Crown Bay Marina", "Crown Bay Cruise Port", "Airport"],
    relatedHistoricSites: [],
    relatedArchives: ["historic maps", "land records", "port records"],
    tags: ["cruise", "harbor", "airport", "mobility"],
  },
  {
    matchNames: ["Annaberg"],
    description:
      "Annaberg is one of the most important historic estate sites on St. John and is closely associated with plantation-era ruins and Virgin Islands National Park interpretation.",
    historicSummary:
      "Annaberg is a priority estate for archive and public-history work because its built remains, plantation context, and national park interpretation make it one of the strongest heritage records in the estate system.",
    relatedPlaces: ["Maho Bay", "Leinster Bay", "Waterlemon Cay"],
    relatedHistoricSites: ["Annaberg Sugar Plantation"],
    relatedArchives: [
      "National Park Service",
      "Library of Congress",
      "Danish West Indies archive records",
      "historic maps",
    ],
    tags: ["st-john", "plantation", "ruins", "national-park", "heritage"],
  },
];

function applyOverrides(record: EstateKnowledge): EstateKnowledge {
  const recordName = normalizeEstateName(record.estateName);
  const recordAliases = record.aliases.map(normalizeEstateName);

  const match = overrides.find((override) =>
    override.matchNames.some((name) => {
      const normalized = normalizeEstateName(name);
      return recordName === normalized || recordAliases.includes(normalized);
    })
  );

  if (!match) return record;

  const { matchNames, ...cleanMatch } = match;

  return {
    ...record,
    ...cleanMatch,

    estateId: record.estateId,
    geoid: record.geoid,
    estateName: record.estateName,
    normalizedName: record.normalizedName,

    aliases: Array.from(
      new Set([...(record.aliases ?? []), ...(cleanMatch.aliases ?? [])])
    ),

    relatedPlaces: Array.from(
      new Set([...(record.relatedPlaces ?? []), ...(cleanMatch.relatedPlaces ?? [])])
    ),

    relatedHistoricSites: Array.from(
      new Set([
        ...(record.relatedHistoricSites ?? []),
        ...(cleanMatch.relatedHistoricSites ?? []),
      ])
    ),

    relatedArchives: Array.from(
      new Set([...(record.relatedArchives ?? []), ...(cleanMatch.relatedArchives ?? [])])
    ),

    tags: Array.from(
      new Set([...(record.tags ?? []), ...(cleanMatch.tags ?? [])])
    ),

    searchText: [
      record.searchText,
      cleanMatch.description ?? "",
      cleanMatch.historicSummary ?? "",
      ...(cleanMatch.relatedPlaces ?? []),
      ...(cleanMatch.relatedHistoricSites ?? []),
      ...(cleanMatch.relatedArchives ?? []),
      ...(cleanMatch.tags ?? []),
    ]
      .join(" ")
      .toLowerCase(),
  };
}

const enrichedRecords = estateKnowledge.records.map(applyOverrides);

const outputIndex: EstateKnowledgeIndex = {
  generatedAt: now,
  totalEstates: enrichedRecords.length,
  records: enrichedRecords,
};

const output = `import type { EstateKnowledgeIndex } from "../types/estateKnowledge";

export const estateKnowledge: EstateKnowledgeIndex = ${JSON.stringify(
  outputIndex,
  null,
  2
)};
`;

const outputPath = path.resolve("src/data/estateKnowledge.ts");
fs.writeFileSync(outputPath, output);

console.log("Enriched estate knowledge:", enrichedRecords.length, "records");
console.log("Applied curated overrides:", overrides.length);