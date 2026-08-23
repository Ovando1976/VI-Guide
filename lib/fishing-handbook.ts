export type FishingStatus = "restricted" | "protected" | "catch-and-release";
export type FishingWater = "territorial" | "federal" | "both";

export type FishingOfficialSource = {
  id: string;
  label: string;
  authority: "USVI DPNR" | "NOAA Fisheries";
  url: string;
  scope: string;
  verifiedAt: string;
};

export type FishingSpecies = {
  id: string;
  commonName: string;
  scientificName: string;
  group: string;
  status: FishingStatus;
  waters: FishingWater;
  summary: string;
  habitat: string;
  regulationNote: string;
  handling: string;
  searchTerms: string[];
  sourceIds: string[];
  verifiedAt: string;
};

export type FishingRuleArea = {
  id: string;
  name: string;
  island: "stt" | "stj" | "stx";
  waters: FishingWater;
  restriction: string;
  sourceIds: string[];
  verifiedAt: string;
};

export const FISHING_DISCLAIMER =
  "Fishing rules can change. Always confirm current USVI territorial and federal regulations, seasonal closures, size limits, bag limits, gear restrictions, and protected-area rules before fishing or keeping a catch.";

export const FISHING_OFFICIAL_SOURCES: FishingOfficialSource[] = [
  {
    id: "dpnr-handbook-2024",
    label: "2024 USVI Commercial Fisher's Information Handbook",
    authority: "USVI DPNR",
    url: "https://dpnr.vi.gov/wp-content/uploads/2024/07/Fisher-Handbook-2024_website.pdf",
    scope:
      "Territorial and adjacent federal fishing rules, seasonal closures, protected species, and marine protected areas. DPNR states that current official regulations take precedence if rules change.",
    verifiedAt: "2026-08-23",
  },
  {
    id: "dpnr-marine-protected-areas",
    label: "USVI Marine Protected Areas",
    authority: "USVI DPNR",
    url: "https://dpnr.vi.gov/coastal-zone-management/what-we-do/marine-protected-areas/",
    scope:
      "Territorial marine protected areas and zone-specific fishing or extraction restrictions.",
    verifiedAt: "2026-08-23",
  },
  {
    id: "noaa-caribbean-current",
    label: "Current Fishing Regulations - U.S. Caribbean",
    authority: "NOAA Fisheries",
    url: "https://www.fisheries.noaa.gov/southeast/rules-and-regulations/current-fishing-regulations-us-caribbean",
    scope:
      "Current federal U.S. Caribbean fishing regulation hub; NOAA notes that official federal rules are in 50 CFR 622 and regulations may change.",
    verifiedAt: "2026-08-23",
  },
  {
    id: "noaa-seasonal-closures",
    label: "Seasonal and Area Fishing Closures - U.S. Caribbean",
    authority: "NOAA Fisheries",
    url: "https://www.fisheries.noaa.gov/southeast/rules-and-regulations/seasonal-and-area-fishing-closures-us-caribbean",
    scope:
      "Federal seasonal and area closures affecting U.S. Caribbean fisheries, including protected spawning areas.",
    verifiedAt: "2026-08-23",
  },
  {
    id: "noaa-queen-conch-2026",
    label: "2026 Queen Conch Seasonal Prohibition",
    authority: "NOAA Fisheries",
    url: "https://www.fisheries.noaa.gov/bulletin/seasonal-prohibition-fishing-or-possession-queen-conch-federal-waters-east-st-croix-us-3",
    scope:
      "2026 queen conch seasonal and area closure around St. Croix, including the June 1 through October 31 USVI jurisdictional possession closure.",
    verifiedAt: "2026-08-23",
  },
  {
    id: "noaa-dolphinfish-wahoo-2025",
    label: "Final Rule: Dolphinfish and Wahoo Management Measures",
    authority: "NOAA Fisheries",
    url: "https://www.fisheries.noaa.gov/bulletin/final-rule-establishes-management-measures-dolphinfish-and-wahoo",
    scope:
      "Federal minimum size and recreational bag limits for dolphinfish and wahoo around St. Croix and St. Thomas/St. John, effective July 25, 2025.",
    verifiedAt: "2026-08-23",
  },
];

