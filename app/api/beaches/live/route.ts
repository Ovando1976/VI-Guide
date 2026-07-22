import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ISLANDS = {
  stt: {
    label: "St. Thomas",
    bounds: { minLat: 18.285, maxLat: 18.39, minLng: -65.07, maxLng: -64.815 },
    searches: [
      { label: "St Thomas", lat: 18.336, lng: -64.93, radius: 12500 },
      { label: "East End St Thomas", lat: 18.3268, lng: -64.8495, radius: 6500 },
      { label: "West End St Thomas", lat: 18.339, lng: -65.016, radius: 6500 },
      { label: "Northside St Thomas", lat: 18.3655, lng: -64.945, radius: 6500 },
    ],
  },
  stj: {
    label: "St. John",
    bounds: { minLat: 18.295, maxLat: 18.39, minLng: -64.87, maxLng: -64.64 },
    searches: [
      { label: "St John", lat: 18.34, lng: -64.75, radius: 10500 },
      { label: "North Shore St John", lat: 18.357, lng: -64.767, radius: 6000 },
      { label: "Coral Bay St John", lat: 18.345, lng: -64.714, radius: 6000 },
    ],
  },
  stx: {
    label: "St. Croix",
    bounds: { minLat: 17.67, maxLat: 17.82, minLng: -64.96, maxLng: -64.53 },
    searches: [
      { label: "St Croix", lat: 17.746, lng: -64.747, radius: 22000 },
      { label: "East End St Croix", lat: 17.756, lng: -64.61, radius: 9000 },
      { label: "West End St Croix", lat: 17.7125, lng: -64.8838, radius: 9000 },
      { label: "North Shore St Croix", lat: 17.77, lng: -64.78, radius: 9000 },
    ],
  },
} as const;

type IslandCode = keyof typeof ISLANDS;

type GooglePhoto = { name?: string };
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

type BeachRecord = {
  id: string;
  slug: string;
  name: string;
  title: string;
  island: IslandCode;
  lat: number;
  lng: number;
  category: "beach";
  type: "beach";
  location?: string;
  description: string;
  rating?: number;
  reviewCount?: number;
  googlePlaceId: string;
  googleMapsUri?: string;
  website?: string;
  image?: string;
  heroImage?: string;
  images: string[];
  hours: string[];
  accessibility: Record<string, boolean>;
  amenities: string[];
  tags: string[];
  verificationStatus: "verified-beach";
  verifiedAt: string;
  source: "google-places-live";
};

const QUERIES = ["public beach", "beach park", "swimming beach", "snorkeling beach", "sandy beach"];

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
  const config = ISLANDS[island];
  const candidates: BeachRecord[] = [];
  const failures: string[] = [];
  const rejected: Array<{ name: string; reason: string }> = [];
  const verifiedAt = new Date().toISOString();

  for (const point of config.searches) {
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

          const reason = rejectionReason(place, config.bounds);
          if (reason) {
            rejected.push({ name, reason });
            continue;
          }

          const photos = (place.photos ?? [])
            .map((photo) => photo.name)
            .filter((value): value is string => Boolean(value))
            .slice(0, 8)
            .map((photoName) => `/api/google-photo?name=${encodeURIComponent(photoName)}&maxWidth=1600&maxHeight=1100`);

          candidates.push({
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
            description: place.editorialSummary?.text?.trim() || buildDescription(place, config.label),
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
            verificationStatus: "verified-beach",
            verifiedAt,
            source: "google-places-live",
          });
        }
      } catch (error) {
        failures.push(`${query} @ ${point.label}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  const beaches = dedupeBeaches(candidates);

  return NextResponse.json(
    {
      island,
      count: beaches.length,
      places: beaches,
      partial: failures.length > 0,
      failures: failures.slice(0, 12),
      rejectedCount: rejected.length,
      methodology: "Explicit beach names or Google beach classification, hard island bounds, business exclusion, and spatial/name deduplication.",
      generatedAt: verifiedAt,
    },
    { headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" } },
  );
}

function rejectionReason(
  place: GooglePlace,
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number },
): string | null {
  const name = place.displayName?.text?.trim() ?? "";
  const lowerName = name.toLowerCase();
  const typeText = `${place.primaryType ?? ""} ${(place.types ?? []).join(" ")}`.toLowerCase();
  const lat = place.location?.latitude;
  const lng = place.location?.longitude;

  if (typeof lat !== "number" || typeof lng !== "number") return "missing coordinates";
  if (lat < bounds.minLat || lat > bounds.maxLat || lng < bounds.minLng || lng > bounds.maxLng) return "outside selected island bounds";

  const explicitBeachName = /\bbeach\b|\bstrand\b/.test(lowerName);
  const googleBeachType = /(^|_)beach($|_)/.test(typeText);
  if (!explicitBeachName && !googleBeachType) return "not explicitly identified as a beach";

  const businessWords = /restaurant|bar|grill|cafe|hotel|resort|villa|condo|shop|store|marina|charter|rental|club|spa|wedding|apartments?/;
  if (businessWords.test(lowerName) || businessWords.test(typeText)) {
    if (!/\bbeach\b/.test(lowerName) || businessWords.test(typeText)) return "business or lodging rather than a beach";
  }

  return null;
}

function dedupeBeaches(candidates: BeachRecord[]): BeachRecord[] {
  const sorted = [...candidates].sort((a, b) => scoreBeach(b) - scoreBeach(a));
  const accepted: BeachRecord[] = [];

  for (const candidate of sorted) {
    const normalized = normalizeBeachName(candidate.name);
    const duplicate = accepted.find((existing) => {
      const sameName = normalizeBeachName(existing.name) === normalized;
      const nearby = distanceMeters(existing.lat, existing.lng, candidate.lat, candidate.lng) <= 220;
      return sameName || (nearby && namesOverlap(existing.name, candidate.name));
    });
    if (!duplicate) accepted.push(candidate);
  }

  return accepted.sort((a, b) => a.name.localeCompare(b.name));
}

function scoreBeach(beach: BeachRecord) {
  return (beach.image ? 5 : 0) + (beach.rating ?? 0) + Math.min((beach.reviewCount ?? 0) / 100, 5);
}

function normalizeBeachName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(public|park|st\.?\s*thomas|st\.?\s*john|st\.?\s*croix|u\.?s\.?v\.?i\.?|usvi)\b/g, " ")
    .replace(/\bbeach\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function namesOverlap(a: string, b: string) {
  const left = new Set(normalizeBeachName(a).split(/\s+/).filter(Boolean));
  const right = new Set(normalizeBeachName(b).split(/\s+/).filter(Boolean));
  if (!left.size || !right.size) return false;
  const shared = [...left].filter((token) => right.has(token)).length;
  return shared / Math.min(left.size, right.size) >= 0.6;
}

function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6_371_000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildDescription(place: GooglePlace, islandLabel: string) {
  const reviews = typeof place.userRatingCount === "number" ? ` It has ${place.userRatingCount.toLocaleString()} Google reviews.` : "";
  return `${place.displayName?.text ?? "This beach"} is a verified beach destination on ${islandLabel}.${reviews}`;
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
