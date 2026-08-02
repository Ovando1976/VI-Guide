export type TimelineEra =
  | "indigenous"
  | "colonial"
  | "emancipation"
  | "transfer"
  | "modern";

export type TimelineIsland = "territory" | "stt" | "stj" | "stx";

export type TerritoryTimelineEvent = {
  id: string;
  year: number;
  endYear?: number;
  dateLabel: string;
  title: string;
  summary: string;
  era: TimelineEra;
  island: TimelineIsland;
  tags: string[];
  mapHref?: string;
  placeHref?: string;
};

export const TIMELINE_ERAS = [
  { id: "all", label: "All eras" },
  { id: "indigenous", label: "Indigenous worlds" },
  { id: "colonial", label: "Colonial rule" },
  { id: "emancipation", label: "Freedom & labor" },
  { id: "transfer", label: "Transfer & U.S. rule" },
  { id: "modern", label: "Modern territory" },
] as const;

export const TERRITORY_TIMELINE_EVENTS: TerritoryTimelineEvent[] = [
  {
    id: "indigenous-settlement",
    year: 500,
    endYear: 1492,
    dateLabel: "Before 1492",
    title: "Indigenous island societies flourish",
    summary:
      "Generations of Indigenous Caribbean peoples built communities, trade networks, farms, fisheries, and ceremonial landscapes across the islands long before European colonization.",
    era: "indigenous",
    island: "territory",
    tags: ["Indigenous history", "archaeology", "Caribbean networks"],
  },
  {
    id: "columbus-second-voyage",
    year: 1493,
    dateLabel: "1493",
    title: "European naming enters the written record",
    summary:
      "Christopher Columbus's second voyage brought the islands into European imperial records and began centuries of competing colonial claims.",
    era: "colonial",
    island: "territory",
    tags: ["European contact", "colonial claims"],
  },
  {
    id: "danish-st-thomas",
    year: 1672,
    dateLabel: "1672",
    title: "Danish colonization begins on St. Thomas",
    summary:
      "The Danish West India and Guinea Company established a lasting settlement on St. Thomas, centered on Charlotte Amalie and an expanding plantation economy.",
    era: "colonial",
    island: "stt",
    tags: ["Danish West Indies", "St. Thomas", "Charlotte Amalie"],
    mapHref: "/map?island=stt&filter=history",
  },
  {
    id: "danish-st-john",
    year: 1718,
    dateLabel: "1718",
    title: "Danish settlement expands to St. John",
    summary:
      "Danish control extended to St. John, where plantation estates transformed the island's land, labor, and settlement patterns.",
    era: "colonial",
    island: "stj",
    tags: ["Danish West Indies", "St. John", "plantation era"],
    mapHref: "/map?island=stj&filter=history",
  },
  {
    id: "st-john-rebellion",
    year: 1733,
    dateLabel: "1733–1734",
    title: "Enslaved people lead the St. John rebellion",
    summary:
      "A major uprising challenged plantation rule on St. John and remains one of the most important acts of resistance in Virgin Islands history.",
    era: "colonial",
    island: "stj",
    tags: ["resistance", "St. John rebellion", "slavery"],
    mapHref: "/map?island=stj&filter=history",
  },
  {
    id: "purchase-st-croix",
    year: 1733,
    dateLabel: "1733",
    title: "Denmark purchases St. Croix",
    summary:
      "St. Croix became part of the Danish West Indies and developed into the territory's largest sugar-producing island.",
    era: "colonial",
    island: "stx",
    tags: ["St. Croix", "Danish West Indies", "sugar"],
    mapHref: "/map?island=stx&filter=history",
  },
  {
    id: "crown-rule",
    year: 1755,
    dateLabel: "1755",
    title: "The Danish Crown assumes direct rule",
    summary:
      "Administration passed from the chartered company to the Danish Crown, reshaping government across the Danish West Indies.",
    era: "colonial",
    island: "territory",
    tags: ["government", "Danish Crown", "colonial administration"],
  },
  {
    id: "free-port",
    year: 1764,
    dateLabel: "1764",
    title: "Charlotte Amalie becomes a free port",
    summary:
      "Free-port status strengthened Charlotte Amalie's role as a major Caribbean trading center and drew merchants from across the Atlantic world.",
    era: "colonial",
    island: "stt",
    tags: ["Charlotte Amalie", "trade", "free port"],
    mapHref: "/map?island=stt&filter=history",
  },
  {
    id: "british-occupation-one",
    year: 1801,
    endYear: 1802,
    dateLabel: "1801–1802",
    title: "First British occupation",
    summary:
      "Britain occupied the Danish West Indies during the Napoleonic era before returning the islands to Denmark.",
    era: "colonial",
    island: "territory",
    tags: ["British occupation", "Napoleonic era"],
  },
  {
    id: "british-occupation-two",
    year: 1807,
    endYear: 1815,
    dateLabel: "1807–1815",
    title: "Second British occupation",
    summary:
      "A longer British occupation placed the islands under wartime administration until the end of the Napoleonic conflicts.",
    era: "colonial",
    island: "territory",
    tags: ["British occupation", "Napoleonic era"],
  },
  {
    id: "emancipation-1848",
    year: 1848,
    dateLabel: "July 3, 1848",
    title: "Emancipation is declared on St. Croix",
    summary:
      "Following mass action by enslaved people in Frederiksted, Governor-General Peter von Scholten proclaimed emancipation throughout the Danish West Indies.",
    era: "emancipation",
    island: "stx",
    tags: ["Emancipation", "Freedom", "Frederiksted", "Peter von Scholten"],
    mapHref: "/map?island=stx&filter=history",
  },
  {
    id: "fireburn",
    year: 1878,
    dateLabel: "1878",
    title: "Fireburn labor revolt reshapes St. Croix",
    summary:
      "Workers led a major uprising against oppressive post-emancipation labor conditions, with Queen Mary, Queen Agnes, Queen Mathilda, and Queen Susanna becoming enduring symbols of resistance.",
    era: "emancipation",
    island: "stx",
    tags: ["Fireburn", "labor", "Queens of Fireburn", "resistance"],
    mapHref: "/map?island=stx&filter=history",
  },
  {
    id: "transfer-day",
    year: 1917,
    dateLabel: "March 31, 1917",
    title: "Transfer Day establishes the U.S. Virgin Islands",
    summary:
      "The United States formally took possession of the former Danish West Indies, beginning the U.S. naval administration period.",
    era: "transfer",
    island: "territory",
    tags: ["Transfer Day", "United States", "naval administration"],
  },
  {
    id: "citizenship-1927",
    year: 1927,
    dateLabel: "1927",
    title: "U.S. citizenship is extended to Virgin Islanders",
    summary:
      "Federal legislation granted United States citizenship to most residents of the Virgin Islands.",
    era: "transfer",
    island: "territory",
    tags: ["citizenship", "federal law"],
  },
  {
    id: "civilian-rule-1931",
    year: 1931,
    dateLabel: "1931",
    title: "Civilian administration replaces naval rule",
    summary:
      "Responsibility for governing the islands moved from the U.S. Navy to the Department of the Interior.",
    era: "transfer",
    island: "territory",
    tags: ["civilian government", "Department of the Interior"],
  },
  {
    id: "organic-act-1936",
    year: 1936,
    dateLabel: "1936",
    title: "The first Organic Act reorganizes territorial government",
    summary:
      "The Organic Act of 1936 expanded local governmental institutions and created a new framework for territorial administration.",
    era: "modern",
    island: "territory",
    tags: ["Organic Act", "self-government", "legislature"],
  },
  {
    id: "revised-organic-act",
    year: 1954,
    dateLabel: "1954",
    title: "The Revised Organic Act becomes the territory's governing framework",
    summary:
      "The Revised Organic Act reorganized the executive, legislative, and judicial structure of the Virgin Islands government.",
    era: "modern",
    island: "territory",
    tags: ["Revised Organic Act", "government", "constitution"],
  },
  {
    id: "elected-governor-law",
    year: 1968,
    dateLabel: "1968",
    title: "Federal law authorizes an elected governor",
    summary:
      "Congress authorized Virgin Islanders to elect their own governor and lieutenant governor rather than receive presidential appointments.",
    era: "modern",
    island: "territory",
    tags: ["elected governor", "democracy", "federal law"],
  },
  {
    id: "first-elected-governor",
    year: 1970,
    dateLabel: "1970–1971",
    title: "Virgin Islanders elect their first governor",
    summary:
      "Melvin H. Evans won the first popular gubernatorial election and took office in January 1971.",
    era: "modern",
    island: "territory",
    tags: ["Melvin H. Evans", "election", "self-government"],
  },
  {
    id: "hurricane-hugo",
    year: 1989,
    dateLabel: "1989",
    title: "Hurricane Hugo devastates St. Croix",
    summary:
      "Hurricane Hugo caused catastrophic destruction, especially on St. Croix, and reshaped housing, infrastructure, and disaster planning.",
    era: "modern",
    island: "stx",
    tags: ["Hurricane Hugo", "disaster", "recovery"],
    mapHref: "/map?island=stx",
  },
  {
    id: "hurricane-marilyn",
    year: 1995,
    dateLabel: "1995",
    title: "Hurricane Marilyn strikes the territory",
    summary:
      "Hurricane Marilyn caused widespread damage, particularly on St. Thomas, and renewed debates over resilience and rebuilding.",
    era: "modern",
    island: "territory",
    tags: ["Hurricane Marilyn", "disaster", "recovery"],
  },
  {
    id: "centennial-transfer",
    year: 2017,
    dateLabel: "2017",
    title: "The territory marks the centennial of Transfer Day",
    summary:
      "Public programs and historical reflection marked one hundred years since the 1917 transfer from Denmark to the United States.",
    era: "modern",
    island: "territory",
    tags: ["Transfer Day centennial", "public history"],
  },
  {
    id: "irma-maria",
    year: 2017,
    dateLabel: "September 2017",
    title: "Hurricanes Irma and Maria transform the islands",
    summary:
      "Two Category 5 hurricanes struck within weeks, causing territory-wide destruction and launching a long rebuilding and resilience effort.",
    era: "modern",
    island: "territory",
    tags: ["Hurricane Irma", "Hurricane Maria", "recovery", "resilience"],
  },
];
