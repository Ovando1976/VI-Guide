import stCroixRestaurants from "../../data/restaurants-st-croix.json";
import stJohnRestaurants from "../../data/restaurants-st-john.json";
import stThomasRestaurants from "../../data/restaurants-st-thomas.json";
import waterIslandRestaurants from "../../data/restaurants-water-island.json";
import { getPlacesByCategory } from "../firestore/places";
import type { IslandCode, PlaceDoc } from "../../types";

type RestaurantRecord = Record<string, unknown>;

const restaurantDataByIsland: Record<IslandCode, unknown[]> = {
  st_thomas: stThomasRestaurants as unknown[],
  st_john: stJohnRestaurants as unknown[],
  st_croix: stCroixRestaurants as unknown[],
  water_island: waterIslandRestaurants as unknown[],
};

const islandLabels: Record<IslandCode, string> = {
  st_thomas: "St. Thomas",
  st_john: "St. John",
  st_croix: "St. Croix",
  water_island: "Water Island",
};

function asText(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function asStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .slice(0, 10);
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 10);
  }

  return [];
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function normalizeRestaurantPlace(
  record: RestaurantRecord,
  islandCode: IslandCode,
  index = 0
): PlaceDoc {
  const title =
    asText(record.title) ||
    asText(record.name) ||
    asText(record.restaurantName) ||
    `Restaurant ${index + 1}`;

  const slug = asText(record.slug) || slugify(title);

  const id =
    asText(record.id) ||
    asText(record.placeId) ||
    `${islandCode}-restaurant-${slug || index}`;

  const coverImage =
    asText(record.coverImage) ||
    asText(record.image) ||
    asText(record.imageUrl) ||
    asText(record.photoUrl) ||
    asText(record.thumbnail) ||
    `/images/places/${islandCode.replace("_", "-")}/${slug}-1.jpg`;

  const description =
    asText(record.shortDescription) ||
    asText(record.description) ||
    asText(record.summary) ||
    `A local dining option on ${islandLabels[islandCode]}.`;

  return {
    ...(record as Partial<PlaceDoc>),
    id,
    title,
    slug,
    islandCode,
    island: islandCode,
    category: "restaurant",
    type: "restaurant",
    coverImage,
    shortDescription: asText(record.shortDescription, description),
    description,
    areaSlug:
      asText(record.areaSlug) ||
      asText(record.neighborhood) ||
      asText(record.area) ||
      islandCode,
    address: asText(record.address),
    priceTier: asText(record.priceTier) || asText(record.price),
    rating: asNumber(record.rating),
    tags: asStringArray(record.tags).length
      ? asStringArray(record.tags)
      : [
          asText(record.cuisine),
          asText(record.category),
          asText(record.neighborhood),
        ].filter(Boolean),
    lat: asNumber(record.lat) ?? asNumber(record.latitude),
    lng: asNumber(record.lng) ?? asNumber(record.longitude),
  } as PlaceDoc;
}

export function getLocalRestaurantPlaces(islandCode: IslandCode) {
  return (restaurantDataByIsland[islandCode] || [])
    .filter((item): item is RestaurantRecord => Boolean(item) && typeof item === "object")
    .map((record, index) => normalizeRestaurantPlace(record, islandCode, index));
}

export async function getRestaurantPlaces(islandCode: IslandCode) {
  try {
    const firestoreRestaurants = await getPlacesByCategory("restaurant", islandCode);

    if (firestoreRestaurants.length) {
      return {
        source: "firestore" as const,
        restaurants: firestoreRestaurants,
      };
    }
  } catch (error) {
    console.warn("Firestore restaurant load failed. Using local JSON fallback.", error);
  }

  return {
    source: "local-json" as const,
    restaurants: getLocalRestaurantPlaces(islandCode),
  };
}
