import fs from "fs";

const EVENT_DIR = "src/data/events";
fs.mkdirSync(EVENT_DIR, { recursive: true });

const img = {
  stt: "/images/places/st-thomas/charlotte-amalie-historic-district-1.jpg",
  stj: "/images/places/st-john/cruz-bay-landing-1.jpg",
  stx: "/images/places/st-croix/christiansted-historic-district-1.jpg",
  magens: "/images/places/st-thomas/magens-bay-beach-1.jpg",
  yacht: "/images/places/st-thomas/american-yacht-harbor-1.jpg",
  fred: "/images/places/st-croix/frederiksted-pier-1.jpg",

  carnivalVillage: "/images/events/carnival/carnival-village.jpg",
  carnivalParade: "/images/events/carnival/parade-1.jpg",
  carnivalFoodFair: "/images/events/carnival/food-fair.jpg",
  jouvert: "/images/events/carnival/jouvert.jpg",

  steelPan: "/images/events/music/steel-pan-night.jpg",
  reggae: "/images/events/music/reggae-night.jpg",
  jazz: "/images/events/music/jazz-sunset.jpg",

  paradiseJam: "/images/events/sports/paradise-jam.jpg",
  rolexRegatta: "/images/events/sports/rolex-regatta.jpg",
  horseRacing: "/images/events/sports/horse-racing.jpg",

  emancipationGarden: "/images/events/culture/emancipation-garden.jpg",
  fortChristian: "/images/events/culture/fort-christian.jpg",
  carnivalQueen: "/images/events/culture/carnival-queen.jpg",
};

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function islandCoords(islandCode) {
  if (islandCode === "st_croix") return { lat: 17.7466, lng: -64.7032 };
  if (islandCode === "st_john") return { lat: 18.3304, lng: -64.7943 };
  return { lat: 18.3419, lng: -64.9307 };
}

function eventCategory(title, fallback = "culture") {
  const text = title.toLowerCase();

  if (
    text.includes("jam") ||
    text.includes("regatta") ||
    text.includes("race") ||
    text.includes("tournament") ||
    text.includes("triathlon") ||
    text.includes("marathon") ||
    text.includes("miles") ||
    text.includes("swim") ||
    text.includes("sailing")
  ) {
    return "sports";
  }

  if (
    text.includes("food") ||
    text.includes("taste") ||
    text.includes("mango") ||
    text.includes("chili") ||
    text.includes("wing") ||
    text.includes("coquito") ||
    text.includes("coconut") ||
    text.includes("cook") ||
    text.includes("tart") ||
    text.includes("farmers")
  ) {
    return "food";
  }

  if (
    text.includes("jazz") ||
    text.includes("music") ||
    text.includes("reggae") ||
    text.includes("soca") ||
    text.includes("calypso") ||
    text.includes("pan") ||
    text.includes("steel")
  ) {
    return "music";
  }

  if (
    text.includes("night") ||
    text.includes("party") ||
    text.includes("fete") ||
    text.includes("sunset") ||
    text.includes("harbor")
  ) {
    return "nightlife";
  }

  return fallback;
}

function pickImage(title, fallback = img.stt) {
  const text = title.toLowerCase();

  if (text.includes("village")) return img.carnivalVillage;
  if (text.includes("parade")) return img.carnivalParade;
  if (text.includes("food fair") || text.includes("food")) return img.carnivalFoodFair;
  if (text.includes("jouvert") || text.includes("j'ouvert")) return img.jouvert;

  if (text.includes("queen") || text.includes("princess")) return img.carnivalQueen;
  if (text.includes("emancipation") || text.includes("transfer")) return img.emancipationGarden;
  if (text.includes("fort")) return img.fortChristian;

  if (text.includes("steel") || text.includes("panorama") || text.includes("pan")) return img.steelPan;
  if (text.includes("reggae") || text.includes("soca") || text.includes("fete")) return img.reggae;
  if (text.includes("jazz") || text.includes("sunset")) return img.jazz;

  if (text.includes("paradise jam")) return img.paradiseJam;
  if (text.includes("regatta") || text.includes("sailing") || text.includes("yacht")) return img.rolexRegatta;
  if (text.includes("horse")) return img.horseRacing;

  if (text.includes("carnival") || text.includes("celebration") || text.includes("festival")) {
    return img.carnivalParade;
  }

  return fallback;
}

