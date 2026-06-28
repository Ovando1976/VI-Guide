// src/data/stThomasStJohnColonialEstates.ts

export type IslandCode = "st_thomas" | "st_john";

export type Confidence =
  | "confirmed"
  | "probable"
  | "possible";

export interface ColonialEstateRecord {
  id: string;
  name: string;
  aliases: string[];

  island: IslandCode;

  /**
   * Danish Quarter
   * null = not yet verified
   */
  quarter: string | null;

  /**
   * Historical confidence in estate identity.
   */
  confidence: Confidence;

  /**
   * Indicates that the ownership chain still needs
   * complete extraction from archival sources.
   */
  needs_owner_chain: boolean;
}

export const stThomasStJohnColonialEstates: ColonialEstateRecord[] = [
  // ==========================
  // ST. THOMAS
  // ==========================

  {
    id: "anna-retreat",
    name: "Anna's Retreat",
    aliases: ["Tutu"],
    island: "st_thomas",
    quarter: "East End",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "tabor",
    name: "Tabor",
    aliases: [],
    island: "st_thomas",
    quarter: "Northside",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "harmoni",
    name: "Harmoni",
    aliases: ["Harmony"],
    island: "st_thomas",
    quarter: "Northside",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "new-herrnhut",
    name: "New Herrnhut",
    aliases: [],
    island: "st_thomas",
    quarter: "Southside",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "nisky",
    name: "Nisky",
    aliases: ["Niesky"],
    island: "st_thomas",
    quarter: "Southside",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "krum-bay",
    name: "Krum Bay",
    aliases: [],
    island: "st_thomas",
    quarter: "Southside",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "savan",
    name: "Savan",
    aliases: ["Savane"],
    island: "st_thomas",
    quarter: "Southside",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "john-brewers",
    name: "John Brewers",
    aliases: [
      "John Brewers Bay",
      "Brewers"
    ],
    island: "st_thomas",
    quarter: "West End",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "bordeaux",
    name: "Bordeaux",
    aliases: [],
    island: "st_thomas",
    quarter: "Northside",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "netjeberg",
    name: "Neltjeberg",
    aliases: [
      "Netleberg",
      "Nettleberg"
    ],
    island: "st_thomas",
    quarter: "Northside",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "lovenlund",
    name: "Lovenlund",
    aliases: [],
    island: "st_thomas",
    quarter: "Northside",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "peterborg",
    name: "Peterborg",
    aliases: [],
    island: "st_thomas",
    quarter: "Northside",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "magens-bay",
    name: "Magens Bay",
    aliases: ["Magen's Bay"],
    island: "st_thomas",
    quarter: "Northside",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "zufriedenheit",
    name: "Zufriedenheit",
    aliases: [],
    island: "st_thomas",
    quarter: "Northside",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "lerkenlund",
    name: "Lerkenlund",
    aliases: [],
    island: "st_thomas",
    quarter: "Northside",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "canaan",
    name: "Canaan",
    aliases: [],
    island: "st_thomas",
    quarter: "West End",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "sherpenjewel",
    name: "Sherpenjewel",
    aliases: [
      "Sherpen Jewel",
      "Scharpenjewel"
    ],
    island: "st_thomas",
    quarter: "Northside",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "hull",
    name: "Hull",
    aliases: ["Hull Bay"],
    island: "st_thomas",
    quarter: "Northside",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "st-peter",
    name: "St. Peter",
    aliases: [],
    island: "st_thomas",
    quarter: "Northside",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "wintberg",
    name: "Wintberg",
    aliases: ["Windberg"],
    island: "st_thomas",
    quarter: "Northside",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "mafolie",
    name: "Mafolie",
    aliases: [],
    island: "st_thomas",
    quarter: "Southside",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "misgunst",
    name: "Misgunst",
    aliases: [],
    island: "st_thomas",
    quarter: "Northside",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "elizabeth",
    name: "Elizabeth",
    aliases: [],
    island: "st_thomas",
    quarter: null,
    confidence: "probable",
    needs_owner_chain: true,
  },
  {
    id: "solberg",
    name: "Solberg",
    aliases: [],
    island: "st_thomas",
    quarter: "Southside",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "bakkero",
    name: "Bakkero",
    aliases: [
      "Bakke Ro",
      "Bakke-Ro"
    ],
    island: "st_thomas",
    quarter: "Southside",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "bellevue",
    name: "Bellevue",
    aliases: [],
    island: "st_thomas",
    quarter: null,
    confidence: "probable",
    needs_owner_chain: true,
  },
  {
    id: "bolongo",
    name: "Bolongo",
    aliases: [],
    island: "st_thomas",
    quarter: "East End",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "morningstar",
    name: "Morningstar",
    aliases: [],
    island: "st_thomas",
    quarter: "Southside",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "frenchmans-bay",
    name: "Frenchman's Bay",
    aliases: [
      "Frenchmans Bay"
    ],
    island: "st_thomas",
    quarter: "Southside",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "fortuna",
    name: "Fortuna",
    aliases: [],
    island: "st_thomas",
    quarter: "West End",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "caret-bay",
    name: "Caret Bay",
    aliases: [],
    island: "st_thomas",
    quarter: "West End",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "dorothea",
    name: "Dorothea",
    aliases: [],
    island: "st_thomas",
    quarter: "Northside",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "mandahl",
    name: "Mandahl",
    aliases: [
      "Mandal"
    ],
    island: "st_thomas",
    quarter: "Northside",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "contant-stt",
    name: "Contant",
    aliases: [],
    island: "st_thomas",
    quarter: "Southside",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "smith-bay",
    name: "Smith Bay",
    aliases: [],
    island: "st_thomas",
    quarter: "East End",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "nazareth",
    name: "Nazareth",
    aliases: [],
    island: "st_thomas",
    quarter: "East End",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "frydenhoj",
    name: "Frydenhøj",
    aliases: [
      "Frydenhoj"
    ],
    island: "st_thomas",
    quarter: "East End",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "frydendal",
    name: "Frydendal",
    aliases: [],
    island: "st_thomas",
    quarter: "East End",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "vessup",
    name: "Vessup",
    aliases: [],
    island: "st_thomas",
    quarter: "East End",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "water-island",
    name: "Water Island",
    aliases: [],
    island: "st_thomas",
    quarter: "Water Island",
    confidence: "confirmed",
    needs_owner_chain: true,
  },

  // ==========================
  // ST. JOHN
  // ==========================

  {
    id: "annaberg",
    name: "Annaberg",
    aliases: [],
    island: "st_john",
    quarter: "Maho",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "carolina",
    name: "Carolina",
    aliases: [],
    island: "st_john",
    quarter: "Coral Bay",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "cinnamon-bay",
    name: "Cinnamon Bay",
    aliases: [],
    island: "st_john",
    quarter: "Maho",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "caneel-bay",
    name: "Caneel Bay",
    aliases: [
      "Durloe's Plantation"
    ],
    island: "st_john",
    quarter: "Cruz Bay",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "mary-point",
    name: "Mary Point",
    aliases: [],
    island: "st_john",
    quarter: "Maho",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "catherineberg",
    name: "Catherineberg",
    aliases: [
      "Cathrineberg"
    ],
    island: "st_john",
    quarter: "Cruz Bay",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "jockumsdahl",
    name: "Jockumsdahl",
    aliases: [],
    island: "st_john",
    quarter: "Coral Bay",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "hammer-farm",
    name: "Hammer Farm",
    aliases: [],
    island: "st_john",
    quarter: "Coral Bay",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "lameshur",
    name: "Lameshur",
    aliases: [],
    island: "st_john",
    quarter: "Reef Bay",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "reef-bay",
    name: "Reef Bay",
    aliases: [],
    island: "st_john",
    quarter: "Reef Bay",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "bethania",
    name: "Bethania",
    aliases: [
      "Bethany"
    ],
    island: "st_john",
    quarter: "Coral Bay",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "emmaus",
    name: "Emmaus",
    aliases: [],
    island: "st_john",
    quarter: "Coral Bay",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "perforce",
    name: "Perforce",
    aliases: [],
    island: "st_john",
    quarter: "Coral Bay",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "hope-misgunst",
    name: "Hope & Misgunst",
    aliases: [
      "Hope",
      "Misgunst"
    ],
    island: "st_john",
    quarter: "Coral Bay",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "contentment",
    name: "Contentment",
    aliases: [],
    island: "st_john",
    quarter: "Coral Bay",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "susannaberg",
    name: "Susannaberg",
    aliases: [],
    island: "st_john",
    quarter: "Maho",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "denis-bay",
    name: "Denis Bay",
    aliases: [],
    island: "st_john",
    quarter: "Maho",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "concordia",
    name: "Concordia",
    aliases: [],
    island: "st_john",
    quarter: "Reef Bay",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "enighed",
    name: "Enighed",
    aliases: [],
    island: "st_john",
    quarter: "Cruz Bay",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "adrian",
    name: "Adrian",
    aliases: [],
    island: "st_john",
    quarter: "Coral Bay",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
  {
    id: "contant-stj",
    name: "Contant",
    aliases: [],
    island: "st_john",
    quarter: "Cruz Bay",
    confidence: "confirmed",
    needs_owner_chain: true,
  },
];