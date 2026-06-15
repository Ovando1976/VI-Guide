import type { IslandCode } from "../types";

export type BeachRecord = {
  id: string;
  name: string;
  island: IslandCode;
  area: string;
  description: string;
  image?: string;
  coordinates: { lat: number; lng: number };
  tags: string[];
  amenities: string[];
  bestFor: string[];
  safetyNotes?: string;
};

export const beaches: BeachRecord[] = [
  {
    id: "magens-bay",
    name: "Magens Bay",
    island: "st_thomas",
    area: "Northside",
    description:
      "Large protected bay with calm water, shade, facilities, and one of the most recognizable beach landscapes in the Virgin Islands.",
    image: "/images/beaches/magens-bay.jpg",
    coordinates: { lat: 18.3626, lng: -64.9307 },
    tags: ["northside", "calm-water", "family", "iconic"],
    amenities: ["parking", "restrooms", "showers", "food", "chair-rentals"],
    bestFor: ["families", "swimming", "first-time-visitors"],
    safetyNotes: "Usually calm, but conditions can change after storms.",
  },
  {
    id: "coki-point",
    name: "Coki Point",
    island: "st_thomas",
    area: "East End",
    description:
      "Small lively beach known for clear water, snorkeling, reef fish, food vendors, and proximity to Coral World.",
    image: "/images/beaches/coki-point.jpg",
    coordinates: { lat: 18.3499, lng: -64.8676 },
    tags: ["east-end", "snorkeling", "reef", "food"],
    amenities: ["food", "snorkel-rentals", "taxis", "vendors"],
    bestFor: ["snorkeling", "local-food", "cruise-visitors"],
  },
  {
    id: "sapphire-beach",
    name: "Sapphire Beach",
    island: "st_thomas",
    area: "East End",
    description:
      "Scenic beach with views toward St. John, snorkeling near reef areas, visitor amenities, and resort access nearby.",
    image: "/images/beaches/sapphire-beach.jpg",
    coordinates: { lat: 18.3348, lng: -64.8493 },
    tags: ["east-end", "views", "snorkeling", "st-john-view"],
    amenities: ["food", "parking", "chair-rentals", "watersports"],
    bestFor: ["views", "snorkeling", "couples"],
  },
  {
    id: "lindquist-beach",
    name: "Lindquist Beach",
    island: "st_thomas",
    area: "Smith Bay",
    description:
      "Beautiful protected beach inside Smith Bay Park with clear water, white sand, and a quieter natural setting.",
    image: "/images/beaches/lindquist-beach.jpg",
    coordinates: { lat: 18.3367, lng: -64.8619 },
    tags: ["smith-bay", "scenic", "quiet", "park"],
    amenities: ["parking", "restrooms", "picnic-area"],
    bestFor: ["quiet-beach-day", "photos", "swimming"],
  },
  {
    id: "trunk-bay",
    name: "Trunk Bay",
    island: "st_john",
    area: "North Shore",
    description:
      "World-famous National Park beach with turquoise water, soft sand, and an underwater snorkeling trail.",
    image: "/images/beaches/trunk-bay.jpg",
    coordinates: { lat: 18.3527, lng: -64.7694 },
    tags: ["national-park", "north-shore", "snorkeling", "iconic"],
    amenities: ["restrooms", "showers", "snorkel-rentals", "lifeguards"],
    bestFor: ["snorkeling", "families", "first-time-visitors"],
  },
  {
    id: "cinnamon-bay",
    name: "Cinnamon Bay",
    island: "st_john",
    area: "North Shore",
    description:
      "Long scenic beach inside Virgin Islands National Park with historic landscape, camping area, and strong natural character.",
    image: "/images/beaches/cinnamon-bay.jpg",
    coordinates: { lat: 18.3566, lng: -64.7582 },
    tags: ["national-park", "north-shore", "camping", "history"],
    amenities: ["restrooms", "food", "campground", "watersports"],
    bestFor: ["long-beach-walks", "camping", "families"],
  },
  {
    id: "sandy-point",
    name: "Sandy Point",
    island: "st_croix",
    area: "West End",
    description:
      "Long protected beach and wildlife refuge known for open sand, turtle nesting, and dramatic western views.",
    image: "/images/beaches/sandy-point.jpg",
    coordinates: { lat: 17.6819, lng: -64.8997 },
    tags: ["wildlife-refuge", "west-end", "turtles", "protected"],
    amenities: ["limited-access", "parking-seasonal"],
    bestFor: ["scenery", "nature", "quiet"],
    safetyNotes: "Access may be seasonally restricted for turtle nesting.",
  },
  {
    id: "rainbow-beach",
    name: "Rainbow Beach",
    island: "st_croix",
    area: "Frederiksted",
    description:
      "Popular west-end beach near Frederiksted with sunset views, food, music, and calm-water days.",
    image: "/images/beaches/rainbow-beach.jpg",
    coordinates: { lat: 17.7078, lng: -64.8914 },
    tags: ["frederiksted", "sunset", "food", "west-end"],
    amenities: ["food", "bar", "chair-rentals", "watersports"],
    bestFor: ["sunset", "food", "relaxed-beach-day"],
  }
];

export default beaches;