function baseEvent({
  title,
  islandCode,
  areaSlug,
  recurrence = "annual",
  startsAt,
  endsAt,
  startDate,
  endDate,
  dayOfMonth,
  weekday,
  coverImage,
  category,
  description,
  coordinates,
  address = "U.S. Virgin Islands",
  website = "https://www.visitusvi.com/",
  source = "VI Navigator curated event source",
  sourceStatus = "projected_annual",
  tags = [],
}) {
  const finalCategory = category ?? eventCategory(title);
  const finalImage = coverImage ?? pickImage(title, islandCode === "st_croix" ? img.stx : islandCode === "st_john" ? img.stj : img.stt);

  return {
    title,
    slug: slugify(title),
    recurrence,
    dayOfMonth,
    weekday,
    startDate,
    endDate,
    islandCode,
    areaSlug,
    category: finalCategory,
    description: description ?? `${title} is a U.S. Virgin Islands event.`,
    shortDescription: description ?? `${title} in the U.S. Virgin Islands.`,
    coordinates: coordinates ?? islandCoords(islandCode),
    address,
    website,
    source,
    sourceStatus,
    verifiedAt: "2026-06-12",
    startsAt,
    endsAt,
    coverImage: finalImage,
    gallery: [finalImage],
    imageCredits: "VI Navigator local event image library",
    imageSource: finalImage,
    tags: Array.from(new Set(["event", finalCategory, "usvi", ...tags].filter(Boolean))),
  };
}

