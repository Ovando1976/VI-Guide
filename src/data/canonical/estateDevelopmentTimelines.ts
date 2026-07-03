export type EstateDevelopmentTimelineItem = {
  id: string;
  estateSlug: string;
  year: number | string;
  yearLabel: string;
  sortOrder?: number;
  title: string;
  category:
    | "historic"
    | "transfer"
    | "housing"
    | "education"
    | "commerce"
    | "infrastructure"
    | "recreation"
    | "environment"
    | "research-needed";
  description: string;
  sourceRefs: string[];
  confidence: "high" | "medium" | "low" | "needs-research";
};

export const estateDevelopmentTimelines = [
  {
    id: "bovoni-sixto-1902",
    sortOrder: 1902,
    estateSlug: "bovoni",
    year: 1902,
    yearLabel: "c. 1902",
    title: "Late Danish-period estate landscape",
    category: "historic",
    description:
      "Bovoni appears as a quiet coastal estate landscape of lagoon features, small islets, mangroves, open land, sea crabs, pelicans, and stock-estate country near the end of Danish rule.",
    sourceRefs: [
      "Adolph Sixto, Time and I; or, Looking Forward, San Juan News, c. 1902, Bovoni passage around PDF page 104.",
      "generated/sources/sixto-time-and-i-1902.txt",
      "reports/estate-history/sixto-review-packet-001.md"
    ],
    confidence: "medium"
  },
  {
    id: "bovoni-transfer-1917",
    sortOrder: 1917,
    estateSlug: "bovoni",
    year: 1917,
    yearLabel: "1917",
    title: "Transfer to the United States",
    category: "transfer",
    description:
      "The Danish West Indies became the U.S. Virgin Islands. For Bovoni, this marks the dividing line between the late Danish-period estate landscape and the later American-period development of the area.",
    sourceRefs: [
      "General Virgin Islands transfer chronology; add primary treaty/source citation."
    ],
    confidence: "high"
  },
  {
    id: "bovoni-housing-1971",
    sortOrder: 1971,
    estateSlug: "bovoni",
    year: 1971,
    yearLabel: "c. 1971",
    title: "Public housing era",
    category: "housing",
    description:
      "Bovoni became anchored by public housing and a larger residential community. The exact construction date should be verified against VIHA records, but public references point to an early 1970s build period for Bovoni Homes.",
    sourceRefs: [
      "Virgin Islands Housing Authority records for Estate Bovoni Apartments / Bovoni Homes.",
      "public property listings referencing Bovoni Homes year built around 1971."
    ],
    confidence: "medium"
  },
  {
    id: "bovoni-landfill-era",
    sortOrder: 1985,
    estateSlug: "bovoni",
    year: "1980s–1990s",
    yearLabel: "1980s–1990s",
    title: "Landfill and dump use becomes a major land use",
    category: "environment",
    description:
      "Part of Bovoni’s lagoon and coastal landscape became associated with landfill and dump use. This is one of the clearest modern contrasts with the older lagoon, islet, mangrove, and wildlife landscape.",
    sourceRefs: [
      "CDC/ATSDR Bovoni Dump public health consultation.",
      "VIWMA and EPA public records on Bovoni Landfill."
    ],
    confidence: "medium"
  },
  {
    id: "bovoni-commercial-corridor",
    sortOrder: 2000,
    estateSlug: "bovoni",
    year: "2000s–2020s",
    yearLabel: "2000s–2020s",
    title: "Commercial corridor expands",
    category: "commerce",
    description:
      "Modern Bovoni includes gas stations, shopping areas, food retail, commercial business complexes, and service activity. Exact opening dates for the gas stations, supermarket, and shopping center still need permit, business-license, newspaper, or property-record confirmation.",
    sourceRefs: [
      "Research needed: DPNR permits.",
      "Research needed: Lieutenant Governor business and corporate records.",
      "Research needed: property records, newspaper archives, and owner/operator confirmation."
    ],
    confidence: "needs-research"
  },
  {
    id: "bovoni-racetrack-redevelopment",
    sortOrder: 2025,
    estateSlug: "bovoni",
    year: "2025–2026",
    yearLabel: "2025–2026",
    title: "Clinton E. Phipps Racetrack redevelopment",
    category: "recreation",
    description:
      "The Clinton E. Phipps Racetrack became part of Bovoni’s modern recreational and cultural identity, with redevelopment and reopening activity in the mid-2020s.",
    sourceRefs: [
      "Virgin Islands News Online coverage of Clinton E. Phipps Racetrack redevelopment.",
      "Southland Gaming / racetrack public event information."
    ],
    confidence: "high"
  },
  {
    id: "bovoni-school-modernization",
    sortOrder: 2026,
    estateSlug: "bovoni",
    year: 2026,
    yearLabel: "2026",
    title: "Bertha C. Boschulte school modernization",
    category: "education",
    description:
      "The Bertha C. Boschulte school modernization project reinforces Bovoni’s role as a residential, educational, and civic community.",
    sourceRefs: [
      "St. Thomas Source coverage of Bertha C. Boschulte PreK-8 School modernization.",
      "Government House and Department of Education modernization announcements."
    ],
    confidence: "high"
  }
] satisfies EstateDevelopmentTimelineItem[];

export function getEstateDevelopmentTimeline(estateSlug?: string | null) {
  if (!estateSlug) return [];

  return estateDevelopmentTimelines
    .filter((item) => item.estateSlug === estateSlug)
    .sort((a, b) => {
      const ay = a.sortOrder ?? (typeof a.year === "number" ? a.year : 9999);
      const by = b.sortOrder ?? (typeof b.year === "number" ? b.year : 9999);
      return ay - by;
    });
}
