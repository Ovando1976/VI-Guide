import {
  ACTIVITY_CATEGORY_LABELS as CORE_ACTIVITY_CATEGORY_LABELS,
  ACTIVITY_COVERAGE_SOURCES as CORE_ACTIVITY_COVERAGE_SOURCES,
  BOOKABLE_EXPERIENCES as CORE_BOOKABLE_EXPERIENCES,
  CURRENT_DESTINATION_ACTIVITY_OPERATORS as CORE_CURRENT_DESTINATION_ACTIVITY_OPERATORS,
  ISLAND_NAMES,
} from "./bookable-experiences-restored-core";
import type {
  ActivityCategory as CoreActivityCategory,
  BookableExperience as CoreBookableExperience,
} from "./bookable-experiences-restored-core";

export type ActivityCategory =
  | CoreActivityCategory
  | "kiteboarding"
  | "distillery";

export type BookableExperience = Omit<CoreBookableExperience, "category"> & {
  category: ActivityCategory;
};

export { ISLAND_NAMES };

/**
 * Current-source operator additions layered over the restored activity catalog.
 *
 * Keep live price, inventory, weather-dependent routing, certification checks,
 * cancellation terms, and final confirmation with the operator. This catalog
 * only publishes durable discovery facts verified against current operator or
 * destination-authority sources.
 */