const annual = [
  baseEvent({
    title: "St. Thomas Carnival",
    islandCode: "st_thomas",
    areaSlug: "charlotte-amalie",
    startsAt: "YYYY-04-26",
    endsAt: "YYYY-05-02",
    coverImage: img.carnivalParade,
    description: "St. Thomas Carnival is the island's major annual celebration with Carnival Village, parades, music, food, pageants, J'Ouvert, and cultural programming.",
    tags: ["carnival", "culture", "parade", "st thomas"],
  }),
  baseEvent({
    title: "St. John Celebration",
    islandCode: "st_john",
    areaSlug: "cruz-bay",
    startsAt: "YYYY-06-14",
    endsAt: "YYYY-07-04",
    coverImage: img.carnivalParade,
    description: "St. John Celebration is the island's annual festival season with village events, food fair, parade, music, culture, and fireworks.",
    tags: ["festival", "culture", "st john"],
  }),
  baseEvent({
    title: "Crucian Christmas Festival",
    islandCode: "st_croix",
    areaSlug: "frederiksted",
    startsAt: "YYYY-12-26",
    endsAt: "YYYY-12-31",
    coverImage: img.carnivalParade,
    description: "The Crucian Christmas Festival is St. Croix's annual holiday festival season with music, parades, village events, food, and Crucian culture.",
    tags: ["festival", "christmas", "st croix"],
  }),
  baseEvent({
    title: "Agrifest",
    islandCode: "st_croix",
    areaSlug: "estate-lower-love",
    startsAt: "YYYY-02-14",
    endsAt: "YYYY-02-16",
    coverImage: img.carnivalFoodFair,
    description: "Agrifest is the Virgin Islands Agriculture and Food Fair, highlighting local farming, food, livestock, crafts, vendors, and culture.",
    tags: ["food", "agriculture", "fair"],
  }),
  baseEvent({
    title: "Taste of St. Croix",
    islandCode: "st_croix",
    areaSlug: "christiansted",
    startsAt: "YYYY-04-18",
    endsAt: "YYYY-04-18",
    coverImage: img.carnivalFoodFair,
    description: "Taste of St. Croix is a signature culinary event featuring restaurants, chefs, drinks, and local food culture.",
    tags: ["food", "culinary", "restaurant"],
  }),
  baseEvent({
    title: "Mango Melee",
    islandCode: "st_croix",
    areaSlug: "st-george-village",
    startsAt: "YYYY-07-07",
    endsAt: "YYYY-07-07",
    coverImage: img.carnivalFoodFair,
    description: "Mango Melee celebrates local mangoes with food, contests, vendors, family activities, music, and island culture.",
    tags: ["food", "mango", "festival"],
  }),
  baseEvent({
    title: "Paradise Jam",
    islandCode: "st_thomas",
    areaSlug: "uvi",
    startsAt: "YYYY-11-20",
    endsAt: "YYYY-11-28",
    coverImage: img.paradiseJam,
    description: "Paradise Jam is an annual college basketball tournament hosted at the University of the Virgin Islands on St. Thomas.",
    tags: ["sports", "basketball"],
  }),
  baseEvent({
    title: "Virgin Islands Charter Yacht Show",
    islandCode: "st_thomas",
    areaSlug: "yacht-haven",
    startsAt: "YYYY-11-14",
    endsAt: "YYYY-11-17",
    coverImage: img.rolexRegatta,
    description: "The Virgin Islands Charter Yacht Show brings charter yachts, brokers, crews, and marine industry professionals to St. Thomas.",
    tags: ["marine", "yacht", "tourism"],
  }),
  baseEvent({
    title: "Christmas on Main Street",
    islandCode: "st_thomas",
    areaSlug: "charlotte-amalie",
    startsAt: "YYYY-12-13",
    endsAt: "YYYY-12-13",
    coverImage: img.emancipationGarden,
    description: "Christmas on Main Street is a downtown holiday event with shopping, music, food, lights, and community celebration.",
    tags: ["holiday", "shopping", "culture"],
  }),
  baseEvent({
    title: "Miracle on Main Street",
    islandCode: "st_thomas",
    areaSlug: "charlotte-amalie",
    startsAt: "YYYY-12-20",
    endsAt: "YYYY-12-20",
    coverImage: img.emancipationGarden,
    description: "Miracle on Main Street is a holiday celebration in Charlotte Amalie with lights, music, shopping, and seasonal community events.",
    tags: ["holiday", "culture"],
  }),
  baseEvent({
    title: "Lighted Boat Parade",
    islandCode: "st_thomas",
    areaSlug: "charlotte-amalie-harbor",
    startsAt: "YYYY-12-20",
    endsAt: "YYYY-12-20",
    coverImage: img.rolexRegatta,
    description: "The Lighted Boat Parade features decorated boats in Charlotte Amalie Harbor during the holiday season.",
    tags: ["holiday", "marine", "boat"],
  }),
  baseEvent({
    title: "Transfer Day",
    islandCode: "st_thomas",
    areaSlug: "charlotte-amalie",
    startsAt: "YYYY-03-31",
    endsAt: "YYYY-03-31",
    coverImage: img.fortChristian,
    description: "Transfer Day commemorates the March 31, 1917 transfer of the Danish West Indies to the United States.",
    tags: ["history", "culture"],
  }),
  baseEvent({
    title: "St. Croix Pride",
    islandCode: "st_croix",
    areaSlug: "christiansted",
    startsAt: "YYYY-06-20",
    endsAt: "YYYY-06-22",
    coverImage: img.emancipationGarden,
    description: "St. Croix Pride is an annual community celebration with events, visibility, culture, and local gathering.",
    tags: ["community", "festival"],
  }),
  baseEvent({
    title: "Mardi Croix",
    islandCode: "st_croix",
    areaSlug: "north-shore",
    startsAt: "YYYY-02-21",
    endsAt: "YYYY-02-21",
    coverImage: img.carnivalParade,
    description: "Mardi Croix is a St. Croix Mardi Gras-style celebration with costumes, parade energy, music, and community festivities.",
    tags: ["festival", "parade"],
  }),
  baseEvent({
    title: "Christiansted Dog Parade",
    islandCode: "st_croix",
    areaSlug: "christiansted",
    startsAt: "YYYY-02-15",
    endsAt: "YYYY-02-15",
    coverImage: img.emancipationGarden,
    description: "The Christiansted Dog Parade is a community parade and family-friendly event in downtown Christiansted.",
    tags: ["parade", "family"],
  }),
  baseEvent({
    title: "Texas Society Chili Cook-Off",
    islandCode: "st_thomas",
    areaSlug: "brewers-bay",
    startsAt: "YYYY-08-17",
    endsAt: "YYYY-08-17",
    coverImage: img.carnivalFoodFair,
    description: "The Texas Society Chili Cook-Off is a popular food fundraiser and beachside community event on St. Thomas.",
    tags: ["food", "fundraiser"],
  }),
  baseEvent({
    title: "King of the Wing",
    islandCode: "st_thomas",
    areaSlug: "magens-bay",
    startsAt: "YYYY-06-13",
    endsAt: "YYYY-06-13",
    coverImage: img.carnivalFoodFair,
    description: "King of the Wing is a St. Thomas food festival and wing competition at Magens Bay.",
    tags: ["food", "festival"],
  }),
  baseEvent({
    title: "Coquito Festival",
    islandCode: "st_croix",
    areaSlug: "christiansted",
    startsAt: "YYYY-12-14",
    endsAt: "YYYY-12-14",
    coverImage: img.carnivalFoodFair,
    description: "Coquito Festival celebrates holiday flavors, local vendors, music, food, and community culture.",
    tags: ["food", "holiday"],
  }),
  baseEvent({
    title: "Crucian Coconut Festival",
    islandCode: "st_croix",
    areaSlug: "frederiksted",
    startsAt: "YYYY-12-07",
    endsAt: "YYYY-12-07",
    coverImage: img.carnivalFoodFair,
    description: "Crucian Coconut Festival is a coconut-themed cultural event with food, vendors, music, and family activities.",
    tags: ["food", "festival"],
  }),
  baseEvent({
    title: "Garden of Lights",
    islandCode: "st_croix",
    areaSlug: "st-george-village",
    startsAt: "YYYY-12-01",
    endsAt: "YYYY-12-31",
    coverImage: img.emancipationGarden,
    description: "Garden of Lights is a holiday light experience at St. George Village Botanical Garden.",
    tags: ["holiday", "culture"],
  }),
  baseEvent({
    title: "Bush Cook Chef Cook Week",
    islandCode: "st_croix",
    areaSlug: "islandwide",
    startsAt: "YYYY-10-05",
    endsAt: "YYYY-10-12",
    coverImage: img.carnivalFoodFair,
    description: "Bush Cook Chef Cook Week highlights local cooking traditions, food culture, and culinary creativity.",
    tags: ["food", "culture"],
  }),
  baseEvent({
    title: "Tart Wars",
    islandCode: "st_croix",
    areaSlug: "christiansted",
    startsAt: "YYYY-11-09",
    endsAt: "YYYY-11-09",
    coverImage: img.carnivalFoodFair,
    description: "Tart Wars is a food competition celebrating Virgin Islands tart-making traditions.",
    tags: ["food", "culture"],
  }),
  baseEvent({
    title: "Coral Reef Swim Race",
    islandCode: "st_croix",
    areaSlug: "east-end",
    startsAt: "YYYY-11-02",
    endsAt: "YYYY-11-02",
    coverImage: img.horseRacing,
    description: "Coral Reef Swim Race is an annual open-water swim event on St. Croix.",
    tags: ["sports", "swim"],
  }),
  baseEvent({
    title: "St. Croix Triathlon",
    islandCode: "st_croix",
    areaSlug: "christiansted",
    startsAt: "YYYY-12-01",
    endsAt: "YYYY-12-01",
    coverImage: img.horseRacing,
    description: "St. Croix Triathlon is a recurring endurance sports event on St. Croix.",
    tags: ["sports", "triathlon"],
  }),
  baseEvent({
    title: "St. Patrick's Day Parade",
    islandCode: "st_croix",
    areaSlug: "christiansted",
    startsAt: "YYYY-03-17",
    endsAt: "YYYY-03-17",
    coverImage: img.carnivalParade,
    description: "The St. Patrick's Day Parade is an annual Christiansted parade and community celebration.",
    tags: ["parade", "culture"],
  }),
  baseEvent({
    title: "Blue Marlin Tournament",
    islandCode: "st_thomas",
    areaSlug: "american-yacht-harbor",
    startsAt: "YYYY-08-24",
    endsAt: "YYYY-08-28",
    coverImage: img.rolexRegatta,
    description: "The Blue Marlin Tournament is a major sportfishing event connected to the Virgin Islands marine calendar.",
    tags: ["sports", "fishing"],
  }),
  baseEvent({
    title: "Blue Bay Jazz Festival",
    islandCode: "st_thomas",
    areaSlug: "charlotte-amalie",
    startsAt: "YYYY-10-18",
    endsAt: "YYYY-10-19",
    coverImage: img.jazz,
    description: "Blue Bay Jazz Festival is a music event celebrating jazz and live performance in the Virgin Islands.",
    tags: ["music", "jazz"],
  }),
];