const VERIFIED_AT = "2026-08-23";

export const FISHING_SPECIES: FishingSpecies[] = [
  {
    id: "yellowtail-snapper",
    commonName: "Yellowtail Snapper",
    scientificName: "Ocyurus chrysurus",
    group: "Snapper",
    status: "restricted",
    waters: "both",
    summary:
      "A familiar reef snapper recognized by its bright yellow tail and yellow lateral stripe.",
    habitat: "Coral reefs, reef edges, ledges, and clear coastal waters.",
    regulationNote:
      "Federal waters apply a minimum-size rule. Confirm current size, bag, territorial, and federal rules before keeping fish.",
    handling:
      "Use wet hands, minimize air exposure, and release undersized or unwanted fish promptly.",
    searchTerms: ["yellowtail", "snapper", "reef fish"],
    sourceIds: ["dpnr-handbook-2024", "noaa-caribbean-current"],
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "mutton-snapper",
    commonName: "Mutton Snapper",
    scientificName: "Lutjanus analis",
    group: "Snapper",
    status: "restricted",
    waters: "both",
    summary:
      "A powerful snapper with a reddish body, blue facial lines, and a dark shoulder spot.",
    habitat: "Reefs, rocky areas, channels, seagrass beds, and deeper coastal waters.",
    regulationNote:
      "Recurring seasonal closures apply, including April through June harvest restrictions and a St. Croix federal spawning-area closure. Confirm current boundaries and dates before fishing.",
    handling: "Use appropriate tackle to shorten fight time and reduce release stress.",
    searchTerms: ["mutton", "snapper", "reef", "spawning closure"],
    sourceIds: ["dpnr-handbook-2024", "noaa-seasonal-closures"],
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "lane-snapper",
    commonName: "Lane Snapper",
    scientificName: "Lutjanus synagris",
    group: "Snapper",
    status: "restricted",
    waters: "both",
    summary:
      "A pink-red snapper with yellow stripes that commonly uses reefs, seagrass edges, and sandy bottoms.",
    habitat: "Reefs, patch reefs, seagrass edges, and mixed sand-and-reef habitat.",
    regulationNote:
      "A recurring April through June seasonal harvest closure applies. Verify current territorial and federal rules before retention.",
    handling: "Release unwanted fish promptly and avoid prolonged air exposure.",
    searchTerms: ["lane", "snapper", "reef", "seasonal closure"],
    sourceIds: ["dpnr-handbook-2024", "noaa-seasonal-closures"],
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "black-snapper",
    commonName: "Black Snapper",
    scientificName: "Apsilus dentatus",
    group: "Snapper",
    status: "restricted",
    waters: "both",
    summary: "A deeper-water Caribbean snapper managed with seasonal protections.",
    habitat: "Deeper reefs, slopes, rocky structure, and offshore habitat.",
    regulationNote:
      "A recurring October through December closure applies in federal waters and in St. Thomas/St. John territorial waters; St. Croix territorial rules differ. Verify the water and current rule before fishing.",
    handling: "Use descending tools when appropriate for fish showing barotrauma.",
    searchTerms: ["black snapper", "deep snapper", "closure"],
    sourceIds: ["dpnr-handbook-2024", "noaa-seasonal-closures"],
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "blackfin-snapper",
    commonName: "Blackfin Snapper",
    scientificName: "Lutjanus buccanella",
    group: "Snapper",
    status: "restricted",
    waters: "both",
    summary: "A deep-reef snapper marked by a dark spot near the base of the pectoral fin.",
    habitat: "Deep reefs, rocky slopes, ledges, and offshore structure.",
    regulationNote:
      "A recurring October through December closure applies in federal waters and in St. Thomas/St. John territorial waters; St. Croix territorial rules differ.",
    handling: "Minimize fight time and use barotrauma-release tools when needed.",
    searchTerms: ["blackfin", "snapper", "deep reef", "closure"],
    sourceIds: ["dpnr-handbook-2024", "noaa-seasonal-closures"],
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "silk-snapper",
    commonName: "Silk Snapper",
    scientificName: "Lutjanus vivanus",
    group: "Snapper",
    status: "restricted",
    waters: "both",
    summary: "A deep-water snapper with a reddish-pink body and yellow eye.",
    habitat: "Deep reefs, ledges, slopes, and offshore rocky habitat.",
    regulationNote:
      "A recurring October through December closure applies in federal waters and in St. Thomas/St. John territorial waters; verify current rules before harvest.",
    handling: "Use proper release techniques for deep-caught fish showing barotrauma.",
    searchTerms: ["silk", "snapper", "deep water", "closure"],
    sourceIds: ["dpnr-handbook-2024", "noaa-seasonal-closures"],
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "vermilion-snapper",
    commonName: "Vermilion Snapper",
    scientificName: "Rhomboplites aurorubens",
    group: "Snapper",
    status: "restricted",
    waters: "both",
    summary: "A schooling red snapper of deeper reefs and hard-bottom habitat.",
    habitat: "Deep reefs, hard bottom, rocky ledges, and offshore structure.",
    regulationNote:
      "A recurring October through December closure applies in federal waters and in St. Thomas/St. John territorial waters; confirm the current rule before retention.",
    handling: "Release promptly and mitigate barotrauma on deep-caught fish.",
    searchTerms: ["vermilion", "snapper", "deep reef", "closure"],
    sourceIds: ["dpnr-handbook-2024", "noaa-seasonal-closures"],
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "red-hind",
    commonName: "Red Hind",
    scientificName: "Epinephelus guttatus",
    group: "Grouper",
    status: "restricted",
    waters: "both",
    summary: "A small grouper with reddish-brown spots and diagonal bars across the body.",
    habitat: "Coral reefs, rocky bottoms, ledges, and reef slopes.",
    regulationNote:
      "Seasonal spawning closures and protected-area restrictions apply in parts of the USVI, including federal closure areas. Confirm current dates and boundaries.",
    handling:
      "Use descending tools when appropriate for fish showing barotrauma from deeper water.",
    searchTerms: ["red hind", "grouper", "reef", "spawning closure"],
    sourceIds: ["dpnr-handbook-2024", "noaa-seasonal-closures"],
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "goliath-grouper",
    commonName: "Goliath Grouper",
    scientificName: "Epinephelus itajara",
    group: "Grouper",
    status: "protected",
    waters: "both",
    summary:
      "A very large reef grouper protected from harvest in USVI territorial and adjacent federal waters.",
    habitat: "Reefs, wrecks, ledges, mangrove-associated habitat, and large structure.",
    regulationNote:
      "Harvest and possession are prohibited under the USVI and federal Caribbean rules summarized by DPNR. Confirm current official regulations before every trip.",
    handling: "Do not target for harvest; minimize handling and release immediately if caught.",
    searchTerms: ["goliath", "grouper", "jewfish", "protected"],
    sourceIds: ["dpnr-handbook-2024", "noaa-caribbean-current"],
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "nassau-grouper",
    commonName: "Nassau Grouper",
    scientificName: "Epinephelus striatus",
    group: "Grouper",
    status: "protected",
    waters: "both",
    summary: "A large, banded Caribbean grouper that requires special conservation attention.",
    habitat: "Coral reefs, caves, ledges, and reef-associated habitats.",
    regulationNote:
      "Harvest and possession are prohibited in USVI territorial and adjacent federal waters under the rules summarized by DPNR. Verify current official regulations.",
    handling: "Avoid targeting protected fish; release immediately with minimal handling.",
    searchTerms: ["nassau", "grouper", "protected", "reef fish"],
    sourceIds: ["dpnr-handbook-2024", "noaa-caribbean-current"],
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "blue-parrotfish",
    commonName: "Blue Parrotfish",
    scientificName: "Scarus coeruleus",
    group: "Parrotfish",
    status: "protected",
    waters: "federal",
    summary: "A large blue parrotfish important to Caribbean reef grazing and ecosystem health.",
    habitat: "Coral reefs, reef flats, and hard-bottom habitat.",
    regulationNote:
      "Harvest and possession are prohibited in U.S. Caribbean federal waters. Territorial rules can differ, so verify the water before fishing.",
    handling: "Avoid targeting protected federal species and release immediately if encountered.",
    searchTerms: ["blue parrotfish", "parrotfish", "protected", "reef"],
    sourceIds: ["dpnr-handbook-2024", "noaa-caribbean-current"],
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "midnight-parrotfish",
    commonName: "Midnight Parrotfish",
    scientificName: "Scarus coelestinus",
    group: "Parrotfish",
    status: "protected",
    waters: "federal",
    summary: "A large dark-blue parrotfish associated with healthy Caribbean reef systems.",
    habitat: "Coral reefs, reef slopes, and hard-bottom habitat.",
    regulationNote:
      "Harvest and possession are prohibited in U.S. Caribbean federal waters. Confirm territorial rules separately.",
    handling: "Avoid targeting protected federal species and release immediately if caught.",
    searchTerms: ["midnight parrotfish", "parrotfish", "protected", "reef"],
    sourceIds: ["dpnr-handbook-2024", "noaa-caribbean-current"],
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "rainbow-parrotfish",
    commonName: "Rainbow Parrotfish",
    scientificName: "Scarus guacamaia",
    group: "Parrotfish",
    status: "protected",
    waters: "federal",
    summary: "A large, colorful parrotfish associated with reefs and mangrove-connected habitat.",
    habitat: "Coral reefs, reef flats, and mangrove-connected coastal habitat.",
    regulationNote:
      "Harvest and possession are prohibited in U.S. Caribbean federal waters. Confirm territorial rules separately.",
    handling: "Avoid targeting protected federal species and release immediately if caught.",
    searchTerms: ["rainbow parrotfish", "parrotfish", "protected", "mangrove"],
    sourceIds: ["dpnr-handbook-2024", "noaa-caribbean-current"],
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "queen-conch",
    commonName: "Queen Conch",
    scientificName: "Aliger gigas",
    group: "Shellfish",
    status: "restricted",
    waters: "both",
    summary:
      "An iconic Caribbean marine snail important to Virgin Islands culture and fisheries.",
    habitat: "Seagrass beds, sandy bottoms, and shallow coastal waters.",
    regulationNote:
      "The 2026 USVI possession closure runs June 1 through October 31. Federal harvest is only allowed seasonally in the permitted area east of 64°34′ W off St. Croix; other federal USVI waters are closed year-round. Re-check current rules before harvest.",
    handling: "Leave undersized animals undisturbed and avoid damaging seagrass habitat.",
    searchTerms: ["conch", "queen conch", "shellfish", "seagrass"],
    sourceIds: ["dpnr-handbook-2024", "noaa-queen-conch-2026"],
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "caribbean-spiny-lobster",
    commonName: "Caribbean Spiny Lobster",
    scientificName: "Panulirus argus",
    group: "Shellfish",
    status: "restricted",
    waters: "both",
    summary:
      "A reef-dwelling lobster without large claws, identified by long antennae and a spiny shell.",
    habitat: "Reefs, rocky crevices, ledges, and seagrass-adjacent habitat.",
    regulationNote:
      "Verify the current season, minimum size, possession, gear, protected-area, and egg-bearing restrictions before harvest.",
    handling:
      "Never retain egg-bearing females and minimize habitat disturbance while checking crevices.",
    searchTerms: ["lobster", "spiny lobster", "reef", "diving"],
    sourceIds: ["dpnr-handbook-2024", "noaa-caribbean-current"],
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "great-barracuda",
    commonName: "Great Barracuda",
    scientificName: "Sphyraena barracuda",
    group: "Pelagic and reef predator",
    status: "restricted",
    waters: "both",
    summary:
      "A long, silver predator commonly seen around reefs, channels, and coastal structure.",
    habitat: "Reef edges, channels, mangroves, docks, and open coastal water.",
    regulationNote:
      "Confirm current rules and local consumption advisories; large reef predators may carry ciguatera risk.",
    handling: "Use pliers and keep hands clear of the teeth; release efficiently when not retained.",
    searchTerms: ["barracuda", "cuda", "predator", "ciguatera"],
    sourceIds: ["dpnr-handbook-2024"],
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "tarpon",
    commonName: "Tarpon",
    scientificName: "Megalops atlanticus",
    group: "Gamefish",
    status: "catch-and-release",
    waters: "territorial",
    summary:
      "A powerful inshore gamefish common around bays, channels, mangroves, and harbor edges.",
    habitat: "Bays, channels, mangrove shorelines, lagoons, and nearshore structure.",
    regulationNote:
      "USVI territorial rules summarized by DPNR prohibit harvest; hook-and-line catch-and-release fishing is allowed. Confirm current protected-area rules for the location.",
    handling:
      "Keep the fish in the water when possible, support the body, minimize handling, and release promptly.",
    searchTerms: ["tarpon", "silver king", "gamefish", "catch release"],
    sourceIds: ["dpnr-handbook-2024", "dpnr-marine-protected-areas"],
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "bonefish",
    commonName: "Bonefish",
    scientificName: "Albula vulpes",
    group: "Gamefish",
    status: "catch-and-release",
    waters: "territorial",
    summary:
      "A fast flats gamefish associated with shallow sand, seagrass, and mangrove-edge habitat.",
    habitat: "Shallow flats, sand, seagrass beds, mangrove edges, and coastal lagoons.",
    regulationNote:
      "USVI territorial rules summarized by DPNR prohibit harvest; hook-and-line catch-and-release fishing is allowed. Verify protected-area restrictions before fishing.",
    handling:
      "Keep the fish wet, avoid touching gills, minimize air exposure, and revive before release.",
    searchTerms: ["bonefish", "flats", "gamefish", "catch release"],
    sourceIds: ["dpnr-handbook-2024", "dpnr-marine-protected-areas"],
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "dolphinfish",
    commonName: "Dolphinfish (Mahi-mahi)",
    scientificName: "Coryphaena hippurus",
    group: "Offshore pelagic",
    status: "restricted",
    waters: "federal",
    summary:
      "A fast-growing offshore pelagic popular with recreational and commercial fishers.",
    habitat: "Open ocean, current edges, weed lines, floating structure, and offshore waters.",
    regulationNote:
      "Federal U.S. Caribbean rules effective July 25, 2025 set a 24-inch fork-length minimum. Around the USVI, the recreational limit is 10 per person per day, not to exceed 32 per vessel per day, whichever is less. Verify current NOAA rules before fishing.",
    handling: "Use appropriately sized tackle and ice retained fish promptly.",
    searchTerms: ["dolphinfish", "mahi", "mahi-mahi", "dorado", "offshore"],
    sourceIds: ["noaa-dolphinfish-wahoo-2025", "noaa-caribbean-current"],
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "wahoo",
    commonName: "Wahoo",
    scientificName: "Acanthocybium solandri",
    group: "Offshore pelagic",
    status: "restricted",
    waters: "federal",
    summary: "A high-speed offshore predator prized throughout the Caribbean.",
    habitat: "Open ocean, drop-offs, current lines, seamounts, and offshore structure.",
    regulationNote:
      "Federal U.S. Caribbean rules effective July 25, 2025 set a 32-inch fork-length minimum. Around the USVI, the recreational limit is 2 per person per day, not to exceed 10 per vessel per day, whichever is less. Verify current NOAA rules before fishing.",
    handling: "Use wire-safe handling practices, control the fish on deck, and ice retained fish promptly.",
    searchTerms: ["wahoo", "ono", "offshore", "pelagic"],
    sourceIds: ["noaa-dolphinfish-wahoo-2025", "noaa-caribbean-current"],
    verifiedAt: VERIFIED_AT,
  },
];

