import { NextRequest, NextResponse } from "next/server";

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
  ],
  stx: [
    { label: "Christiansted St Croix", lat: 17.7466, lng: -64.7032, radius: 6000 },
    { label: "Frederiksted St Croix", lat: 17.7125, lng: -64.8838, radius: 6000 },
    { label: "Mid Island St Croix", lat: 17.733, lng: -64.79, radius: 6500 },
    { label: "East End St Croix", lat: 17.756, lng: -64.61, radius: 6000 },
  ],
} as const;

type IslandCode = keyof typeof ISLANDS;

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

const QUERIES = [
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
  if (!apiKey) {
    return NextResponse.json({ error: "Google Places is not configured." }, { status: 503 });
  }

  const requestedIsland = request.nextUrl.searchParams.get("island")?.toLowerCase();
  if (!requestedIsland || !(requestedIsland in ISLANDS)) {
    return NextResponse.json({ error: "Use island=stt, stj, or stx." }, { status: 400 });
  }

  const island = requestedIsland as IslandCode;
  const records = new Map<string, Record<string, unknown>>();
  const failures: string[] = [];

  for (const point of ISLANDS[island]) {
    for (const query of QUERIES) {
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
          continue;
        }

        const payload = (await response.json()) as { places?: GooglePlace[] };
        for (const place of payload.places ?? []) {
          const id = place.id;
          const name = place.displayName?.text?.trim();
          const lat = place.location?.latitude;
          const lng = place.location?.longitude;
          if (!id || !name || typeof lat !== "number" || typeof lng !== "number") continue;
          if (place.businessStatus === "CLOSED_PERMANENTLY") continue;

          records.set(id, {
            id: `live-restaurant:${id}`,
            name,
            title: name,
            island,
            lat,
            lng,
            category: "food",
            type: "place",
            location: place.formattedAddress,
            description: buildDescription(place),
            rating: place.rating,
            phone: place.nationalPhoneNumber,
            website: place.websiteUri,
            googlePlaceId: id,
            source: "google-places-live",
          });
        }
      } catch (error) {
        failures.push(`${query} @ ${point.label}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  return NextResponse.json(
    {
      island,
      count: records.size,
      places: [...records.values()],
      partial: failures.length > 0,
      failures: failures.slice(0, 12),
      generatedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400",
      },
    },
  );
}

function buildDescription(place: GooglePlace) {
  const type = String(place.primaryType ?? "restaurant").replace(/_/g, " ");
  const reviews = typeof place.userRatingCount === "number" ? ` · ${place.userRatingCount} reviews` : "";
  return `${capitalize(type)} in the U.S. Virgin Islands${reviews}.`;
}

function capitalize(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}