const festivalTitles = [
  ["Carnival Village", "YYYY-04-20", img.carnivalVillage],
  ["Food Fair", "YYYY-04-21", img.carnivalFoodFair],
  ["J'Ouvert", "YYYY-04-22", img.jouvert],
  ["Children's Parade", "YYYY-04-23", img.carnivalParade],
  ["Adult Parade", "YYYY-04-24", img.carnivalParade],
  ["Calypso Monarch", "YYYY-04-25", img.reggae],
  ["Soca Monarch", "YYYY-04-26", img.reggae],
  ["Queen Show", "YYYY-04-27", img.carnivalQueen],
  ["Prince and Princess Show", "YYYY-04-28", img.carnivalQueen],
  ["Festival Princess", "YYYY-04-29", img.carnivalQueen],
  ["Panorama", "YYYY-04-30", img.steelPan],
  ["Village Nights", "YYYY-04-30", img.carnivalVillage],
  ["Emancipation Garden Food Fair", "YYYY-04-30", img.carnivalFoodFair],
];

const festivals = festivalTitles
  .map(([title, date, coverImage]) =>
    baseEvent({
      title: `St. Thomas Carnival ${title}`,
      islandCode: "st_thomas",
      areaSlug: "charlotte-amalie",
      startsAt: date,
      endsAt: date,
      coverImage,
      category: eventCategory(title, "culture"),
      description: `${title} is part of the annual St. Thomas Carnival season.`,
      website: "https://www.visitusvi.com/events/st-thomas-carnival/",
      source: "VisitUSVI / VI Carnival schedule",
      tags: ["festival", "carnival", "st thomas"],
    })
  )
  .concat([
    baseEvent({
      title: "St. John Celebration Fireworks",
      islandCode: "st_john",
      areaSlug: "cruz-bay",
      startsAt: "YYYY-07-04",
      endsAt: "YYYY-07-04",
      coverImage: img.carnivalParade,
      description: "Fireworks over Cruz Bay Harbor during St. John Celebration.",
      website: "https://www.visitusvi.com/events/st-john-celebration/",
      source: "VisitUSVI",
      tags: ["fireworks", "st john", "festival"],
    }),
  ]);

