import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ISLANDS = {
  stt: [
    { label: "St Thomas", lat: 18.336, lng: -64.93, radius: 12500 },
    { label: "East End St Thomas", lat: 18.3268, lng: -64.8495, radius: 6500 },
    { label: "West End St Thomas", lat: 18.339, lng: -65.016, radius: 6500 },
    { label: "Northside St Thomas", lat: 18.3655, lng: -64.945, radius: 6500 },
  ],
  stj: [
    { label: "St John", lat: 18.34, lng: -64.75, radius: 10500 },
    { label: "North Shore St John", lat: 18.357, lng: -64.767, radius: 6000 },
    { label: "Coral Bay St John", lat: 18.345, lng: -64.714, radius: 6000 },
  ],
  stx: [
    { label: "St Croix", lat: 17.746, lng: -64.747, radius: 22000 },
    { label: "East End St Croix", lat: 17.756, lng: -64.61, radius: 9000 },
    { label: "West End St Croix", lat: 17.7125, lng: -64.8838, radius: 9000 },
    { label: "North Shore St Croix", lat: 17.77, lng: -64.78, radius: 9000 },
  ],
} as const;

type IslandCode = keyof typeof ISLANDS;

type GooglePhoto = { name?: string; widthPx?: number; heightPx?: number };
type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
  primaryType?: string;
  types?: string[];
  googleMapsUri?: string;
  websiteUri?: string;
  photos?: GooglePhoto[];
  editorialSummary?: { text?: string };
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  accessibilityOptions?: Record<string, boolean>;
};

const QUERIES = [
  "beach",
  "public beach",
  "swimming beach",
  "snorkeling beach",
  "sandy beach",
  "beach park",
  "bay beach",
  "shoreline access",
];

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.businessStatus",
  "places.primaryType",
  "places.types",
  "places.googleMapsUri",
  "places.websiteUri",
  "places.photos",
  "places.editorialSummary",
  "places.regularOpeningHours",
  "places.accessibilityOptions",
].join(",");

export async function GET(request: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Google Places is not configured." }, { status: 503 });

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
          if (!looksLikeBeach(place)) continue;

          const photos = (place.photos ?? [])
            .map((photo) => photo.name)
            .filter((value): value is string => Boolean(value))
            .slice(0, 8)
            .map((name) => `/api/google-photo?name=${encodeURIComponent(name)}&maxWidth=1400&maxHeight=1000`);

          records.set(id, {
            id: `live-beach:${id}`,
            slug: slugify(name),
            name,
            title: name,
            island,
            lat,
            lng,
            category: "beach",
            type: "beach",
            location: place.formattedAddress,
            description: place.editorialSummary?.text ?? buildDescription(place),
            rating: place.rating,
            reviewCount: place.userRatingCount,
            googlePlaceId: id,
            googleMapsUri: place.googleMapsUri,
            website: place.websiteUri,
            image: photos[0],
            heroImage: photos[0],
            images: photos,
            hours: place.regularOpeningHours?.weekdayDescriptions ?? [],
            accessibility: place.accessibilityOptions ?? {},
            amenities: inferAmenities(place),
            tags: inferTags(place),
            verificationStatus: "google_places_live",
            verifiedAt: new Date().toISOString(),
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
    { headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" } },
  );
}

function looksLikeBeach(place: GooglePlace) {
  const text = `${place.displayName?.text ?? ""} ${place.primaryType ?? ""} ${(place.types ?? []).join(" ")}`.toLowerCase();
  if (/restaurant|hotel|resort|bar|shop|store|marina|charter|rental/.test(text) && !/beach$|beach park|public beach/.test(text)) return false;
  return /beach|shore|strand|cove|bay|point/.test(text);
}

function buildDescription(place: GooglePlace) {
  const reviews = typeof place.userRatingCount === "number" ? ` · ${place.userRatingCount} reviews` : "";
  return `Beach and shoreline destination in the U.S. Virgin Islands${reviews}.`;
}

function inferAmenities(place: GooglePlace) {
  const text = `${place.displayName?.text ?? ""} ${(place.types ?? []).join(" ")}`.toLowerCase();
  return [
    /park/.test(text) ? "Beach park" : null,
    /snorkel|reef/.test(text) ? "Snorkeling" : null,
    /swim/.test(text) ? "Swimming" : null,
    /public/.test(text) ? "Public access" : null,
  ].filter((value): value is string => Boolean(value));
}

function inferTags(place: GooglePlace) {
  const text = `${place.displayName?.text ?? ""} ${(place.types ?? []).join(" ")}`.toLowerCase();
  return [
    "beach",
    /cove/.test(text) ? "cove" : null,
    /bay/.test(text) ? "bay" : null,
    /point/.test(text) ? "point" : null,
    /park/.test(text) ? "park" : null,
  ].filter((value): value is string => Boolean(value));
}

function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
