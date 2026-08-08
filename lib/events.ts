export type EventIsland = "stt" | "stj" | "stx";
export type EventCategory =
  | "culinary"
  | "sports"
  | "culture"
  | "heritage"
  | "festival";

export type UsviEvent = {
  id: string;
  slug: string;
  name: string;
  island: EventIsland;
  category: EventCategory;
  startDate: string;
  endDate?: string;
  timeLabel?: string;
  location: string;
  description: string;
  sourceLabel: string;
  sourceUrl: string;
  verifiedAt: string;
  featured?: boolean;
  tags: string[];
};

export const USVI_EVENTS: readonly UsviEvent[] = [
  {
    id: "stt-restaurant-week-2026",
    slug: "st-thomas-restaurant-week-2026",
    name: "St. Thomas Restaurant Week",
    island: "stt",
    category: "culinary",
    startDate: "2026-08-16",
    endDate: "2026-08-31",
    location: "St. Thomas",
    description:
      "St. Thomas Restaurant Week is listed on the official Visit USVI events calendar for August 16 through August 31, 2026. Use VI Guide to connect the culinary event window with dining discovery, transportation, and the rest of your island plan.",
    sourceLabel: "Visit USVI · Events & Festivals",
    sourceUrl: "https://www.visitusvi.com/carnivals-festivals/",
    verifiedAt: "2026-08-08",
    featured: true,
    tags: ["food", "restaurants", "culinary", "dining", "St. Thomas"],
  },
  {
    id: "stt-victory-run-walk-2026",
    slug: "victory-run-walk-2026",
    name: "Victory Run/Walk",
    island: "stt",
    category: "sports",
    startDate: "2026-09-05",
    timeLabel: "5:30 AM – 12:00 PM",
    location: "Havensight Mall and Charlotte Amalie waterfront",
    description:
      "An all-ages St. Thomas half-marathon, 10K, and 5K celebrating resilience. The official tourism listing says the races begin at Havensight Mall and continue along the Charlotte Amalie waterfront.",
    sourceLabel: "Visit USVI · Victory Run/Walk",
    sourceUrl: "https://www.visitusvi.com/events/victory-run-walk/",
    verifiedAt: "2026-08-08",
    featured: true,
    tags: ["running", "walking", "5K", "10K", "half-marathon", "Havensight"],
  },
  {
    id: "stx-wall2wall-2026",
    slug: "wall2wall-sprint-triathlon-2026",
    name: "Wall2Wall Sprint Triathlon & Try-A-Tri",
    island: "stx",
    category: "sports",
    startDate: "2026-09-20",
    timeLabel: "6:00 AM – 12:00 PM",
    location: "Cane Bay, St. Croix",
    description:
      "A North Shore race day at Cane Bay with sprint-triathlon and Try-A-Tri options. The official listing includes swimming, cycling, and running courses that start and finish on St. Croix's North Shore.",
    sourceLabel: "Visit USVI · Wall2Wall Sprint Triathlon",
    sourceUrl: "https://www.visitusvi.com/events/wall-2-wall-sprint-triathlon-try-a-tri/",
    verifiedAt: "2026-08-08",
    featured: true,
    tags: ["triathlon", "Cane Bay", "North Shore", "swimming", "cycling", "running"],
  },
  {
    id: "stx-national-public-lands-day-2026",
    slug: "national-public-lands-day-2026",
    name: "National Public Lands Day",
    island: "stx",
    category: "heritage",
    startDate: "2026-09-26",
    timeLabel: "8:00 AM – 5:00 PM",
    location: "Christiansted National Historic Site",
    description:
      "National Public Lands Day brings free admission to U.S. national parks and sites that normally charge an entrance fee. On St. Croix, the official tourism listing highlights Christiansted National Historic Site and Fort Christiansvaern.",
    sourceLabel: "Visit USVI · National Public Lands Day",
    sourceUrl: "https://www.visitusvi.com/events/national-public-lands-day/",
    verifiedAt: "2026-08-08",
    tags: ["history", "public lands", "Christiansted", "Fort Christiansvaern", "National Park Service"],
  },
  {
    id: "stx-vi-pr-friendship-day-2026",
    slug: "virgin-islands-puerto-rico-friendship-day-2026",
    name: "Virgin Islands–Puerto Rico Friendship Day",
    island: "stx",
    category: "culture",
    startDate: "2026-10-12",
    location: "St. Croix",
    description:
      "A public holiday honoring the historical and cultural connections between the U.S. Virgin Islands and Puerto Rico. Visit USVI notes that local celebrations can include food, music, and cultural presentations on St. Croix.",
    sourceLabel: "Visit USVI · VI–Puerto Rico Friendship Day",
    sourceUrl: "https://www.visitusvi.com/events/vi-pr-friendship-day/",
    verifiedAt: "2026-08-08",
    featured: true,
    tags: ["culture", "Puerto Rico", "heritage", "public holiday", "St. Croix"],
  },
  {
    id: "stt-paradise-jam-2026",
    slug: "paradise-jam-2026",
    name: "Paradise Jam",
    island: "stt",
    category: "sports",
    startDate: "2026-11-20",
    endDate: "2026-11-28",
    location: "University of the Virgin Islands · Elridge Blake Sports and Fitness Center",
    description:
      "The annual Paradise Jam brings men's and women's college basketball tournament play to St. Thomas. Visit USVI lists the 2026 tournament at the University of the Virgin Islands from November 20 through November 28.",
    sourceLabel: "Visit USVI · Paradise Jam",
    sourceUrl: "https://www.visitusvi.com/events/paradise-jam/",
    verifiedAt: "2026-08-08",
    featured: true,
    tags: ["basketball", "college sports", "UVI", "St. Thomas", "tournament"],
  },
  {
    id: "stx-crucian-christmas-festival-2026",
    slug: "crucian-christmas-festival-2026",
    name: "Crucian Christmas Festival",
    island: "stx",
    category: "festival",
    startDate: "2026-12-26",
    endDate: "2027-01-02",
    timeLabel: "Festival schedule varies by day",
    location: "Frederiksted, St. Croix",
    description:
      "A treasured St. Croix holiday carnival tradition with Festival Village, parades, local food, pageantry, and live music. Visit USVI lists the next festival window from December 26, 2026 through January 2, 2027.",
    sourceLabel: "Visit USVI · Crucian Christmas Festival",
    sourceUrl: "https://www.visitusvi.com/events/crucian-christmas-festival/",
    verifiedAt: "2026-08-08",
    featured: true,
    tags: ["festival", "Frederiksted", "Christmas", "parade", "music", "food"],
  },
];

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  culinary: "Food & dining",
  sports: "Sports",
  culture: "Culture",
  heritage: "Heritage",
  festival: "Festival",
};

export const EVENT_ISLAND_LABELS: Record<EventIsland, string> = {
  stt: "St. Thomas",
  stj: "St. John",
  stx: "St. Croix",
};

export function getEventBySlug(slug: string) {
  return USVI_EVENTS.find((event) => event.slug === slug || event.id === slug);
}

export function getUpcomingEvents(today = "2026-08-08") {
  return [...USVI_EVENTS]
    .filter((event) => (event.endDate ?? event.startDate) >= today)
    .sort((left, right) => left.startDate.localeCompare(right.startDate));
}

export function formatEventDate(event: Pick<UsviEvent, "startDate" | "endDate">) {
  const start = formatIsoDate(event.startDate);
  if (!event.endDate || event.endDate === event.startDate) return start;
  return `${start} – ${formatIsoDate(event.endDate)}`;
}

function formatIsoDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}