const sports = [
  ["St. Thomas International Regatta", "st_thomas", "YYYY-04-03", "YYYY-04-05", img.rolexRegatta],
  ["International Optimist Regatta", "st_thomas", "YYYY-06-14", "YYYY-06-21", img.rolexRegatta],
  ["Rolex Regatta", "st_thomas", "YYYY-03-27", "YYYY-03-29", img.rolexRegatta],
  ["Carlos Aguilar Match Race", "st_thomas", "YYYY-12-05", "YYYY-12-08", img.rolexRegatta],
  ["Atlantic Blue Marlin Tournament", "st_thomas", "YYYY-08-24", "YYYY-08-28", img.rolexRegatta],
  ["Bastille Day Kingfish Tournament", "st_thomas", "YYYY-07-14", "YYYY-07-14", img.rolexRegatta],
  ["8 Tuff Miles", "st_john", "YYYY-02-28", "YYYY-02-28", img.horseRacing],
  ["VI Half Marathon", "st_croix", "YYYY-12-14", "YYYY-12-14", img.horseRacing],
  ["Youth Sailing Championship", "st_thomas", "YYYY-06-15", "YYYY-06-16", img.rolexRegatta],
].map(([title, islandCode, startsAt, endsAt, coverImage]) =>
  baseEvent({
    title,
    islandCode,
    areaSlug: "sports",
    startsAt,
    endsAt,
    coverImage,
    category: "sports",
    description: `${title} is a recurring sports event in the U.S. Virgin Islands.`,
    website: "https://www.visitusvi.com/carnivals-festivals/",
    source: "VisitUSVI / St. Thomas Yacht Club / STIR",
    tags: ["sports"],
  })
);

