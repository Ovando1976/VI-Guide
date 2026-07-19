import type { EstateRecord } from "@/types/usvi";
import type {
  TerritoryEntity,
  TerritoryEntityKind,
  TerritoryMapPlace,
} from "@/types/territory";
import type { AccommodationRecord } from "@/types/accommodation";
import { resolveCoordinate } from "./coordinates";

export type TravelKnowledgeRecord = {
  id: string;
  slug?: string;
  name: string;
  island: "stt" | "stj" | "stx";
  category?: string;
  description?: string;
  shortDescription?: string;
  heroImage?: string;
  images?: string[];
  tags?: string[];
  featured?: boolean;
  rating?: number;
  lat?: number;
  lng?: number;
  location?: string;
  bestFor?: string[];
  [key: string]: unknown;
};

export function estateToTerritoryEntity(estate: EstateRecord): TerritoryEntity {
  return {
    id: `estate:${estate.geoid}`,
    slug: estate.geoid,
    kind: "estate",
    island: estate.island,
    title: estate.baseName,
    summary: estate.description.short ?? undefined,
    description: estate.description.long ?? undefined,
    position: estate.internalPoint,
    geometry: estate.geometry ?? null,
    estateGeoid: estate.geoid,
    categories: ["estate"],
    tags: [estate.county, estate.estateCode].filter((value): value is string =>
      Boolean(value)
    ),
    status: "active",
    attributes: {
      geoid: estate.geoid,
      fullName: estate.fullName,
      county: estate.county,
      roadContext: estate.roadContext,
      descriptionSource: estate.description.source,
    },
    actions: [
      { id: "explore", label: "Explore estate", intent: "open" },
      { id: "pickup", label: "Set pickup", intent: "ride" },
      { id: "destination", label: "Set destination", intent: "directions" },
    ],
    source: {
      provider: estate.description.source ?? "territory-estate-registry",
      sourceId: estate.geoid,
      verified: true,
    },
  };
}

export function travelKnowledgeToTerritoryEntity(
  record: TravelKnowledgeRecord,
  kindOverride?: TerritoryEntityKind
): TerritoryEntity {
  const coordinate = resolveCoordinate(
    record.island,
    record.slug ?? record.id,
    record
  );
  const category = String(
    record.category ?? kindOverride ?? "place"
  ).toLowerCase();
  const kind = kindOverride ?? categoryToKind(category);
  const excluded = new Set([
    "id",
    "slug",
    "name",
    "island",
    "category",
    "description",
    "shortDescription",
    "heroImage",
    "images",
    "tags",
    "featured",
    "rating",
    "lat",
    "lng",
    "location",
  ]);
  const attributes = Object.fromEntries(
    Object.entries(record).filter(([key]) => !excluded.has(key))
  );

  return {
    id: `${kind}:${record.id}`,
    slug: record.slug ?? record.id,
    kind,
    island: record.island,
    title: record.name,
    summary: record.shortDescription ?? record.description,
    description: record.description ?? record.shortDescription,
    position: coordinate.position,
    categories: [...new Set([category, kind])],
    tags: [...new Set(record.tags ?? [])],
    status: "active",
    rating: record.rating,
    media: { hero: record.heroImage, images: record.images },
    attributes: {
      ...attributes,
      location: record.location,
      featured: Boolean(record.featured),
    },
    actions: defaultPlaceActions(record.slug ?? record.id),
    source: {
      provider: coordinate.record?.provider ?? "vi-guide-travel-knowledge",
      sourceId: coordinate.record?.placeId ?? record.id,
      updatedAt: coordinate.record?.resolvedAt,
      verified: Boolean(
        coordinate.record && coordinate.record.confidence >= 0.82
      ),
    },
  };
}

export function accommodationToTerritoryEntity(
  record: AccommodationRecord
): TerritoryEntity {
  const coordinate = resolveCoordinate(
    record.island,
    record.slug ?? record.id,
    record
  );
  return {
    id: `stay:${record.id}`,
    slug: record.slug ?? record.id,
    kind: "stay",
    island: record.island,
    title: record.name,
    summary: record.description,
    description: record.description,
    position: coordinate.position,
    categories: [record.category, "stay"],
    tags: [...new Set(record.tags ?? [])],
    status: "active",
    rating: record.rating,
    media: { hero: record.heroImage ?? record.image, images: record.images },
    attributes: {
      location: record.location,
      address: record.address,
      phone: record.phone,
      website: record.website,
      amenities: record.amenities,
      bestFor: record.bestFor,
      priceTier: record.priceTier,
      verificationStatus: record.verificationStatus,
    },
    actions: [
      {
        id: "open",
        label: "View stay",
        href: `/accommodations/${record.slug ?? record.id}`,
        intent: "open",
      },
      { id: "directions", label: "Directions", intent: "directions" },
      { id: "save", label: "Add to trip", intent: "save" },
      { id: "book", label: "Check stay", intent: "book" },
    ],
    source: {
      provider:
        coordinate.record?.provider ??
        record.sourceLabel ??
        "vi-guide-accommodations",
      sourceId: coordinate.record?.placeId ?? record.id,
      updatedAt: coordinate.record?.resolvedAt ?? record.verifiedAt,
      verified: Boolean(
        coordinate.record && coordinate.record.confidence >= 0.82
      ),
    },
  };
}

export function territoryEntityToMapPlace(
  entity: TerritoryEntity
): TerritoryMapPlace {
  return {
    id: entity.id,
    name: entity.title,
    island: entity.island,
    lat: entity.position?.lat,
    lng: entity.position?.lng,
    // EstateMap and ExplorerMapScreen still consume the legacy display
    // categories. Keep the unified entity kind as `type`, but translate the
    // category so Beaches, Stays, and Historic lenses can match correctly.
    category: mapDisplayCategory(entity.kind),
    type: entity.kind,
    location:
      typeof entity.attributes.location === "string"
        ? entity.attributes.location
        : undefined,
    description: entity.summary ?? entity.description,
    rating: entity.rating,
    image: entity.media?.hero,
  };
}

function mapDisplayCategory(
  kind: TerritoryEntityKind
): TerritoryMapPlace["category"] {
  if (kind === "beach") return "Beach";
  if (kind === "stay") return "Hotel";
  if (kind === "historic") return "Landmark";
  if (kind === "transport") return "Transit";
  return "Place";
}

function categoryToKind(category: string): TerritoryEntityKind {
  if (category.includes("beach")) return "beach";
  if (category.includes("historic") || category.includes("landmark"))
    return "historic";
  if (
    category.includes("hotel") ||
    category.includes("stay") ||
    category.includes("villa")
  )
    return "stay";
  if (
    category.includes("ferry") ||
    category.includes("taxi") ||
    category.includes("transit")
  )
    return "transport";
  if (category.includes("event")) return "event";
  if (category.includes("service")) return "service";
  return "place";
}

function defaultPlaceActions(slug: string) {
  return [
    {
      id: "open",
      label: "Explore",
      href: `/places/${slug}`,
      intent: "open" as const,
    },
    { id: "directions", label: "Directions", intent: "directions" as const },
    { id: "save", label: "Add to trip", intent: "save" as const },
    { id: "concierge", label: "Ask Concierge", intent: "concierge" as const },
  ];
}
