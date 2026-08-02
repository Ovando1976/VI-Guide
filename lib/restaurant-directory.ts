import generatedRestaurants from "@/data/catalog/restaurants.generated.json";
import { getTravelKnowledge } from "@/lib/travel-knowledge";
import type { DirectoryItem, DirectoryIsland } from "@/types/directory";

type GeneratedRestaurant = {
  id: string;
  slug: string;
  name: string;
  island: "stt" | "stj" | "stx" | "wi";
  diningType?: string;
  cuisines?: string[];
  address?: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  googlePlaceId?: string;
  rating?: number;
  operatingStatus?: string;
  photoReferences?: string[];
};

const FOOD_PATTERN = /restaurant|food|dining|cafe|coffee|bakery|bar|grill|bistro|eatery|kitchen|pizza|seafood|brunch|breakfast|deli|food truck/i;

const generatedItems: DirectoryItem[] = (generatedRestaurants as GeneratedRestaurant[])
  .filter((item): item is GeneratedRestaurant & { island: DirectoryIsland } => item.island !== "wi")
  .map((item) => ({
    id: item.id,
    slug: item.slug,
    name: item.name,
    island: item.island,
    category: formatCategory(item.diningType ?? "Restaurant"),
    description: buildDescription(item),
    heroImage: "/images/placeholders/restaurant-placeholder.jpg",
    imageStatus: "pending",
    lat: item.lat,
    lng: item.lng,
    tags: [
      "restaurant",
      item.diningType,
      ...(item.cuisines ?? []),
      item.operatingStatus,
    ].filter((value): value is string => Boolean(value)),
    address: item.address,
    phone: item.phone,
    website: item.website,
    googlePlaceId: item.googlePlaceId,
  }));

const existingFoodPlaces = getTravelKnowledge("places").filter((item) =>
  FOOD_PATTERN.test(
    [item.category, item.name, item.description, ...item.tags].join(" "),
  ),
);

export const RESTAURANTS: DirectoryItem[] = dedupe([
  ...generatedItems,
  ...existingFoodPlaces,
]).sort((a, b) => a.island.localeCompare(b.island) || a.name.localeCompare(b.name));

export function getRestaurantDirectory(): DirectoryItem[] {
  return RESTAURANTS;
}

export function getRestaurantItem(slug: string): DirectoryItem | undefined {
  return RESTAURANTS.find((item) => item.slug === slug || item.id === slug);
}

function buildDescription(item: GeneratedRestaurant): string {
  const cuisine = item.cuisines?.length ? `${item.cuisines.join(", ")} dining` : "Dining";
  return `${cuisine} in the U.S. Virgin Islands${item.address ? ` at ${item.address}` : ""}.`;
}

function formatCategory(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function dedupe(items: DirectoryItem[]): DirectoryItem[] {
  const records = new Map<string, DirectoryItem>();
  for (const item of items) {
    const key = `${item.island}:${normalize(item.name)}`;
    const existing = records.get(key);
    if (!existing || (!existing.googlePlaceId && item.googlePlaceId)) records.set(key, item);
  }
  return [...records.values()];
}

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
