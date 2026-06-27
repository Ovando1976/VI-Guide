import type {
  BeachDoc,
  EventDoc,
  IslandCode,
  PlaceCategory,
  PlaceDoc,
} from "../../types";
import type { Business } from "../../types/business";
import type {
  DiscoveryKind,
  DiscoverySource,
  UnifiedDiscoveryItem,
  UnifiedDiscoveryOptions,
} from "../../types/discovery";

import {
  geographicIndexItems,
  type GeographicIndexItem,
} from "../../data/core/geographicIndex";

import { getBusinesses } from "../firestore/businesses";
import { getBeachesByIsland } from "../firestore/beaches";
import { getPlacesByCategory } from "../firestore/places";
import { getUpcomingEvents } from "../firestore/events";

const DEFAULT_PLACE_CATEGORIES: PlaceCategory[] = [
  "restaurant",
  "shopping",
  "attraction",
  "excursion",
  "provisioning",
];

const DEFAULT_OPTIONS: Required<Omit<UnifiedDiscoveryOptions, "island">> = {
  includeBusinesses: true,
  includePlaces: true,
  includeBeaches: true,
  includeEvents: true,
  includeGeographicIndex: true,
  placeLimitPerCategory: 50,
};

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

export function slugify(value: unknown): string {
  return clean(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeIsland(value?: unknown): IslandCode | undefined {
  const text = clean(value).toLowerCase();

  if (["st_thomas", "st thomas", "stt", "saint thomas"].includes(text)) return "st_thomas";
  if (["st_john", "st john", "stj", "saint john"].includes(text)) return "st_john";
  if (["st_croix", "st croix", "stx", "saint croix"].includes(text)) return "st_croix";
  if (["water_island", "water island", "wat"].includes(text)) return "water_island";

  return undefined;
}

function validCoords(coords: unknown): { lat: number; lng: number } | undefined {
  if (!coords || typeof coords !== "object") return undefined;

  const value = coords as { lat?: unknown; lng?: unknown };
  const lat = Number(value.lat);
  const lng = Number(value.lng);

  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : undefined;
}

function makeStableKey(input: {
  island?: IslandCode;
  name: string;
  estate?: string;
  coordinates?: { lat: number; lng: number };
}) {
  const island = input.island || "unknown";
  const name = slugify(input.name);
  const estate = slugify(input.estate || "");

  if (input.coordinates) {
    const lat = input.coordinates.lat.toFixed(4);
    const lng = input.coordinates.lng.toFixed(4);
    return `${island}:${name}:${lat}:${lng}`;
  }

  return `${island}:${name}:${estate || "no-estate"}`;
}

function searchTextFor(item: Partial<UnifiedDiscoveryItem>) {
  return [
    item.name,
    item.title,
    item.kind,
    item.type,
    item.category,
    item.island,
    item.estate,
    item.address,
    item.description,
    item.phone,
    item.email,
    item.website,
    ...(item.tags ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function kindFromGeoSource(item: GeographicIndexItem): DiscoveryKind {
  if (item.source === "estate") return "estate";
  if (item.source === "dictionary") return "dictionary";
  if (item.source === "historicSite") return "historic_site";
  if (item.source === "beach") return "beach";
  if (item.source === "restaurant" || item.source === "shopping") return "place";
  if (item.source === "transportation") return "transportation";
  return "place";
}

function sourceFromGeo(item: GeographicIndexItem): DiscoverySource {
  if (item.source === "estate") return "estate";
  if (item.source === "dictionary") return "dictionary";
  if (item.source === "historicSite") return "historic_site";
  return "geographic_index";
}

function baseItem(input: {
  id: string;
  source: DiscoverySource;
  name: string;
  kind: DiscoveryKind;
  island?: IslandCode;
  estate?: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
  description?: string;
  imageUrl?: string;
  coverImage?: string;
  thumbnailUrl?: string;
  tags?: string[];
  type?: string;
  category?: string;
  raw?: unknown;
}): UnifiedDiscoveryItem {
  const slug = slugify(input.name || input.id);
  const stableKey = makeStableKey({
    island: input.island,
    name: input.name,
    estate: input.estate,
    coordinates: input.coordinates,
  });

  const item: UnifiedDiscoveryItem = {
    id: input.id,
    stableKey,
    source: input.source,
    sources: [input.source],
    name: input.name,
    title: input.name,
    slug,
    kind: input.kind,
    type: input.type,
    category: input.category,
    island: input.island,
    estate: input.estate,
    address: input.address,
    description: input.description,
    imageUrl: input.imageUrl,
    coverImage: input.coverImage,
    thumbnailUrl: input.thumbnailUrl,
    tags: input.tags ?? [],
    coordinates: input.coordinates,
    revenueEligible: false,
    leadEligible: false,
    bookingEligible: false,
    mobilityEligible: Boolean(input.coordinates || input.estate),
    mapEligible: Boolean(input.coordinates),
    searchText: "",
    raw: input.raw ? [input.raw] : [],
  };

  item.searchText = searchTextFor(item);
  return item;
}

function businessToDiscovery(business: Business): UnifiedDiscoveryItem {
  const item = baseItem({
    id: business.id,
    source: "firestore_business",
    name: business.name,
    kind: "business",
    island: normalizeIsland(business.island),
    estate: business.estate,
    address: business.address,
    coordinates: validCoords(business.coordinates),
    description: business.description,
    imageUrl: business.imageUrl,
    tags: business.tags,
    type: "business",
    category: business.category,
    raw: business,
  });

  item.businessId = business.id;
  item.phone = business.phone;
  item.email = business.email;
  item.website = business.website;
  item.featured = business.featured;
  item.premium = business.premium;
  item.verified = business.verified;
  item.claimStatus = business.claimStatus;

  item.revenueEligible = true;
  item.leadEligible = true;
  item.bookingEligible = [
    "restaurant",
    "hotel",
    "villa",
    "car_rental",
    "taxi",
    "tour",
    "charter",
    "fishing",
    "dive_shop",
    "watersports",
    "transportation",
    "marina",
    "ferry",
    "airport",
    "cruise_port",
    "marine_service",
  ].includes(business.category);

  item.leadSource = "directory";
  item.searchText = searchTextFor(item);

  return item;
}

function beachToDiscovery(beach: BeachDoc): UnifiedDiscoveryItem {
  const loose = beach as BeachDoc & {
    id?: string;
    name?: string;
    title?: string;
    island?: string;
    islandCode?: string;
    estate?: string;
    imageUrl?: string;
    coverImage?: string;
    tags?: string[];
  };

  const name = loose.title || loose.name || loose.id || "Unnamed Beach";
  const id = loose.id || slugify(name);

  const item = baseItem({
    id,
    source: "firestore_beach",
    name,
    kind: "beach",
    island: normalizeIsland(loose.islandCode || loose.island),
    estate: loose.estate,
    coordinates: validCoords(beach.coordinates),
    description: beach.description,
    imageUrl: loose.imageUrl,
    coverImage: loose.coverImage,
    tags: loose.tags,
    type: "beach",
    category: "beach",
    raw: beach,
  });

  item.beachId = id;
  item.leadEligible = false;
  item.bookingEligible = false;
  item.searchText = searchTextFor(item);

  return item;
}

function placeToDiscovery(place: PlaceDoc): UnifiedDiscoveryItem {
  const name = String(place.title || (place as any).name || place.id || "Place");

  const item = baseItem({
    id: place.id,
    source: "firestore_place",
    name,
    kind: "place",
    island: normalizeIsland(place.islandCode || ("island" in place ? place.island : undefined)),
    estate: (place as any).estate,
    coordinates: validCoords(place.coordinates),
    description: place.description,
    imageUrl: (place as any).imageUrl,
    coverImage: place.coverImage,
    tags: place.tags,
    type: (place as any).type || place.category,
    category: place.category,
    raw: place,
  });

  item.placeId = place.id;
  item.leadEligible = ["restaurant", "excursion", "provisioning", "shopping"].includes(
    String(place.category),
  );
  item.bookingEligible = ["restaurant", "excursion"].includes(String(place.category));
  item.searchText = searchTextFor(item);

  return item;
}

function eventToDiscovery(event: EventDoc): UnifiedDiscoveryItem {
  const name = String(
    ("title" in event && event.title) ||
      ("name" in event && event.name) ||
      event.id ||
      "Untitled event",
  );

  const item = baseItem({
    id: event.id,
    source: "firestore_event",
    name,
    kind: "event",
    island: normalizeIsland(("islandCode" in event && event.islandCode) || ("island" in event && event.island)),
    coordinates: validCoords(event.coordinates),
    description: event.description,
    imageUrl: "imageUrl" in event ? String(event.imageUrl || "") : undefined,
    coverImage: "coverImage" in event ? event.coverImage : undefined,
    tags: event.tags,
    type: "event",
    category: "event",
    raw: event,
  });

  item.eventId = event.id;
  item.bookingEligible = true;
  item.searchText = searchTextFor(item);

  return item;
}

function geoToDiscovery(item: GeographicIndexItem): UnifiedDiscoveryItem {
  const kind = kindFromGeoSource(item);
  const source = sourceFromGeo(item);

  const discovery = baseItem({
    id: item.id,
    source,
    name: item.name || item.estateName || item.id,
    kind,
    island: normalizeIsland(item.island),
    estate: item.estateName,
    coordinates: validCoords(item.coordinates),
    description: item.description,
    tags: item.tags,
    type: item.type || item.source,
    category: item.category || item.source,
    raw: item,
  });

  if (kind === "estate") discovery.estateId = item.estateId || item.id;
  if (kind === "dictionary") discovery.dictionaryId = item.id;
  if (kind === "historic_site") discovery.historicSiteId = item.id;

  discovery.leadEligible = false;
  discovery.bookingEligible = kind === "historic_site" || kind === "beach";
  discovery.searchText = [discovery.searchText, item.searchText].join(" ").toLowerCase();

  return discovery;
}

function mergeDiscoveryItems(existing: UnifiedDiscoveryItem, incoming: UnifiedDiscoveryItem) {
  const sources = Array.from(new Set([...existing.sources, ...incoming.sources]));

  const merged: UnifiedDiscoveryItem = {
    ...existing,
    sources,
    source: existing.source,
    description: existing.description || incoming.description,
    imageUrl: existing.imageUrl || incoming.imageUrl,
    coverImage: existing.coverImage || incoming.coverImage,
    thumbnailUrl: existing.thumbnailUrl || incoming.thumbnailUrl,
    coordinates: existing.coordinates || incoming.coordinates,
    estate: existing.estate || incoming.estate,
    address: existing.address || incoming.address,
    phone: existing.phone || incoming.phone,
    email: existing.email || incoming.email,
    website: existing.website || incoming.website,
    businessId: existing.businessId || incoming.businessId,
    placeId: existing.placeId || incoming.placeId,
    beachId: existing.beachId || incoming.beachId,
    eventId: existing.eventId || incoming.eventId,
    estateId: existing.estateId || incoming.estateId,
    dictionaryId: existing.dictionaryId || incoming.dictionaryId,
    historicSiteId: existing.historicSiteId || incoming.historicSiteId,
    featured: existing.featured || incoming.featured,
    premium: existing.premium || incoming.premium,
    verified: existing.verified || incoming.verified,
    revenueEligible: existing.revenueEligible || incoming.revenueEligible,
    leadEligible: existing.leadEligible || incoming.leadEligible,
    bookingEligible: existing.bookingEligible || incoming.bookingEligible,
    mobilityEligible: existing.mobilityEligible || incoming.mobilityEligible,
    mapEligible: existing.mapEligible || incoming.mapEligible,
    tags: Array.from(new Set([...(existing.tags ?? []), ...(incoming.tags ?? [])])),
    raw: [...(existing.raw ?? []), ...(incoming.raw ?? [])],
    searchText: "",
  };

  if (incoming.revenueEligible && !existing.revenueEligible) {
    merged.id = incoming.id;
    merged.source = incoming.source;
    merged.kind = incoming.kind;
    merged.type = incoming.type || existing.type;
    merged.category = incoming.category || existing.category;
    merged.slug = incoming.slug || existing.slug;
    merged.name = incoming.name || existing.name;
    merged.title = incoming.title || existing.title;
  }

  merged.searchText = searchTextFor(merged);

  return merged;
}

export async function getUnifiedDiscoveryItems(
  options: UnifiedDiscoveryOptions = {},
): Promise<UnifiedDiscoveryItem[]> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const island = options.island;

  const items: UnifiedDiscoveryItem[] = [];

  if (config.includeBusinesses) {
    const businesses = await getBusinesses().catch(() => []);
    items.push(
      ...businesses
        .filter((business) => !island || normalizeIsland(business.island) === island)
        .map(businessToDiscovery),
    );
  }

  if (config.includeBeaches && island) {
    const beaches = await getBeachesByIsland(island).catch(() => []);
    items.push(...beaches.map(beachToDiscovery));
  }

  if (config.includePlaces && island) {
    const placeResults = await Promise.allSettled(
      DEFAULT_PLACE_CATEGORIES.map((category) =>
        getPlacesByCategory(category, island, config.placeLimitPerCategory),
      ),
    );

    placeResults.forEach((result) => {
      if (result.status === "fulfilled") {
        items.push(...result.value.map(placeToDiscovery));
      }
    });
  }

  if (config.includeEvents && island) {
    const events = await getUpcomingEvents(island).catch(() => []);
    items.push(...events.map(eventToDiscovery));
  }

  if (config.includeGeographicIndex) {
    items.push(
      ...geographicIndexItems
        .filter((item) => !island || normalizeIsland(item.island) === island)
        .map(geoToDiscovery),
    );
  }

  const merged = new Map<string, UnifiedDiscoveryItem>();

  for (const item of items) {
    const existing = merged.get(item.stableKey);
    merged.set(item.stableKey, existing ? mergeDiscoveryItems(existing, item) : item);
  }

  return Array.from(merged.values()).sort((a, b) => {
    const aScore =
      (a.premium ? 100 : 0) +
      (a.featured ? 50 : 0) +
      (a.revenueEligible ? 20 : 0) +
      (a.coordinates ? 5 : 0);

    const bScore =
      (b.premium ? 100 : 0) +
      (b.featured ? 50 : 0) +
      (b.revenueEligible ? 20 : 0) +
      (b.coordinates ? 5 : 0);

    return bScore - aScore || a.name.localeCompare(b.name);
  });
}

export function filterUnifiedDiscovery(
  items: UnifiedDiscoveryItem[],
  query: string,
): UnifiedDiscoveryItem[] {
  const value = query.trim().toLowerCase();
  if (!value) return items;

  return items.filter((item) => item.searchText.includes(value));
}