const recurring = [
  ["Christiansted Jump Up", "monthly", 1, null, "st_croix", img.carnivalParade, "culture"],
  ["Art Thursday", "monthly", 14, null, "st_croix", img.emancipationGarden, "culture"],
  ["Farmers Market", "weekly", null, "saturday", "st_croix", img.carnivalFoodFair, "food"],
  ["Sunset Jazz", "weekly", null, "friday", "st_croix", img.jazz, "music"],
  ["Food Truck Fridays", "weekly", null, "friday", "st_thomas", img.carnivalFoodFair, "food"],
  ["Downtown Art Walk", "monthly", 7, null, "st_thomas", img.emancipationGarden, "culture"],
  ["Live Music at Yacht Haven", "weekly", null, "saturday", "st_thomas", img.reggae, "music"],
  ["Weekly Steel Pan Night", "weekly", null, "wednesday", "st_thomas", img.steelPan, "music"],
  ["Sunday Beach Sessions", "weekly", null, "sunday", "st_john", img.jazz, "music"],
  ["Monthly Cultural Market", "monthly", 15, null, "st_croix", img.emancipationGarden, "culture"],
  ["Monthly Craft Fair", "monthly", 22, null, "st_thomas", img.emancipationGarden, "culture"],
  ["Rhythms at Sunset", "weekly", null, "thursday", "st_croix", img.jazz, "music"],
].map(([title, recurrence, dayOfMonth, weekday, islandCode, coverImage, category]) =>
  baseEvent({
    title,
    islandCode,
    areaSlug: "recurring",
    recurrence,
    dayOfMonth,
    weekday,
    startDate: "2026-06-01",
    endDate: "2028-12-31",
    coverImage,
    category,
    description: `${title} is a recurring local event in the U.S. Virgin Islands.`,
    website: islandCode === "st_croix" ? "https://www.gotostcroix.com/calendar-events/" : "https://www.visitusvi.com/",
    source: "GoToStCroix / local recurring event calendars",
    sourceStatus: title.includes("Jump Up") || title.includes("Art Thursday") || title.includes("Farmers") ? "recurring_rule" : "needs_verification",
    tags: ["recurring"],
  })
);

const tourism = [
  "Cruise Ship Arrival",
  "Mega Ship Arrival",
  "Yacht Arrival",
  "Restaurant Week",
  "Tourism Showcase",
  "Travel Expo",
  "Dive Expo",
  "Marine Expo",
  "Heritage Month Activities",
  "Historic Walking Tours",
  "National Park Programs",
  "Visitor Welcome Events",
].map((title, i) =>
  baseEvent({
    title,
    islandCode: i % 3 === 0 ? "st_thomas" : i % 3 === 1 ? "st_croix" : "st_john",
    areaSlug: "tourism",
    recurrence: "monthly",
    dayOfMonth: 5 + (i % 20),
    startDate: "2026-06-01",
    endDate: "2028-12-31",
    coverImage: i % 3 === 0 ? img.rolexRegatta : i % 3 === 1 ? img.fred : img.stj,
    category: "tourism",
    description: `${title} is a tourism-related calendar item for visitor planning.`,
    source: "Tourism calendar staging dataset",
    sourceStatus: "needs_verification",
    tags: ["tourism", "visitor"],
  })
);

const nightlife = [
  ["Sunset Sessions", img.jazz],
  ["Beach Bar Live Music", img.reggae],
  ["Jazz Night", img.jazz],
  ["Full Moon Party", img.reggae],
  ["Harbor Music Series", img.reggae],
  ["Friday Night Fete", img.reggae],
  ["Sunday Lime", img.jazz],
  ["Reggae Night", img.reggae],
  ["Soca Saturday", img.reggae],
  ["Seasonal Concert Series", img.reggae],
  ["Village Concert Nights", img.carnivalVillage],
  ["Waterfront Entertainment Series", img.reggae],
].map(([title, coverImage], i) =>
  baseEvent({
    title,
    islandCode: i % 3 === 0 ? "st_thomas" : i % 3 === 1 ? "st_croix" : "st_john",
    areaSlug: "nightlife",
    recurrence: "weekly",
    weekday: ["friday", "saturday", "sunday", "thursday"][i % 4],
    startDate: "2026-06-01",
    endDate: "2028-12-31",
    coverImage,
    category: "nightlife",
    description: `${title} is a recurring nightlife and entertainment event.`,
    source: "Nightlife calendar staging dataset",
    sourceStatus: "needs_verification",
    tags: ["nightlife", "music"],
  })
);

function write(name, data) {
  fs.writeFileSync(`${EVENT_DIR}/${name}`, JSON.stringify(data, null, 2) + "\n");
  console.log(`Wrote ${name}: ${data.length}`);
}

write("annual-events.json", annual);
write("festivals.json", festivals);
write("sports-events.json", sports);
write("recurring-events.json", recurring);
write("tourism-events.json", tourism);
write("nightlife-events.json", nightlife);
