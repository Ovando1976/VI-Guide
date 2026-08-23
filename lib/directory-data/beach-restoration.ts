type BeachIsland = "stt" | "stj" | "stx";

type RestoredBeachInput = {
  id: string;
  name: string;
  island: BeachIsland;
  description: string;
  tags?: string[];
  bestFor?: string[];
  accessNotes?: string[];
  safetyNotes?: string[];
  sourceLabel: string;
  sourceUrl: string;
  sourceUrls?: string[];
  featured?: boolean;
};

const ISLAND_FALLBACK_IMAGE: Record<BeachIsland, string> = {
  stt: "/images/places/fallbacks/attraction-stt.svg",
  stj: "/images/places/fallbacks/attraction-stj.svg",
  stx: "/images/places/fallbacks/attraction-stx.svg",
};

function restoredBeach(input: RestoredBeachInput) {
  return {
    id: input.id,
    slug: input.id,
    name: input.name,
    island: input.island,
    category: "beaches",
    description: input.description,
    heroImage: ISLAND_FALLBACK_IMAGE[input.island],
    tags: ["beach", ...(input.tags ?? [])],
    featured: input.featured ?? false,
    bestFor: input.bestFor ?? ["Beach day", "Coastal scenery"],
    hours: [],
    amenities: [],
    accessNotes:
      input.accessNotes ?? [
        "Confirm current access, parking, and shoreline conditions before setting out.",
      ],
    safetyNotes:
      input.safetyNotes ?? [
        "Ocean conditions can change quickly; assess surf, current, weather, and posted notices before entering the water.",
      ],
    sourceLabel: input.sourceLabel,
    sourceUrl: input.sourceUrl,
    sourceUrls: input.sourceUrls ?? [input.sourceUrl],
    verifiedAt: "2026-08-23",
  };
}

const VINOW_STT = "https://www.vinow.com/stt/stt-b/?listview=1";
const VINOW_STJ = "https://www.vinow.com/stj/stj-b/";
const VINOW_STX =
  "https://www.vinow.com/stx/stx-b/?limit=50&listview=1&order=rhits";
const NPS_SNORKELING =
  "https://www.nps.gov/viis/planyourvisit/snorkeling.htm";
const NPS_MOORINGS =
  "https://www.nps.gov/viis/planyourvisit/quick-mooring-information.htm";

