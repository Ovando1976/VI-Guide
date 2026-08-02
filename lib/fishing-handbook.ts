export type FishingStatus = "restricted" | "protected";
export type FishingWater = "territorial" | "federal" | "both";

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
};

export const FISHING_DISCLAIMER =
  "Fishing rules can change. Always confirm current USVI territorial and federal regulations, seasonal closures, size limits, bag limits, gear restrictions, and protected-area rules before fishing or keeping a catch.";

export const FISHING_SPECIES: FishingSpecies[] = [
  {
    id: "yellowtail-snapper",
    commonName: "Yellowtail Snapper",
    scientificName: "Ocyurus chrysurus",
    group: "Snapper",
    status: "restricted",
    waters: "both",
    summary: "A familiar reef snapper recognized by its bright yellow tail and yellow lateral stripe.",
    habitat: "Coral reefs, reef edges, ledges, and clear coastal waters.",
    regulationNote: "Verify current minimum size, bag limits, and applicable territorial or federal rules before keeping fish.",
    handling: "Use wet hands, minimize air exposure, and release undersized or unwanted fish promptly.",
    searchTerms: ["yellowtail", "snapper", "reef fish"],
  },
  {
    id: "mutton-snapper",
    commonName: "Mutton Snapper",
    scientificName: "Lutjanus analis",
    group: "Snapper",
    status: "restricted",
    waters: "both",
    summary: "A powerful snapper with a reddish body, blue facial lines, and a dark shoulder spot.",
    habitat: "Reefs, rocky areas, channels, seagrass beds, and deeper coastal waters.",
    regulationNote: "Spawning closures and size or bag limits may apply. Confirm the rules for the water you are fishing.",
    handling: "Use appropriate tackle to shorten fight time and reduce release stress.",
    searchTerms: ["mutton", "snapper", "reef", "channel"],
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
    regulationNote: "Seasonal spawning closures and protected-area restrictions may apply.",
    handling: "Use descending tools when appropriate for fish showing barotrauma from deeper water.",
    searchTerms: ["red hind", "grouper", "reef", "spawning closure"],
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
    regulationNote: "Treat this species as protected and do not retain it unless current official regulations explicitly allow harvest.",
    handling: "Avoid targeting protected fish; release immediately with minimal handling if encountered.",
    searchTerms: ["nassau", "grouper", "protected", "reef fish"],
  },
  {
    id: "queen-conch",
    commonName: "Queen Conch",
    scientificName: "Aliger gigas",
    group: "Shellfish",
    status: "restricted",
    waters: "territorial",
    summary: "An iconic Caribbean marine snail important to Virgin Islands culture and fisheries.",
    habitat: "Seagrass beds, sandy bottoms, and shallow coastal waters.",
    regulationNote: "Confirm the current season, size, possession, shell, and landing requirements before harvest.",
    handling: "Leave undersized animals undisturbed and avoid damaging seagrass habitat.",
    searchTerms: ["conch", "queen conch", "shellfish", "seagrass"],
  },
  {
    id: "caribbean-spiny-lobster",
    commonName: "Caribbean Spiny Lobster",
    scientificName: "Panulirus argus",
    group: "Shellfish",
    status: "restricted",
    waters: "both",
    summary: "A reef-dwelling lobster without large claws, identified by long antennae and a spiny shell.",
    habitat: "Reefs, rocky crevices, ledges, and seagrass-adjacent habitat.",
    regulationNote: "Verify the current season, minimum size, possession, gear, and egg-bearing restrictions.",
    handling: "Never retain egg-bearing females and minimize habitat disturbance while checking crevices.",
    searchTerms: ["lobster", "spiny lobster", "reef", "diving"],
  },
  {
    id: "great-barracuda",
    commonName: "Great Barracuda",
    scientificName: "Sphyraena barracuda",
    group: "Pelagic and reef predator",
    status: "restricted",
    waters: "both",
    summary: "A long, silver predator commonly seen around reefs, channels, and coastal structure.",
    habitat: "Reef edges, channels, mangroves, docks, and open coastal water.",
    regulationNote: "Confirm current rules and local consumption advisories; large reef predators may carry ciguatera risk.",
    handling: "Use pliers and keep hands clear of the teeth; release efficiently when not retained.",
    searchTerms: ["barracuda", "cuda", "predator", "ciguatera"],
  },
];

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
