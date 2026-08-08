import type { CommerceBookingKind } from "@/types/commerce-booking";
import type { IntelligenceIsland } from "@/types/intelligence";

export type BookableExperience = {
  id: string;
  name: string;
  kind: Exclude<CommerceBookingKind, "accommodation">;
  island: IntelligenceIsland;
  location: string;
  duration: string;
  summary: string;
  highlights: string[];
  heroImage: string;
  heroAlt: string;
};

export const BOOKABLE_EXPERIENCES: BookableExperience[] = [
  {
    id: "stt-island-highlights",
    name: "St. Thomas Island Highlights",
    kind: "tour",
    island: "stt",
    location: "St. Thomas",
    duration: "4 hours",
    summary:
      "A flexible island overview connecting scenic overlooks, Charlotte Amalie, heritage stops, and a beach finish.",
    highlights: ["Scenic overlooks", "Heritage", "Shopping", "Beach option"],
    heroImage: "/images/usvi-harbor-hero.jpg",
    heroAlt: "Charlotte Amalie harbor and the hills of St. Thomas",
  },
  {
    id: "stt-harbor-sunset",
    name: "Charlotte Amalie Harbor Sunset",
    kind: "experience",
    island: "stt",
    location: "Charlotte Amalie",
    duration: "2.5 hours",
    summary:
      "An evening harbor experience designed around golden-hour views, waterfront atmosphere, and convenient return transportation.",
    highlights: ["Sunset", "Waterfront", "Couples", "Evening"],
    heroImage: "/images/usvi-harbor-hero.jpg",
    heroAlt: "Charlotte Amalie harbor in St. Thomas",
  },
  {
    id: "stj-north-shore-day",
    name: "St. John North Shore Day",
    kind: "tour",
    island: "stj",
    location: "Cruz Bay and North Shore",
    duration: "5 hours",
    summary:
      "A coordinated day from Cruz Bay through the North Shore beaches with realistic transfer timing and flexible swim stops.",
    highlights: ["North Shore", "Beaches", "Scenic drive", "Flexible pace"],
    heroImage: "/images/places/st-john/trunk-bay-overlook-1.jpg",
    heroAlt: "Trunk Bay and the green North Shore of St. John",
  },
  {
    id: "stj-heritage-nature",
    name: "St. John Heritage and Nature Walk",
    kind: "experience",
    island: "stj",
    location: "St. John",
    duration: "3 hours",
    summary:
      "A guided-style request combining cultural context, historic landscapes, and an accessible nature-focused route.",
    highlights: ["History", "Nature", "Walking", "Small groups"],
    heroImage: "/images/places/st-john/trunk-bay-beach-1.jpg",
    heroAlt: "Green hills and clear water on St. John",
  },
  {
    id: "stx-christiansted-culture",
    name: "Christiansted Culture and Food Route",
    kind: "tour",
    island: "stx",
    location: "Christiansted",
    duration: "4 hours",
    summary:
      "A walkable cultural route through Christiansted with historic context, local food stops, and time for waterfront exploration.",
    highlights: ["Christiansted", "Food", "History", "Waterfront"],
    heroImage: "/images/accommodations/king-christian-hotel.jpg",
    heroAlt: "Historic waterfront architecture in Christiansted, St. Croix",
  },
  {
    id: "stx-west-end-sunset",
    name: "Frederiksted West End Sunset",
    kind: "experience",
    island: "stx",
    location: "Frederiksted",
    duration: "3 hours",
    summary:
      "A relaxed west-end experience centered on the waterfront, local atmosphere, sunset timing, and a planned ride home.",
    highlights: ["Frederiksted", "Sunset", "Waterfront", "Relaxed pace"],
    heroImage: "/images/places/st-croix/cane-bay-beach-1.jpg",
    heroAlt: "St. Croix coastline at Cane Bay",
  },
];

export const ISLAND_NAMES: Record<IntelligenceIsland, string> = {
  stt: "St. Thomas",
  stj: "St. John",
  stx: "St. Croix",
};
