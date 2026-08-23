import {
  ACTIVITY_CATEGORY_LABELS as CORE_ACTIVITY_CATEGORY_LABELS,
  ACTIVITY_COVERAGE_SOURCES as CORE_ACTIVITY_COVERAGE_SOURCES,
  BOOKABLE_EXPERIENCES as CORE_BOOKABLE_EXPERIENCES,
  CURRENT_DESTINATION_ACTIVITY_OPERATORS as CORE_CURRENT_DESTINATION_ACTIVITY_OPERATORS,
  ISLAND_NAMES,
} from "./bookable-experiences-restored-core";
import type {
  ActivityCategory,
  BookableExperience,
} from "./bookable-experiences-restored-core";

export type { ActivityCategory, BookableExperience };
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
];

export const BOOKABLE_EXPERIENCES: BookableExperience[] = [
  ...CORE_BOOKABLE_EXPERIENCES,
  ...CURRENT_ACTIVITY_ADDITIONS,
];

export const ACTIVITY_CATEGORY_LABELS: Record<ActivityCategory, string> =
  CORE_ACTIVITY_CATEGORY_LABELS;

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
    scope: "Current named high-adventure operators including St. Croix scuba excursions",
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