export const FISHING_RULE_AREAS: FishingRuleArea[] = [
  {
    id: "hind-bank-marine-conservation-district",
    name: "Hind Bank Marine Conservation District",
    island: "stt",
    waters: "federal",
    restriction:
      "Year-round federal no-fishing and no-anchoring protections apply. Confirm the current NOAA boundary before approaching the area.",
    sourceIds: ["dpnr-handbook-2024", "noaa-seasonal-closures"],
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "grammanik-bank",
    name: "Grammanik Bank Seasonal Closure",
    island: "stt",
    waters: "federal",
    restriction:
      "A recurring February through April federal seasonal closure protects spawning fish. Confirm current dates and coordinates with NOAA.",
    sourceIds: ["dpnr-handbook-2024", "noaa-seasonal-closures"],
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "stx-mutton-snapper-spawning-area",
    name: "St. Croix Mutton Snapper Spawning Aggregation Area",
    island: "stx",
    waters: "federal",
    restriction:
      "A recurring March through June federal no-fishing closure applies within the designated spawning aggregation area. Confirm the current boundary before fishing nearby.",
    sourceIds: ["dpnr-handbook-2024", "noaa-seasonal-closures"],
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "lang-bank-red-hind",
    name: "Lang Bank Red Hind Closure Area",
    island: "stx",
    waters: "federal",
    restriction:
      "A recurring winter federal closure protects red hind spawning aggregation habitat. Confirm current dates and coordinates with NOAA before fishing the bank.",
    sourceIds: ["dpnr-handbook-2024", "noaa-seasonal-closures"],
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "buck-island-reef-national-monument",
    name: "Buck Island Reef National Monument",
    island: "stx",
    waters: "territorial",
    restriction:
      "Fishing is prohibited within the National Monument under the protected-area rules summarized by DPNR. Confirm current National Park Service boundaries and rules before visiting.",
    sourceIds: ["dpnr-handbook-2024", "dpnr-marine-protected-areas"],
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "virgin-islands-coral-reef-national-monument",
    name: "Virgin Islands Coral Reef National Monument",
    island: "stj",
    waters: "territorial",
    restriction:
      "Fishing is generally prohibited, with narrow permit-based exceptions described by current rules. Verify the National Park Service and DPNR requirements before fishing nearby.",
    sourceIds: ["dpnr-handbook-2024", "dpnr-marine-protected-areas"],
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "virgin-islands-national-park",
    name: "Virgin Islands National Park Waters",
    island: "stj",
    waters: "territorial",
    restriction:
      "Rod, reel, and handline fishing may be allowed in designated waters, while spearfishing and fishing in swim zones, mooring areas, and docks are restricted. Species-specific rules also apply.",
    sourceIds: ["dpnr-handbook-2024", "dpnr-marine-protected-areas"],
    verifiedAt: VERIFIED_AT,
  },
];

export function getFishingSource(id: string) {
  return FISHING_OFFICIAL_SOURCES.find((source) => source.id === id);
}

export function searchFishingSpecies(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return FISHING_SPECIES;

  return FISHING_SPECIES.filter((species) =>
    [
      species.commonName,
      species.scientificName,
      species.group,
      species.summary,
      species.habitat,
      ...species.searchTerms,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalized),
  );
}
