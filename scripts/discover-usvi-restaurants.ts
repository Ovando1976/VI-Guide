import fs from "node:fs/promises";
import path from "node:path";

type IslandCode = "stt" | "stj" | "stx" | "wi";

type SearchPoint = {
  island: IslandCode;
  label: string;
  lat: number;
  lng: number;
  radiusMeters: number;
};

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  businessStatus?: string;
  primaryType?: string;
  types?: string[];
  regularOpeningHours?: unknown;
  photos?: Array<{ name?: string; authorAttributions?: unknown[] }>;
};

type RestaurantRecord = {
  id: string;
  slug: string;
  name: string;
  island: IslandCode;
  category: "restaurant";
  diningType: string;
  cuisines: string[];
  address?: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  googleMapsUri?: string;
  googlePlaceId: string;
  rating?: number;
  reviewCount?: number;
  priceLevel?: string;
  operatingStatus: "operational" | "temporarily_closed" | "permanently_closed" | "unknown";
  source: "google_places_new";
  discoveredAt: string;
  lastVerifiedAt: string;
  verificationStatus: "source_verified" | "needs_review";
  rawTypes: string[];
  photoReferences: string[];
};

const SEARCH_POINTS: SearchPoint[] = [
  { island: "stt", label: "Charlotte Amalie", lat: 18.3419, lng: -64.9307, radiusMeters: 5000 },
  { island: "stt", label: "Havensight", lat: 18.3331, lng: -64.9194, radiusMeters: 3500 },
  { island: "stt", label: "East End Red Hook", lat: 18.3268, lng: -64.8495, radiusMeters: 5000 },
  { island: "stt", label: "Northside", lat: 18.3655, lng: -64.945, radiusMeters: 5000 },
  { island: "stt", label: "West End", lat: 18.339, lng: -65.016, radiusMeters: 5000 },
  { island: "stt", label: "Southside", lat: 18.3135, lng: -64.914, radiusMeters: 4500 },
  { island: "stj", label: "Cruz Bay", lat: 18.331, lng: -64.794, radiusMeters: 5000 },
  { island: "stj", label: "Coral Bay", lat: 18.345, lng: -64.714, radiusMeters: 5000 },
  { island: "stj", label: "North Shore", lat: 18.357, lng: -64.767, radiusMeters: 5000 },
  { island: "stx", label: "Christiansted", lat: 17.7466, lng: -64.7032, radiusMeters: 6000 },
  { island: "stx", label: "Frederiksted", lat: 17.7125, lng: -64.8838, radiusMeters: 6000 },
  { island: "stx", label: "Mid Island", lat: 17.733, lng: -64.79, radiusMeters: 6500 },
  { island: "stx", label: "East End", lat: 17.756, lng: -64.61, radiusMeters: 6000 },
  { island: "wi", label: "Water Island", lat: 18.319, lng: -64.953, radiusMeters: 3500 },
];

const QUERIES = [
  "restaurant",
  "Caribbean restaurant",
  "seafood restaurant",
  "cafe",
  "bakery",
  "bar and grill",
  "food truck",
  "deli",
  "breakfast restaurant",
  "pizza restaurant",
  "hotel restaurant",
  "resort restaurant",
  "beach bar",
];

const FIELDS = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.businessStatus",
  "places.primaryType",
  "places.types",
  "places.regularOpeningHours",
  "places.photos",
  "nextPageToken",
].join(",");

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function operatingStatus(value?: string): RestaurantRecord["operatingStatus"] {
  if (value === "OPERATIONAL") return "operational";
  if (value === "CLOSED_TEMPORARILY") return "temporarily_closed";
  if (value === "CLOSED_PERMANENTLY") return "permanently_closed";
  return "unknown";
}

function diningType(types: string[]) {
  if (types.includes("cafe")) return "cafe";
  if (types.includes("bakery")) return "bakery";
  if (types.includes("bar")) return "bar_and_grill";
  if (types.includes("meal_takeaway")) return "takeout";
  return "restaurant";
}

function cuisineHints(name: string, types: string[]) {
  const text = `${name} ${types.join(" ")}`.toLowerCase();
  const matches: string[] = [];
  for (const [pattern, label] of [
    [/caribbean|west indian|island/, "Caribbean"],
    [/seafood|fish|lobster/, "Seafood"],
    [/pizza|italian/, "Italian / Pizza"],
    [/mexican|taco/, "Mexican"],
    [/asian|thai|sushi|chinese|japanese/, "Asian"],
    [/vegan|vegetarian/, "Vegetarian-friendly"],
    [/breakfast|brunch/, "Breakfast / Brunch"],
    [/barbecue|bbq|grill/, "Grill / BBQ"],
    [/bakery|pastry/, "Bakery"],
    [/cafe|coffee/, "Cafe"],
  ] as const) {
    if (pattern.test(text)) matches.push(label);
  }
  return matches;
}

