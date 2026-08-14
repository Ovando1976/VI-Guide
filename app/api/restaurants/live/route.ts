import { NextRequest, NextResponse } from "next/server";

import placesCatalog from "@/data/travel-knowledge/places.json";
import { catalogFallbackResponse } from "@/lib/api/catalog-fallback";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ISLANDS = {
  stt: [
    { label: "Charlotte Amalie", lat: 18.3419, lng: -64.9307, radius: 5000 },
    { label: "East End St Thomas", lat: 18.3268, lng: -64.8495, radius: 5000 },
    { label: "Northside St Thomas", lat: 18.3655, lng: -64.945, radius: 5000 },
    { label: "West End St Thomas", lat: 18.339, lng: -65.016, radius: 5000 },
  ],
  stj: [
    { label: "Cruz Bay St John", lat: 18.331, lng: -64.794, radius: 5000 },
    { label: "Coral Bay St John", lat: 18.345, lng: -64.714, radius: 5000 },
    { label: "North Shore St John", lat: 18.357, lng: -64.767, radius: 6000 },
  ],
  stx: [
    { label: "Christiansted St Croix", lat: 17.7466, lng: -64.7032, radius: 6000 },
    { label: "Frederiksted St Croix", lat: 17.7125, lng: -64.8838, radius: 6000 },
    { label: "Mid Island St Croix", lat: 17.733, lng: -64.79, radius: 6500 },
    { label: "East End St Croix", lat: 17.756, lng: -64.61, radius: 7000 },
    { label: "North Shore St Croix", lat: 17.77, lng: -64.78, radius: 7000 },
  ],
} as const;

type IslandCode = keyof typeof ISLANDS;
type DiscoveryKind = "restaurant" | "beach";

type CatalogPlace = {
  id?: string;
  slug?: string;
  name: string;
  island: IslandCode;
  category?: string;
  description?: string;
  heroImage?: string;
  tags?: string[];
  lat?: number;
  lng?: number;
  phone?: string;
  website?: string;
};

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  nationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
  primaryType?: string;
  types?: string[];
};

const RESTAURANT_QUERIES = [
  "restaurant",
  "Caribbean restaurant",
  "seafood restaurant",
  "cafe bakery",
  "bar and grill",
  "food truck",
  "breakfast restaurant",
  "pizza restaurant",
  "beach bar",
];

const BEACH_QUERIES = [
  "beach",
  "public beach",
  "swimming beach",
  "snorkeling beach",
  "beach park",
  "sandy beach",
  "bay beach",
];

const curatedPlaces = placesCatalog as CatalogPlace[];

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "places.businessStatus",
  "places.primaryType",
  "places.types",
].join(",");

