import type { IslandCode } from "../../types";

export type TimelineEvent = {
  year: string;
  title: string;
  description: string;
};

export type EstateNarrative = {
  summary: string;
  significance: string;
  modernContext: string;
  timeline: TimelineEvent[];
};

type EstateInput = {
  estate?: string;
  name?: string;
  island?: IslandCode | string;
  quarter?: string;
  description?: string;
};

export function buildEstateNarrative(estate: EstateInput): EstateNarrative {
  const name = estate.estate || estate.name || "This estate";
  const island = formatIsland(estate.island);
  const quarter = estate.quarter || "its historic quarter";

  return {
    summary: `${name} is one of the historic estate areas of ${island}, located within ${quarter}. Estate names like this help explain older roads, neighborhoods, place names, and movement patterns across the Virgin Islands.`,

    significance: `${name} matters because it connects modern geography with the plantation-era landscape, Danish West Indies records, local memory, and present-day navigation.`,

    modernContext: `Today, ${name} can serve as a geographic anchor for visitors, residents, researchers, and planners exploring nearby communities, beaches, historic sites, routes, and archive records.`,

    timeline: [
      {
        year: "1700s",
        title: "Danish colonial estate period",
        description:
          "The estate landscape developed during the Danish West Indies period, when land was organized around plantations, quarters, roads, and coastal access.",
      },
      {
        year: "1848",
        title: "Emancipation",
        description:
          "The end of slavery transformed labor, land use, and community life across the Virgin Islands.",
      },
      {
        year: "1917",
        title: "Transfer to the United States",
        description:
          "The Virgin Islands transferred from Denmark to the United States, changing the political and administrative context of estate lands.",
      },
      {
        year: "1900s",
        title: "Modern community growth",
        description:
          "Many former estate areas became residential neighborhoods, commercial districts, roads, schools, and civic landmarks.",
      },
      {
        year: "Today",
        title: "Living geographic reference",
        description:
          "The estate name remains useful for navigation, cultural memory, tourism, property research, and local storytelling.",
      },
    ],
  };
}

function formatIsland(island?: IslandCode | string): string {
  if (!island) return "the Virgin Islands";

  const value = island.toUpperCase();

  if (value === "STT") return "St. Thomas";
  if (value === "STJ") return "St. John";
  if (value === "STX") return "St. Croix";

  return island;
}