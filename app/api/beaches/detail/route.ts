import { NextRequest, NextResponse } from "next/server";

import beachCatalog from "@/data/travel-knowledge/beaches.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type IslandCode = "stt" | "stj" | "stx";

type CatalogBeach = {
  id?: string;
  slug?: string;
  name: string;
  island: IslandCode;
  description?: string;
  heroImage?: string;
  image?: string;
};

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

const CORE_FIELDS = [
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
].join(",");

const ENRICHMENT_FIELDS = [
  "editorialSummary",
  "regularOpeningHours",
  "accessibilityOptions",
].join(",");

const catalog = beachCatalog as CatalogBeach[];

export async function GET(request: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY;

  const id = request.nextUrl.searchParams.get("id")?.trim();
  if (!apiKey) return curatedBeachDetailResponse(id);

  if (!id || !/^[A-Za-z0-9_-]{10,}$/.test(id)) {
    return NextResponse.json({ error: "A valid Google Place ID is required." }, { status: 400 });
  }

  try {
    const coreResponse = await fetchPlace(id, apiKey, CORE_FIELDS);
    if (!coreResponse.ok) {
      return NextResponse.json(
        { error: `Beach detail request failed (${coreResponse.status}).` },
        { status: coreResponse.status },
      );
    }

    const core = (await coreResponse.json()) as GooglePlace;
    const name = core.displayName?.text?.trim();
    const lat = core.location?.latitude;
    const lng = core.location?.longitude;

    if (!name || typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json({ error: "The beach record is incomplete." }, { status: 404 });
    }

    let enrichment: GooglePlace = {};
    try {
      const enrichmentResponse = await fetchPlace(id, apiKey, ENRICHMENT_FIELDS);
      if (enrichmentResponse.ok) enrichment = (await enrichmentResponse.json()) as GooglePlace;
    } catch {
      // Core details are sufficient; optional enrichment must never break the page.
    }

    const place: GooglePlace = { ...core, ...enrichment };
    const island = inferIsland(place.formattedAddress, lat, lng);
    const curated = findCuratedBeach(name, island);
    const googleImages = googlePhotoUrls(place.photos ?? []);
    const curatedImage = usableLocalImage(curated?.heroImage ?? curated?.image);
    const fallbackImage = idealIslandImage(island);
    const images = uniqueStrings([
      curatedImage,
      ...googleImages,
      fallbackImage,
    ]).slice(0, 10);

    return NextResponse.json(
      {
        id: `live-beach:${id}`,
        googlePlaceId: id,
        name,
        island,
        lat,
        lng,
        category: "beach",
        type: "beach",
        location: place.formattedAddress,
        description:
          place.editorialSummary?.text?.trim() ||
          curated?.description ||
          `${name} is a verified beach destination in the U.S. Virgin Islands.`,
        rating: place.rating,
        reviewCount: place.userRatingCount,
        googleMapsUri: place.googleMapsUri,
        website: place.websiteUri,
        image: images[0],
        heroImage: images[0],
        images,
        hours: place.regularOpeningHours?.weekdayDescriptions ?? [],
        accessibility: place.accessibilityOptions ?? {},
        source: curatedImage ? "vi-guide-curated-and-google-places" : "google-places-live",
        verifiedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Beach details could not be loaded.",
      },
      { status: 502 },
    );
  }
}

function fetchPlace(id: string, apiKey: string, fieldMask: string) {
  return fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(id)}?languageCode=en&regionCode=VI`,
    {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fieldMask,
      },
      next: { revalidate: 21600 },
    },
  );
}

function googlePhotoUrls(photos: Array<{ name?: string }>) {
  return photos
    .map((photo) => photo.name)
    .filter((value): value is string => Boolean(value))
    .slice(0, 8)
    .map(
      (photoName) =>
        `/api/google-photo?name=${encodeURIComponent(photoName)}&maxWidth=1800&maxHeight=1200`,
    );
}

function findCuratedBeach(name: string, island: IslandCode) {
  const target = normalizeBeachName(name);
  return catalog.find(
    (beach) =>
      beach.island === island &&
      (normalizeBeachName(beach.name) === target ||
        normalizeBeachName(beach.name).includes(target) ||
        target.includes(normalizeBeachName(beach.name))),
  );
}

function normalizeBeachName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(public|park|st\.?\s*thomas|st\.?\s*john|usvi|u\.?s\.?\s*virgin\s*islands)\b/g, " ")
    .replace(/\bbeach\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function usableLocalImage(value?: string) {
  if (!value || value.endsWith(".svg")) return undefined;
  return value;
}

function idealIslandImage(island: IslandCode) {
  if (island === "stj") return "/images/places/st-john/trunk-bay-beach-1.jpg";
  if (island === "stt") return "/images/places/st-thomas/magens-bay-beach-1.jpg";
  return "/images/places/st-croix/cane-bay-beach-1.jpg";
}

function uniqueStrings(values: Array<string | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function inferIsland(address: string | undefined, lat: number, lng: number): IslandCode {
  const normalizedAddress = address?.toLowerCase() ?? "";
  if (/st\.?\s*john|saint john/.test(normalizedAddress)) return "stj";
  if (/st\.?\s*thomas|saint thomas|water island/.test(normalizedAddress)) return "stt";
  if (/st\.?\s*croix|saint croix/.test(normalizedAddress)) return "stx";
  if (lat < 18) return "stx";
  if (lng > -64.8) return "stj";
  return "stt";
}

function curatedBeachDetailResponse(id: string | undefined) {
  if (!id || !/^[A-Za-z0-9_-]{2,}$/.test(id)) {
    return NextResponse.json({ error: "A valid beach ID is required." }, { status: 400 });
  }

  const curated = catalog.find((beach) => beach.id === id || beach.slug === id);
  if (!curated) {
    return NextResponse.json({ error: "Beach details were not found in the curated catalog." }, { status: 404 });
  }

  const island = curated.island;
  const image = usableLocalImage(curated.heroImage ?? curated.image) ?? idealIslandImage(island);

  return NextResponse.json(
    {
      id: curated.id ?? curated.slug ?? id,
      googlePlaceId: curated.id ?? curated.slug ?? id,
      name: curated.name,
      island,
      lat: islandFallbackPoint(island).lat,
      lng: islandFallbackPoint(island).lng,
      category: "beach",
      type: "beach",
      description:
        curated.description ??
        `${curated.name} is a curated beach destination in the U.S. Virgin Islands.`,
      image,
      heroImage: image,
      images: [image],
      hours: [],
      accessibility: {},
      source: "vi-guide-curated-fallback",
      liveData: false,
      fallbackReason: "Google Places is not configured; serving curated USVI Explorer beach details.",
      verifiedAt: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
  );
}

function islandFallbackPoint(island: IslandCode) {
  if (island === "stj") return { lat: 18.34, lng: -64.75 };
  if (island === "stx") return { lat: 17.746, lng: -64.747 };
  return { lat: 18.336, lng: -64.93 };
}
