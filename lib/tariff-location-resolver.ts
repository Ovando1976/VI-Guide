import type { IslandCode } from "@/types/usvi";

export type TariffResolutionMethod =
  | "explicit_endpoint"
  | "reviewed_alias"
  | "reviewed_parent"
  | "unresolved";

export type TariffLocationMapping = {
  placeId: string;
  island: IslandCode;
  placeName: string;
  tariffEndpointName?: string;
  method: TariffResolutionMethod;
  reviewReference?: string;
  notes?: string;
};

export type TariffResolvablePlace = {
  id: string;
  island: IslandCode;
  name: string;
  tariffEndpointName?: string;
  parentPlaceId?: string;
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function buildTariffLocationResolver(
  reviewedMappings: TariffLocationMapping[],
) {
  const byPlaceId = new Map(
    reviewedMappings.map((mapping) => [mapping.placeId, mapping]),
  );
  const byReviewedName = new Map<string, TariffLocationMapping>();

  for (const mapping of reviewedMappings) {
    if (mapping.method !== "reviewed_alias") continue;
    byReviewedName.set(`${mapping.island}:${normalize(mapping.placeName)}`, mapping);
  }

  return function resolveTariffLocation(
    place: TariffResolvablePlace,
  ): TariffLocationMapping {
    if (place.tariffEndpointName) {
      return {
        placeId: place.id,
        island: place.island,
        placeName: place.name,
        tariffEndpointName: place.tariffEndpointName,
        method: "explicit_endpoint",
      };
    }

    const explicit = byPlaceId.get(place.id);
    if (explicit?.tariffEndpointName) return explicit;

    const alias = byReviewedName.get(`${place.island}:${normalize(place.name)}`);
    if (alias?.tariffEndpointName) {
      return { ...alias, placeId: place.id, placeName: place.name };
    }

    if (place.parentPlaceId) {
      const parent = byPlaceId.get(place.parentPlaceId);
      if (parent?.tariffEndpointName) {
        return {
          placeId: place.id,
          island: place.island,
          placeName: place.name,
          tariffEndpointName: parent.tariffEndpointName,
          method: "reviewed_parent",
          reviewReference: parent.reviewReference,
          notes: `Resolved through reviewed parent ${place.parentPlaceId}.`,
        };
      }
    }

    return {
      placeId: place.id,
      island: place.island,
      placeName: place.name,
      method: "unresolved",
      notes: "No reviewed tariff endpoint mapping exists. Do not infer from proximity.",
    };
  };
}

export function auditTariffLocationCoverage(
  places: TariffResolvablePlace[],
  reviewedMappings: TariffLocationMapping[],
) {
  const resolve = buildTariffLocationResolver(reviewedMappings);
  const resolutions = places.map(resolve);
  const unresolved = resolutions.filter((item) => item.method === "unresolved");

  return {
    total: resolutions.length,
    resolved: resolutions.length - unresolved.length,
    unresolved: unresolved.length,
    coverage:
      resolutions.length === 0
        ? 1
        : (resolutions.length - unresolved.length) / resolutions.length,
    resolutions,
    unresolvedPlaces: unresolved,
  };
}
