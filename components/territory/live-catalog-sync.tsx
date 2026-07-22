"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type {
  TerritoryAction,
  TerritoryEntity,
  TerritoryEntityKind,
} from "@/types/territory";
import type { IslandCode } from "@/types/usvi";

type LivePlace = {
  id?: string;
  slug?: string;
  googlePlaceId?: string;
  name?: string;
  title?: string;
  island?: string;
  lat?: number;
  lng?: number;
  category?: string;
  type?: string;
  subtype?: string;
  location?: string;
  description?: string;
  rating?: number;
  reviewCount?: number;
  image?: string;
  heroImage?: string;
  images?: string[];
  gallery?: string[];
  website?: string;
  googleMapsUri?: string;
  verifiedAt?: string;
};

type FeedResponse = {
  places?: LivePlace[];
  supportPlaces?: LivePlace[];
};

type LiveCatalogCache = {
  version: 1;
  islands: Partial<Record<IslandCode, TerritoryEntity[]>>;
};

const LIVE_CATALOG_KEY = "vi-guide.live-territory-catalog.v1";
const SESSION_PREFIX = "vi-guide.live-territory-synced.v1";

export function LiveCatalogSync() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const island = normalizeIsland(searchParams.get("island"));

  useEffect(() => {
    const sessionKey = `${SESSION_PREFIX}.${island}`;
    if (window.sessionStorage.getItem(sessionKey) === "true") return;

    const controller = new AbortController();

    async function synchronize() {
      try {
        const [restaurantResponse, beachResponse] = await Promise.all([
          fetch(`/api/restaurants/live?island=${island}&catalogVersion=4`, {
            cache: "no-store",
            signal: controller.signal,
          }),
          fetch(`/api/beaches/live?island=${island}&catalogVersion=4`, {
            cache: "no-store",
            signal: controller.signal,
          }),
        ]);

        const restaurantPayload = restaurantResponse.ok
          ? ((await restaurantResponse.json()) as FeedResponse)
          : {};
        const beachPayload = beachResponse.ok
          ? ((await beachResponse.json()) as FeedResponse)
          : {};

        const liveEntities = dedupeEntities([
          ...(restaurantPayload.places ?? []).map((place) =>
            livePlaceToEntity(place, island, "place"),
          ),
          ...(beachPayload.places ?? []).map((place) =>
            livePlaceToEntity(place, island, "beach"),
          ),
          ...(beachPayload.supportPlaces ?? []).map((place) =>
            livePlaceToEntity(place, island, supportKind(place)),
          ),
        ].filter((entity): entity is TerritoryEntity => Boolean(entity)));

        if (!liveEntities.length) return;

        const current = readCache();
        const next: LiveCatalogCache = {
          version: 1,
          islands: {
            ...current.islands,
            [island]: liveEntities,
          },
        };

        window.localStorage.setItem(LIVE_CATALOG_KEY, JSON.stringify(next));
        window.sessionStorage.setItem(sessionKey, "true");

        const params = new URLSearchParams(searchParams.toString());
        params.set("catalogSync", String(Date.now()));
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    void synchronize();
    return () => controller.abort();
  }, [island, pathname, router, searchParams]);

  return null;
}

function livePlaceToEntity(
  place: LivePlace,
  island: IslandCode,
  kind: TerritoryEntityKind,
): TerritoryEntity | null {
  const title = place.name?.trim() || place.title?.trim();
  const lat = place.lat;
  const lng = place.lng;
  if (!title || typeof lat !== "number" || !Number.isFinite(lat) || typeof lng !== "number" || !Number.isFinite(lng)) {
    return null;
  }

  const category = normalizeCategory(place.category, kind);
  const id = place.id || `${kind}:${island}:${slugify(title)}`;
  const images = uniqueStrings([
    place.heroImage,
    place.image,
    ...(place.images ?? []),
    ...(place.gallery ?? []),
  ]);
  const actions: TerritoryAction[] = place.googleMapsUri
    ? [
        {
          id: "directions",
          label: "Directions",
          href: place.googleMapsUri,
          intent: "directions",
        },
      ]
    : [];

  return {
    id,
    slug: place.slug || id.replace(/^[^:]+:/, ""),
    kind,
    island,
    title,
    summary: place.description,
    description: place.description,
    position: { lat, lng },
    categories: uniqueStrings([category, place.subtype]),
    tags: uniqueStrings([
      kind,
      category,
      place.subtype,
      place.googlePlaceId ? "google-verified" : undefined,
    ]),
    status: "active",
    rating: place.rating,
    media: images.length ? { hero: images[0], images } : undefined,
    attributes: {
      location: place.location,
      reviewCount: place.reviewCount,
      googlePlaceId: place.googlePlaceId,
      googleMapsUri: place.googleMapsUri,
      website: place.website,
      subtype: place.subtype,
    },
    actions,
    source: {
      provider: "vi-guide-live-catalog",
      sourceId: place.googlePlaceId || id,
      updatedAt: place.verifiedAt || new Date().toISOString(),
      verified: Boolean(place.googlePlaceId),
    },
  };
}

function supportKind(place: LivePlace): TerritoryEntityKind {
  const text = `${place.category ?? ""} ${place.subtype ?? ""} ${place.type ?? ""}`.toLowerCase();
  if (/activity|watersport|snorkel|tour|attraction/.test(text)) return "activity";
  if (/transport|parking|marina|dock|boat/.test(text)) return "transport";
  return "place";
}

function normalizeCategory(value: string | undefined, kind: TerritoryEntityKind) {
  const normalized = value?.trim().toLowerCase();
  if (normalized) return normalized;
  if (kind === "beach") return "beach";
  if (kind === "transport") return "transport";
  if (kind === "activity") return "attraction";
  return "place";
}

function readCache(): LiveCatalogCache {
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(LIVE_CATALOG_KEY) ?? "null",
    ) as LiveCatalogCache | null;
    if (parsed?.version === 1 && parsed.islands) return parsed;
  } catch {
    // Start a clean cache when older data is malformed.
  }
  return { version: 1, islands: {} };
}

function dedupeEntities(entities: TerritoryEntity[]) {
  const records = new Map<string, TerritoryEntity>();
  for (const entity of entities) {
    const identity = `${entity.island}:${entity.kind}:${slugify(entity.title)}`;
    const existing = records.get(identity);
    if (!existing || scoreEntity(entity) > scoreEntity(existing)) records.set(identity, entity);
  }
  return [...records.values()];
}

function scoreEntity(entity: TerritoryEntity) {
  return (entity.media?.hero ? 10 : 0) + (entity.rating ?? 0) + (entity.source.verified ? 5 : 0);
}

function normalizeIsland(value: string | null): IslandCode {
  const normalized = value?.trim().toLowerCase();
  return normalized === "stj" || normalized === "stx" ? normalized : "stt";
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function uniqueStrings(values: Array<string | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}