async function searchNearby(apiKey: string, point: SearchPoint, query: string) {
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELDS,
    },
    body: JSON.stringify({
      textQuery: `${query} near ${point.label}, U.S. Virgin Islands`,
      pageSize: 20,
      locationBias: {
        circle: {
          center: { latitude: point.lat, longitude: point.lng },
          radius: point.radiusMeters,
        },
      },
      languageCode: "en",
      regionCode: "VI",
    }),
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${await response.text()}`);
  }

  return (await response.json()) as { places?: GooglePlace[] };
}

function toRecord(place: GooglePlace, island: IslandCode, now: string): RestaurantRecord | null {
  const id = place.id;
  const name = place.displayName?.text?.trim();
  const lat = place.location?.latitude;
  const lng = place.location?.longitude;
  if (!id || !name || typeof lat !== "number" || typeof lng !== "number") return null;
  const types = place.types ?? [];
  const status = operatingStatus(place.businessStatus);
  return {
    id: `restaurant:${id}`,
    slug: slugify(name),
    name,
    island,
    category: "restaurant",
    diningType: diningType(types),
    cuisines: cuisineHints(name, types),
    address: place.formattedAddress,
    lat,
    lng,
    phone: place.nationalPhoneNumber ?? place.internationalPhoneNumber,
    website: place.websiteUri,
    googleMapsUri: place.googleMapsUri,
    googlePlaceId: id,
    rating: place.rating,
    reviewCount: place.userRatingCount,
    priceLevel: place.priceLevel,
    operatingStatus: status,
    source: "google_places_new",
    discoveredAt: now,
    lastVerifiedAt: now,
    verificationStatus: status === "operational" ? "source_verified" : "needs_review",
    rawTypes: types,
    photoReferences: (place.photos ?? []).map((photo) => photo.name).filter((value): value is string => Boolean(value)),
  };
}

async function main() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error("Set GOOGLE_PLACES_API_KEY or GOOGLE_MAPS_API_KEY before running discovery.");

  const apply = process.argv.includes("--apply");
  const now = new Date().toISOString();
  const records = new Map<string, RestaurantRecord>();
  const failures: Array<{ island: IslandCode; area: string; query: string; error: string }> = [];

  for (const point of SEARCH_POINTS) {
    for (const query of QUERIES) {
      try {
        const result = await searchNearby(apiKey, point, query);
        for (const place of result.places ?? []) {
          const record = toRecord(place, point.island, now);
          if (record) records.set(record.googlePlaceId, record);
        }
        await new Promise((resolve) => setTimeout(resolve, 110));
      } catch (error) {
        failures.push({ island: point.island, area: point.label, query, error: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  const restaurants = [...records.values()].sort((a, b) => a.island.localeCompare(b.island) || a.name.localeCompare(b.name));
  const byIsland = restaurants.reduce<Record<string, number>>((counts, restaurant) => {
    counts[restaurant.island] = (counts[restaurant.island] ?? 0) + 1;
    return counts;
  }, {});
  const byStatus = restaurants.reduce<Record<string, number>>((counts, restaurant) => {
    counts[restaurant.operatingStatus] = (counts[restaurant.operatingStatus] ?? 0) + 1;
    return counts;
  }, {});

  const report = {
    generatedAt: now,
    mode: apply ? "apply" : "audit",
    searchPoints: SEARCH_POINTS.length,
    queryVariants: QUERIES.length,
    uniqueRestaurants: restaurants.length,
    byIsland,
    byStatus,
    missingPhone: restaurants.filter((item) => !item.phone).length,
    missingWebsite: restaurants.filter((item) => !item.website).length,
    missingPhotos: restaurants.filter((item) => item.photoReferences.length === 0).length,
    needsReview: restaurants.filter((item) => item.verificationStatus === "needs_review").length,
    failures,
  };

  const reportDir = path.resolve("reports/catalog");
  await fs.mkdir(reportDir, { recursive: true });
  await fs.writeFile(path.join(reportDir, "restaurant-discovery-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(path.join(reportDir, "restaurant-discovery-candidates.json"), `${JSON.stringify(restaurants, null, 2)}\n`);

  if (apply) {
    const outputDir = path.resolve("data/catalog");
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(path.join(outputDir, "restaurants.generated.json"), `${JSON.stringify(restaurants, null, 2)}\n`);
  }

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
