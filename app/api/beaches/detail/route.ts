import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FIELD_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "location",
  "rating",
  "userRatingCount",
  "businessStatus",
  "primaryType",
  "types",
  "googleMapsUri",
  "websiteUri",
  "photos",
  "editorialSummary",
  "regularOpeningHours",
  "accessibilityOptions",
].join(",");

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
  photos?: Array<{ name?: string }>;
  editorialSummary?: { text?: string };
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  accessibilityOptions?: Record<string, boolean>;
};

export async function GET(request: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Google Places is not configured." }, { status: 503 });

  const id = request.nextUrl.searchParams.get("id")?.trim();
  if (!id || !/^[A-Za-z0-9_-]{10,}$/.test(id)) {
    return NextResponse.json({ error: "A valid Google Place ID is required." }, { status: 400 });
  }

  const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    next: { revalidate: 21600 },
  });

  if (!response.ok) {
    return NextResponse.json({ error: `Beach detail request failed (${response.status}).` }, { status: response.status });
  }

  const place = (await response.json()) as GooglePlace;
  const name = place.displayName?.text?.trim();
  const lat = place.location?.latitude;
  const lng = place.location?.longitude;
  if (!name || typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json({ error: "The beach record is incomplete." }, { status: 404 });
  }

  const images = (place.photos ?? [])
    .map((photo) => photo.name)
    .filter((value): value is string => Boolean(value))
    .slice(0, 10)
    .map((photoName) => `/api/google-photo?name=${encodeURIComponent(photoName)}&maxWidth=1600&maxHeight=1200`);

  return NextResponse.json({
    id: `live-beach:${id}`,
    googlePlaceId: id,
    name,
    island: inferIsland(lat, lng),
    lat,
    lng,
    category: "beach",
    type: "beach",
    location: place.formattedAddress,
    description: place.editorialSummary?.text ?? "Beach and shoreline destination in the U.S. Virgin Islands.",
    rating: place.rating,
    reviewCount: place.userRatingCount,
    googleMapsUri: place.googleMapsUri,
    website: place.websiteUri,
    image: images[0],
    heroImage: images[0],
    images,
    hours: place.regularOpeningHours?.weekdayDescriptions ?? [],
    accessibility: place.accessibilityOptions ?? {},
    source: "google-places-live",
    verifiedAt: new Date().toISOString(),
  });
}

function inferIsland(lat: number, lng: number) {
  if (lng < -65.08 || lat < 18) return "stx";
  if (lng > -64.84) return "stj";
  return "stt";
}