export const RESTORED_BEACH_RECORDS = [
  // St. Thomas — restore the current 20-beach VInow island-directory roster.
  restoredBeach({
    id: "bolongo-bay-beach",
    name: "Bolongo Bay Beach",
    island: "stt",
    description:
      "A Southside St. Thomas shoreline at Bolongo Bay that expands the directory beyond the island's best-known north- and east-side beaches.",
    tags: ["Southside", "Bolongo Bay"],
    bestFor: ["Beach day", "Southside itinerary"],
    sourceLabel: "VInow current St. Thomas beach directory",
    sourceUrl: VINOW_STT,
  }),
  restoredBeach({
    id: "great-bay-beach",
    name: "Great Bay Beach",
    island: "stt",
    description:
      "An East End St. Thomas beach at Great Bay, useful for travelers comparing resort-area shorelines and nearby east-side stops.",
    tags: ["East End", "Great Bay"],
    bestFor: ["East End itinerary", "Coastal scenery"],
    accessNotes: [
      "Great Bay is associated with resort property; verify the current public-access route, parking, and guest policies before visiting.",
    ],
    sourceLabel: "VInow current St. Thomas beach directory",
    sourceUrl: VINOW_STT,
  }),
  restoredBeach({
    id: "hull-bay-beach",
    name: "Hull Bay Beach",
    island: "stt",
    description:
      "A Northside St. Thomas beach and local coastal stop that belongs in a complete island beach directory alongside Magens Bay and Dorothea Bay.",
    tags: ["Northside", "Hull Bay"],
    bestFor: ["Northside itinerary", "Beach day", "Coastal scenery"],
    sourceLabel: "VInow current St. Thomas beach directory",
    sourceUrl: VINOW_STT,
  }),
  restoredBeach({
    id: "limetree-beach",
    name: "Limetree Beach",
    island: "stt",
    description:
      "A small Southside St. Thomas cove listed in the current island beach directory, restoring an important shoreline near the Limetree/Bolongo side of the island.",
    tags: ["Southside", "Limetree"],
    bestFor: ["Quiet beach stop", "Southside itinerary"],
    sourceLabel: "VInow current St. Thomas beach directory",
    sourceUrl: VINOW_STT,
  }),
  restoredBeach({
    id: "lindbergh-bay-beach",
    name: "Lindbergh Bay Beach",
    island: "stt",
    description:
      "A West End St. Thomas beach near Cyril E. King Airport, useful for arrival-day and departure-day planning when time is limited.",
    tags: ["West End", "Lindbergh Bay", "airport area"],
    bestFor: ["Arrival day", "Departure day", "West End itinerary"],
    sourceLabel: "VInow current St. Thomas beach directory",
    sourceUrl: VINOW_STT,
  }),
  restoredBeach({
    id: "little-magens-bay-beach",
    name: "Little Magens Bay Beach",
    island: "stt",
    description:
      "A smaller Northside shoreline associated with the wider Magens Bay area and separately listed in the current St. Thomas beach directory.",
    tags: ["Northside", "Magens Bay area"],
    bestFor: ["Northside itinerary", "Coastal scenery"],
    accessNotes: [
      "Little Magens is distinct from the main Magens Bay beach; confirm current trail or shoreline access before visiting.",
    ],
    sourceLabel: "VInow current St. Thomas beach directory",
    sourceUrl: VINOW_STT,
  }),
  restoredBeach({
    id: "mandahl-bay-beach",
    name: "Mandahl Bay Beach",
    island: "stt",
    description:
      "A Northside St. Thomas bay included in the current island beach roster, restoring a less-commercial shoreline option to the territory directory.",
    tags: ["Northside", "Mandahl Bay"],
    bestFor: ["Northside itinerary", "Coastal scenery"],
    sourceLabel: "VInow current St. Thomas beach directory",
    sourceUrl: VINOW_STT,
  }),
  restoredBeach({
    id: "sapphire-beach",
    name: "Sapphire Beach",
    island: "stt",
    description:
      "A major East End St. Thomas beach at Sapphire Bay, restoring a prominent swimming and snorkeling shoreline that was missing from the visible directory.",
    tags: ["East End", "Sapphire Bay", "snorkeling"],
    bestFor: ["Beach day", "Snorkeling", "East End itinerary"],
    sourceLabel: "VInow current St. Thomas beach directory",
    sourceUrl: "https://www.vinow.com/stt/stt-b/sapphire-beach/",
    sourceUrls: [VINOW_STT, "https://www.vinow.com/stt/stt-b/sapphire-beach/"],
    featured: true,
  }),
  restoredBeach({
    id: "secret-harbour-beach",
    name: "Secret Harbour Beach",
    island: "stt",
    description:
      "A protected East End St. Thomas bay known for generally calmer swimming conditions and shoreline snorkeling, with resort services nearby.",
    tags: ["East End", "Secret Harbor", "snorkeling"],
    bestFor: ["Swimming", "Snorkeling", "East End itinerary"],
    accessNotes: [
      "The beach fronts a resort; confirm current public access, parking, and non-guest service policies before visiting.",
    ],
    sourceLabel: "VInow current Secret Harbor beach listing",
    sourceUrl: "https://www.vinow.com/stt/stt-b/secret-harbor/",
    sourceUrls: [VINOW_STT, "https://www.vinow.com/stt/stt-b/secret-harbor/"],
  }),
  restoredBeach({
    id: "sugar-bay-beach",
    name: "Sugar Bay Beach",
    island: "stt",
    description:
      "A small East End St. Thomas shoreline separately listed in the current island beach directory and useful for complete coastal coverage.",
    tags: ["East End", "Sugar Bay"],
    bestFor: ["East End itinerary", "Coastal scenery"],
    accessNotes: [
      "Confirm current public access and parking because nearby property operations and shoreline access can change.",
    ],
    sourceLabel: "VInow current St. Thomas beach directory",
    sourceUrl: VINOW_STT,
  }),
  restoredBeach({
    id: "turtle-cove-beach-stt",
    name: "Turtle Cove Beach",
    island: "stt",
    description:
      "An East End St. Thomas cove included in the current island beach roster, restoring another resort-area shoreline to traveler search and planning.",
    tags: ["East End", "Turtle Cove"],
    bestFor: ["East End itinerary", "Coastal scenery"],
    accessNotes: [
      "This shoreline is associated with resort property; verify current public-access routing and visitor policies before relying on access.",
    ],
    sourceLabel: "VInow current St. Thomas beach directory",
    sourceUrl: VINOW_STT,
  }),

  // St. John — restore distinct bays omitted from the visible directory.
  restoredBeach({
    id: "great-cruz-bay-beach",
    name: "Great Cruz Bay Beach",
    island: "stj",
    description:
      "A West End St. John shoreline at Great Cruz Bay, restoring a separately listed bay near Cruz Bay and resort-area lodging.",
    tags: ["West End", "Great Cruz Bay"],
    bestFor: ["West End itinerary", "Beach day"],
    accessNotes: [
      "The shoreline fronts resort property; verify current public access, parking, and non-guest policies before visiting.",
    ],
    sourceLabel: "VInow current St. John beach directory",
    sourceUrl: VINOW_STJ,
  }),
  restoredBeach({
    id: "great-lameshur-bay",
    name: "Great Lameshur Bay",
    island: "stj",
    description:
      "The rocky Great Lameshur shoreline in Virgin Islands National Park is distinct from sandy Little Lameshur and is documented by NPS as a snorkeling bay beyond Coral Bay.",
    tags: ["Southside", "Virgin Islands National Park", "snorkeling", "Lameshur"],
    bestFor: ["Snorkeling", "National Park", "Remote beach day"],
    accessNotes: [
      "NPS recommends four-wheel drive for the rocky Lameshur access road and advises rental-car visitors to confirm that their rental agreement permits the road.",
    ],
    sourceLabel: "National Park Service · Snorkeling in Virgin Islands National Park",
    sourceUrl: NPS_SNORKELING,
    sourceUrls: [VINOW_STJ, NPS_SNORKELING, NPS_MOORINGS],
  }),
  restoredBeach({
    id: "little-cruz-bay-beach",
    name: "Little Cruz Bay Beach",
    island: "stj",
    description:
      "A small West End St. John shoreline by the Cruz Bay ferry area that is separately listed in the current island beach directory.",
    tags: ["West End", "Cruz Bay", "ferry area"],
    bestFor: ["Cruz Bay itinerary", "Waterfront stop"],
    accessNotes: [
      "This is an active harbor area; confirm the safest pedestrian access and avoid interfering with ferry or marine operations.",
    ],
    sourceLabel: "VInow current St. John beach directory",
    sourceUrl: VINOW_STJ,
  }),
  restoredBeach({
    id: "leinster-bay-beach",
    name: "Leinster Bay Beach",
    island: "stj",
    description:
      "A National Park waterfront at Leinster Bay near Annaberg and the Leinster Bay Trail, distinct from the offshore Waterlemon Cay snorkeling destination.",
    tags: ["Northside", "Virgin Islands National Park", "Leinster Bay", "Annaberg"],
    bestFor: ["National Park", "Walking", "Historic-area itinerary"],
    accessNotes: [
      "Use designated park access and parking areas; parking at St. John beach and trailheads is limited.",
    ],
    sourceLabel: "National Park Service · Virgin Islands National Park mooring and Leinster Bay information",
    sourceUrl: NPS_MOORINGS,
    sourceUrls: [VINOW_STJ, NPS_MOORINGS],
  }),

  // St. Croix — restore the current 23-beach VInow island-directory roster.
  restoredBeach({
    id: "coakley-bay-beach",
    name: "Coakley Bay Beach",
    island: "stx",
    description:
      "A Northside St. Croix shoreline at Coakley Bay, restoring a separately listed east-of-Christiansted coastal stop to the island directory.",
    tags: ["Northside", "Coakley Bay"],
    sourceLabel: "VInow current St. Croix beach directory",
    sourceUrl: VINOW_STX,
  }),
  restoredBeach({
    id: "cramers-park-beach",
    name: "Cramer's Park Beach",
    island: "stx",
    description:
      "An East End St. Croix beach at Cramer's Park, useful for travelers building a complete eastern-island shoreline itinerary.",
    tags: ["East End", "Cramer's Park"],
    bestFor: ["Beach day", "East End itinerary"],
    sourceLabel: "VInow current St. Croix beach directory",
    sourceUrl: VINOW_STX,
  }),
  restoredBeach({
    id: "davis-bay-beach",
    name: "Davis Bay Beach",
    island: "stx",
    description:
      "A Northside St. Croix beach at Davis Bay, restoring another named shoreline on the island's scenic north coast.",
    tags: ["Northside", "Davis Bay"],
    bestFor: ["North Shore itinerary", "Coastal scenery"],
    accessNotes: [
      "The beach is associated with resort property; confirm current public access, parking, and non-guest policies before visiting.",
    ],
    sourceLabel: "VInow current St. Croix beach directory",
    sourceUrl: VINOW_STX,
  }),
  restoredBeach({
    id: "divi-beach-stx",
    name: "Divi Beach",
    island: "stx",
    description:
      "An East End St. Croix resort-area beach separately included in the current island beach directory.",
    tags: ["East End", "Divi"],
    bestFor: ["East End itinerary", "Beach day"],
    accessNotes: [
      "Verify current public access, parking, and resort visitor policies before setting out.",
    ],
    sourceLabel: "VInow current St. Croix beach directory",
    sourceUrl: VINOW_STX,
  }),
  restoredBeach({
    id: "fort-frederik-beach",
    name: "Fort Frederik Beach",
    island: "stx",
    description:
      "A Frederiksted waterfront beach near the historic fort and town center, useful for combining a West End beach stop with heritage exploration.",
    tags: ["West End", "Frederiksted", "Fort Frederik"],
    bestFor: ["Frederiksted itinerary", "Beach and heritage day"],
    sourceLabel: "VInow current St. Croix beach directory",
    sourceUrl: VINOW_STX,
  }),
  restoredBeach({
    id: "manchenil-bay-beach",
    name: "Manchenil Bay Beach",
    island: "stx",
    description:
      "A Southside St. Croix shoreline at Manchenil Bay, restoring a named south-coast beach that was missing from the visible directory.",
    tags: ["Southside", "Manchenil Bay"],
    bestFor: ["Southside itinerary", "Coastal scenery"],
    sourceLabel: "VInow current St. Croix beach directory",
    sourceUrl: VINOW_STX,
  }),
  restoredBeach({
    id: "mermaid-beach-buccaneer",
    name: "Mermaid Beach at The Buccaneer",
    island: "stx",
    description:
      "A Northside St. Croix resort shoreline at The Buccaneer, separately listed from nearby Shoys and The Grotto in the island beach directory.",
    tags: ["Northside", "The Buccaneer", "Mermaid Beach"],
    bestFor: ["Resort-area beach", "North Shore itinerary"],
    accessNotes: [
      "The beach is on resort property; confirm current public-access, parking, day-pass, and non-guest policies directly with the property.",
    ],
    sourceLabel: "VInow current St. Croix beach directory",
    sourceUrl: VINOW_STX,
  }),
  restoredBeach({
    id: "protestant-cay-beach",
    name: "Protestant Cay Beach",
    island: "stx",
    description:
      "A beach on Protestant Cay just offshore from Christiansted, restoring an island-access shoreline to the St. Croix directory.",
    tags: ["Christiansted", "Protestant Cay", "islet"],
    bestFor: ["Christiansted itinerary", "Island beach day"],
    accessNotes: [
      "Protestant Cay is offshore from Christiansted; verify the current ferry or water-transport schedule and visitor access before departure.",
    ],
    sourceLabel: "VInow current St. Croix beach directory",
    sourceUrl: VINOW_STX,
  }),
  restoredBeach({
    id: "reef-beach-stx",
    name: "Reef Beach",
    island: "stx",
    description:
      "A Northside St. Croix shoreline listed as Reef Beach in the current island beach directory, restoring a named coastal stop to territory search.",
    tags: ["Northside", "Reef Beach"],
    bestFor: ["North Shore itinerary", "Coastal scenery"],
    sourceLabel: "VInow current St. Croix beach directory",
    sourceUrl: VINOW_STX,
  }),
  restoredBeach({
    id: "sprat-hall-beach",
    name: "Sprat Hall Beach",
    island: "stx",
    description:
      "A West End St. Croix shoreline at Sprat Hall, restoring a named beach west of Frederiksted to the traveler directory.",
    tags: ["West End", "Sprat Hall"],
    bestFor: ["West End itinerary", "Coastal scenery"],
    sourceLabel: "VInow current St. Croix beach directory",
    sourceUrl: VINOW_STX,
  }),
  restoredBeach({
    id: "tamarind-reef-bay-beach",
    name: "Tamarind Reef Bay Beach",
    island: "stx",
    description:
      "A Northside St. Croix resort-area shoreline at Tamarind Reef Bay, restoring a named bay east of Christiansted to the directory.",
    tags: ["Northside", "Tamarind Reef Bay"],
    bestFor: ["North Shore itinerary", "Resort-area beach"],
    accessNotes: [
      "Confirm current public access, parking, and resort visitor policies before relying on access.",
    ],
    sourceLabel: "VInow current St. Croix beach directory",
    sourceUrl: VINOW_STX,
  }),
  restoredBeach({
    id: "the-grotto-beach-buccaneer",
    name: "The Grotto Beach at The Buccaneer",
    island: "stx",
    description:
      "A Northside St. Croix shoreline at The Buccaneer that is separately listed from Mermaid Beach and Shoys in the current island directory.",
    tags: ["Northside", "The Buccaneer", "The Grotto"],
    bestFor: ["Resort-area beach", "North Shore itinerary"],
    accessNotes: [
      "The beach is on resort property; confirm current public-access, parking, day-pass, and non-guest policies directly with the property.",
    ],
    sourceLabel: "VInow current St. Croix beach directory",
    sourceUrl: VINOW_STX,
  }),
] as const;

export const RESTORED_BEACH_NAMES = RESTORED_BEACH_RECORDS.map(
  (record) => record.name,
);