export const CURRENT_ACTIVITY_ADDITIONS: BookableExperience[] = [
  {
    id: "stt-historical-trust-hassel-island",
    name: "Hassel Island Guided History Tour",
    operator: "St. Thomas Historical Trust",
    category: "hiking",
    kind: "tour",
    island: "stt",
    location: "Charlotte Amalie Harbor / Hassel Island, St. Thomas",
    duration: "2.5–3 hours",
    summary:
      "A boat-assisted guided hike from the St. Thomas Historical Trust Museum to Hassel Island's colonial-era batteries, Garrison House, signal station, and harbor viewpoints.",
    highlights: ["Guided hike", "Hassel Island", "Historic sites", "Harbor boat transfer"],
    sourceUrl: "https://www.stthomashistoricaltrust.org/hassel-island-tour-1",
    sourceLabel: "St. Thomas Historical Trust official tour page",
    verifiedAt: "2026-08-23",
    availabilityStatus: "operator-listed",
  },
  {
    id: "stt-aqua-action-two-tank",
    name: "Secret Harbour Guided Scuba Dive",
    operator: "Aqua Action Dive Center",
    category: "scuba",
    kind: "tour",
    island: "stt",
    location: "Secret Harbour Beach Resort, St. Thomas",
    duration: "Half day",
    summary:
      "Guided shore and boat diving from Secret Harbour with small-group instruction and options for certified divers and first-time scuba participants.",
    highlights: ["PADI dive center", "Boat & shore dives", "Small groups", "Secret Harbour"],
    sourceUrl: "https://www.visitusvi.com/listing/st-thomas/65/aqua-action-dive-center/",
    sourceLabel: "Visit USVI current listing and Secret Harbour operator-partner information",
    verifiedAt: "2026-08-23",
    availabilityStatus: "operator-listed",
  },
  {
    id: "stt-red-hook-two-tank",
    name: "Red Hook Two-Tank Dive Trip",
    operator: "Red Hook Dive Center",
    category: "scuba",
    kind: "tour",
    island: "stt",
    location: "American Yacht Harbor, Red Hook, St. Thomas",
    duration: "Half day",
    summary:
      "A professional-led two-tank boat dive departing Red Hook, with the crew selecting sites from St. Thomas reefs and wrecks according to conditions and diver fit.",
    highlights: ["Two-tank dive", "PADI center", "Red Hook", "Daily site selection"],
    sourceUrl: "https://www.redhookdivecenter.com/dive-trips/",
    sourceLabel: "Red Hook Dive Center official dive-trips page",
    verifiedAt: "2026-08-23",
    availabilityStatus: "operator-listed",
  },
  {
    id: "stt-aqua-marine-day-dive",
    name: "Limetree Guided Scuba Excursion",
    operator: "Aqua Marine Dive Center",
    category: "scuba",
    kind: "tour",
    island: "stt",
    location: "Limetree Beach Resort, St. Thomas",
    duration: "Half day",
    summary:
      "Guided daytime scuba excursions from Limetree Beach Resort, with options described for certified divers, families, and divers at different experience levels.",
    highlights: ["Scuba", "Limetree Beach", "Guided", "Multiple skill levels"],
    sourceUrl: "https://www.visitusvi.com/experience/scuba-diving-st-thomas/",
    sourceLabel: "Visit USVI current St. Thomas scuba-diving guide",
    verifiedAt: "2026-08-23",
    availabilityStatus: "request-only",
  },
  {
    id: "stt-seahorse-water-excursion",
    name: "St. Thomas Snorkel & Custom Boat Excursion",
    operator: "SeaHorse Water Taxi",
    category: "boat-charter",
    kind: "tour",
    island: "stt",
    location: "St. Thomas / surrounding USVI waters",
    duration: "Custom",
    summary:
      "A St. Thomas-based water excursion offering snorkeling, sunset cruising, island-hopping, and custom private-tour formats matched to the group's interests.",
    highlights: ["Snorkeling", "Private charter", "Sunset option", "Custom itinerary"],
    sourceUrl: "https://www.visitusvi.com/listing/st-thomas/522/seahorse-water-taxi/",
    sourceLabel: "Visit USVI current SeaHorse Water Taxi listing",
    verifiedAt: "2026-08-23",
    availabilityStatus: "request-only",
  },
  {
    id: "stx-west-end-guided-jet-ski",
    name: "Rainbow Beach Guided Jet Ski Tour",
    operator: "West End Water Sports",
    category: "jet-ski",
    kind: "tour",
    island: "stx",
    location: "Rainbow Beach, Frederiksted, St. Croix",
    duration: "Varies",
    summary:
      "A guided West End jet-ski route from Rainbow Beach toward Hams Bluff and Sandy Point, alongside the operator's paddleboard, kayak, and snorkel rentals.",
    highlights: ["Jet ski", "Rainbow Beach", "Hams Bluff", "Sandy Point"],
    sourceUrl: "https://www.gotostcroix.com/things-to-do/west-end-water-sports/",
    sourceLabel: "GoToStCroix current operator profile and Visit USVI current beach guide",
    verifiedAt: "2026-08-23",
    availabilityStatus: "request-only",
  },
  {
    id: "stx-adventures-in-diving-reef",
    name: "St. Croix Reef Scuba Excursion",
    operator: "Adventures in Diving STX",
    category: "scuba",
    kind: "tour",
    island: "stx",
    location: "St. Croix",
    duration: "Varies",
    summary:
      "A guided St. Croix scuba or snorkeling excursion focused on shallow coral reefs and marine life, with additional West End guided-hike options highlighted by the destination authority.",
    highlights: ["Scuba", "Snorkeling", "Coral reefs", "Local guide"],
    sourceUrl: "https://www.visitusvi.com/experience/adventures-for-thrill-seekers/",
    sourceLabel: "Visit USVI current thrill-seeker excursions guide",
    verifiedAt: "2026-08-23",
    availabilityStatus: "request-only",
  },
  {
    id: "stt-kiteboarding-vi-lesson",
    name: "St. Thomas Kiteboarding Lesson",
    operator: "Kiteboarding VI",
    category: "kiteboarding",
    kind: "experience",
    island: "stt",
    location: "St. Thomas",
    duration: "Varies",
    summary:
      "Kiteboarding and kitesurfing instruction from a St. Thomas operator that also supports wing-foiling lessons and private Caribbean kite trips.",
    highlights: ["Kiteboarding", "Kitesurfing", "Wing foiling", "Instruction"],
    sourceUrl: "https://www.kite.vi/",
    sourceLabel: "Kiteboarding VI official website and current Visit USVI listing",
    verifiedAt: "2026-08-24",
    availabilityStatus: "request-only",
  },
  {
    id: "stx-leading-edge-kiteboarding-lesson",
    name: "St. Croix Private Kiteboarding Lesson",
    operator: "The Leading Edge Kite School",
    category: "kiteboarding",
    kind: "experience",
    island: "stx",
    location: "St. Croix",
    duration: "2.5–4 hours",
    summary:
      "Personalized one-on-one kiteboarding instruction on St. Croix, progressing from wind and safety fundamentals to supported riding as conditions and skill level allow.",
    highlights: ["Kiteboarding", "Private instruction", "Safety skills", "St. Croix"],
    sourceUrl: "https://www.leadingedgekiteschool.com/",
    sourceLabel: "Leading Edge Kite School official website and current Visit USVI thrill-seeker guide",
    verifiedAt: "2026-08-24",
    availabilityStatus: "operator-listed",
  },
  {
    id: "stx-cruzan-rum-distillery-tour",
    name: "Cruzan Rum Distillery Tour",
    operator: "Cruzan Rum Distillery",
    category: "distillery",
    kind: "tour",
    island: "stx",
    location: "Estate Diamond, Frederiksted, St. Croix",
    duration: "About 30 minutes",
    summary:
      "A guided look at Cruzan's St. Croix rum-making and aging process, connecting the historic Estate Diamond operation with the island's long rum tradition.",
    highlights: ["Rum making", "Distillery history", "Aging process", "Estate Diamond"],
    sourceUrl: "https://www.visitusvi.com/listing/st-croix/4165/cruzan-rum-distillery/",
    sourceLabel: "Visit USVI current Cruzan Rum listing and distillery guide",
    verifiedAt: "2026-08-24",
    availabilityStatus: "operator-listed",
  },
  {
    id: "stx-sion-farm-distillery-tour",
    name: "Mutiny Island Vodka Distillery Tour",
    operator: "Sion Farm Distillery",
    category: "distillery",
    kind: "tour",
    island: "stx",
    location: "Sion Farm, St. Croix",
    duration: "Varies",
    summary:
      "A behind-the-scenes look at the zero-waste Sion Farm Distillery and its breadfruit-based Mutiny Island Vodka, followed by the operator's tasting-room experience.",
    highlights: ["Breadfruit vodka", "Distilling process", "Zero-waste facility", "Sion Farm"],
    sourceUrl: "https://www.visitusvi.com/listing/st-croix/326398/sion-farm-distillery-mutiny-island-vodka/",
    sourceLabel: "Visit USVI current Sion Farm Distillery listing and distillery guide",
    verifiedAt: "2026-08-24",
    availabilityStatus: "operator-listed",
  },
];

