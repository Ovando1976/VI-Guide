import type { PlaceRecord } from "@/types/place";

export const PLACES: PlaceRecord[] = [
  {
    id: "havensight-dining",
    slug: "havensight-dining",
    name: "Havensight Dining Row",
    island: "stt",
    category: "restaurant",
    description:
      "A strong dining and visitor corridor near port activity and town movement.",
    heroImage: "/images/places/havensight-dining.jpg",
    tags: ["food", "port", "visitor zone"],
    priceTier: "$$",
    featured: true,
  },
  {
    id: "cruz-bay-waterfront",
    slug: "cruz-bay-waterfront",
    name: "Cruz Bay Waterfront",
    island: "stj",
    category: "attraction",
    description:
      "A central St. John movement zone with dining, ferry access, and walkable activity.",
    heroImage: "/images/places/cruz-bay-waterfront.jpg",
    tags: ["ferry", "walkable", "waterfront"],
    featured: true,
  },
  {
    id: "christiansted-boardwalk",
    slug: "christiansted-boardwalk",
    name: "Christiansted Boardwalk",
    island: "stx",
    category: "attraction",
    description:
      "A classic St. Croix destination with waterfront movement, dining, and views.",
    heroImage: "/images/places/christiansted-boardwalk.jpg",
    tags: ["boardwalk", "waterfront", "dining"],
    featured: true,
  },
];

export function getPlaceBySlug(slug: string) {
  return PLACES.find((place) => place.slug === slug) ?? null;
}