export async function GET(request: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY;

  const requestedIsland = request.nextUrl.searchParams.get("island")?.toLowerCase();
  if (!requestedIsland || !(requestedIsland in ISLANDS)) {
    return NextResponse.json({ error: "Use island=stt, stj, or stx." }, { status: 400 });
  }

  const island = requestedIsland as IslandCode;
  if (!apiKey) return curatedRestaurantResponse(island);

  const records = new Map<string, Record<string, unknown>>();
  const failures: string[] = [];
  let restaurantCount = 0;
  let beachCount = 0;

  for (const point of ISLANDS[island]) {
    for (const query of RESTAURANT_QUERIES) {
      const places = await searchPlaces(apiKey, point, query, failures);
      for (const place of places) {
        const record = toRestaurantRecord(place, island);
        if (!record) continue;
        if (!records.has(String(record.googlePlaceId))) restaurantCount += 1;
        records.set(String(record.googlePlaceId), record);
      }
    }

    for (const query of BEACH_QUERIES) {
      const places = await searchPlaces(apiKey, point, query, failures);
      for (const place of places) {
        const record = toBeachRecord(place, island);
        if (!record) continue;
        if (!records.has(String(record.googlePlaceId))) beachCount += 1;
        records.set(String(record.googlePlaceId), record);
      }
    }
  }

  return NextResponse.json(
    {
      island,
      count: records.size,
      restaurantCount,
      beachCount,
      places: [...records.values()],
      partial: failures.length > 0,
      failures: failures.slice(0, 12),
      generatedAt: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" } },
  );
}

async function searchPlaces(
  apiKey: string,
  point: (typeof ISLANDS)[IslandCode][number],
  query: string,
  failures: string[],
): Promise<GooglePlace[]> {
  try {
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: `${query} near ${point.label}, U.S. Virgin Islands`,
        pageSize: 20,
        locationBias: {
          circle: {
            center: { latitude: point.lat, longitude: point.lng },
            radius: point.radius,
          },
        },
        languageCode: "en",
        regionCode: "VI",
      }),
      next: { revalidate: 21600 },
    });

    if (!response.ok) {
      failures.push(`${query} @ ${point.label}: ${response.status}`);
      return [];
    }

    const payload = (await response.json()) as { places?: GooglePlace[] };
    return payload.places ?? [];
  } catch (error) {
    failures.push(`${query} @ ${point.label}: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

function toRestaurantRecord(place: GooglePlace, island: IslandCode) {
  const base = validBase(place);
  if (!base || place.businessStatus === "CLOSED_PERMANENTLY") return null;
  return {
    id: `live-restaurant:${base.id}`,
    name: base.name,
    title: base.name,
    island,
    lat: base.lat,
    lng: base.lng,
    category: "food",
    type: "place",
    location: place.formattedAddress,
    description: buildRestaurantDescription(place),
    rating: place.rating,
    phone: place.nationalPhoneNumber,
    website: place.websiteUri,
    googlePlaceId: base.id,
    source: "google-places-live",
  };
}

function toBeachRecord(place: GooglePlace, island: IslandCode) {
  const base = validBase(place);
  if (!base || place.businessStatus === "CLOSED_PERMANENTLY" || !looksLikeBeach(place)) return null;
  return {
    id: `live-beach:${base.id}`,
    name: base.name,
    title: base.name,
    island,
    lat: base.lat,
    lng: base.lng,
    category: "beach",
    type: "beach",
    location: place.formattedAddress,
    description: buildBeachDescription(place),
    rating: place.rating,
    googlePlaceId: base.id,
    source: "google-places-live",
  };
}

function validBase(place: GooglePlace) {
  const id = place.id;
  const name = place.displayName?.text?.trim();
  const lat = place.location?.latitude;
  const lng = place.location?.longitude;
  if (!id || !name || typeof lat !== "number" || typeof lng !== "number") return null;
  return { id, name, lat, lng };
}

function looksLikeBeach(place: GooglePlace) {
  const text = `${place.displayName?.text ?? ""} ${place.primaryType ?? ""} ${(place.types ?? []).join(" ")}`.toLowerCase();
  if (/restaurant|hotel|resort|bar|shop|store|marina|charter|rental/.test(text) && !/beach$|beach park|public beach/.test(text)) return false;
  return /beach|shore|strand|cove|bay|point/.test(text);
}

function buildRestaurantDescription(place: GooglePlace) {
  const type = String(place.primaryType ?? "restaurant").replace(/_/g, " ");
  const reviews = typeof place.userRatingCount === "number" ? ` · ${place.userRatingCount} reviews` : "";
  return `${capitalize(type)} in the U.S. Virgin Islands${reviews}.`;
}

function buildBeachDescription(place: GooglePlace) {
  const reviews = typeof place.userRatingCount === "number" ? ` · ${place.userRatingCount} reviews` : "";
  return `Beach and shoreline destination in the U.S. Virgin Islands${reviews}.`;
}

function capitalize(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function curatedRestaurantResponse(island: IslandCode) {
  const generatedAt = new Date().toISOString();
  const places = curatedPlaces
    .filter((place) => place.island === island && isFoodPlace(place))
    .map((place) => ({
      id: place.id ?? place.slug ?? slugify(place.name),
      name: place.name,
      title: place.name,
      island,
      lat: place.lat ?? islandFallbackPoint(island).lat,
      lng: place.lng ?? islandFallbackPoint(island).lng,
      category: "food",
      type: "place",
      description:
        place.description ??
        `${place.name} is a curated dining listing in the U.S. Virgin Islands.`,
      phone: place.phone,
      website: place.website,
      googlePlaceId: place.id ?? place.slug ?? slugify(place.name),
      source: "vi-guide-curated-fallback",
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return catalogFallbackResponse(
    {
      island,
      count: places.length,
      restaurantCount: places.length,
      beachCount: 0,
      places,
    },
    "Google Places is not configured; serving curated USVI Explorer restaurant catalog.",
    generatedAt,
  );
}

function isFoodPlace(place: CatalogPlace) {
  const text = `${place.category ?? ""} ${place.name} ${(place.tags ?? []).join(" ")}`.toLowerCase();
  return /food|restaurant|cafe|bar|grill|bakery|pizza|seafood|dining/.test(text);
}

function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function islandFallbackPoint(island: IslandCode) {
  if (island === "stj") return { lat: 18.34, lng: -64.75 };
  if (island === "stx") return { lat: 17.746, lng: -64.747 };
  return { lat: 18.336, lng: -64.93 };
}