export const BOOKABLE_EXPERIENCES: BookableExperience[] = [
  ...CORE_BOOKABLE_EXPERIENCES,
  ...CURRENT_ACTIVITY_ADDITIONS,
];

export const ACTIVITY_CATEGORY_LABELS: Record<ActivityCategory, string> = {
  ...CORE_ACTIVITY_CATEGORY_LABELS,
  kiteboarding: "Kiteboarding & kitesurfing",
  distillery: "Distillery tours",
};

export const ACTIVITY_COVERAGE_SOURCES = [
  ...CORE_ACTIVITY_COVERAGE_SOURCES,
  {
    id: "st-thomas-historical-trust-hassel-island",
    label: "St. Thomas Historical Trust Hassel Island Tour",
    url: "https://www.stthomashistoricaltrust.org/hassel-island-tour-1",
    scope: "Current guided Hassel Island history hike and boat-assisted tour",
  },
  {
    id: "visit-usvi-st-thomas-scuba",
    label: "Visit USVI St. Thomas Scuba Diving",
    url: "https://www.visitusvi.com/experience/scuba-diving-st-thomas/",
    scope: "Current named St. Thomas dive centers and guided scuba options",
  },
  {
    id: "visit-usvi-seahorse-water-taxi",
    label: "Visit USVI SeaHorse Water Taxi",
    url: "https://www.visitusvi.com/listing/st-thomas/522/seahorse-water-taxi/",
    scope: "Current St. Thomas snorkeling, sunset, island-hop, and custom water excursions",
  },
  {
    id: "gotostcroix-west-end-water-sports",
    label: "GoToStCroix West End Water Sports",
    url: "https://www.gotostcroix.com/things-to-do/west-end-water-sports/",
    scope: "Current Rainbow Beach guided jet-ski and watersports operator coverage",
  },
  {
    id: "visit-usvi-thrill-seekers",
    label: "Visit USVI Thrill-Seeker Excursions",
    url: "https://www.visitusvi.com/experience/adventures-for-thrill-seekers/",
    scope: "Current named high-adventure operators including St. Croix scuba and kiteboarding experiences",
  },
  {
    id: "kite-vi",
    label: "Kiteboarding VI",
    url: "https://www.kite.vi/",
    scope: "Current St. Thomas kiteboarding, kitesurfing, wing-foiling, and private kite-trip coverage",
  },
  {
    id: "leading-edge-kite-school",
    label: "The Leading Edge Kite School",
    url: "https://www.leadingedgekiteschool.com/",
    scope: "Current St. Croix private kiteboarding instruction and supported riding",
  },
  {
    id: "visit-usvi-distilleries",
    label: "Visit USVI Distilleries & Breweries",
    url: "https://www.visitusvi.com/experience/drink-local-usvi-distilleries-breweries/",
    scope: "Current Cruzan Rum and Sion Farm Distillery visitor-tour coverage",
  },
] as const;

export const CURRENT_DESTINATION_ACTIVITY_OPERATORS = [
  ...CORE_CURRENT_DESTINATION_ACTIVITY_OPERATORS,
  "St. Thomas Historical Trust",
  "Aqua Action Dive Center",
  "Red Hook Dive Center",
  "Aqua Marine Dive Center",
  "SeaHorse Water Taxi",
  "West End Water Sports",
  "Adventures in Diving STX",
  "Kiteboarding VI",
  "The Leading Edge Kite School",
  "Cruzan Rum Distillery",
  "Sion Farm Distillery",
] as const;

export function getActivityCoverage() {
  return (["stt", "stj", "stx"] as const).map((island) => {
    const items = BOOKABLE_EXPERIENCES.filter((item) => item.island === island);
    return {
      island,
      count: items.length,
      operators: new Set(items.map((item) => item.operator)).size,
      categories: new Set(items.map((item) => item.category)).size,
    };
  });
}
