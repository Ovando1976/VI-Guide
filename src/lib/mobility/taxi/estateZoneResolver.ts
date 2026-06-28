// src/lib/mobility/taxi/estateZoneResolver.ts
import { estateTaxiZoneLinks } from "../../../data/estateTaxiZoneLinks";
import { normalizeMobilityText } from "./aliasMatcher";

export function getEstateTaxiZoneLink(estateName?: string | null) {
  if (!estateName) return null;

  const normalized = normalizeMobilityText(estateName);

  return (
    estateTaxiZoneLinks.find(
      (link) => normalizeMobilityText(link.estateName) === normalized
    ) ?? null
  );
}

export function resolveEstateTaxiZone(estateName?: string | null, mobilityIsland?: string): string | null {
  return getEstateTaxiZoneLink(estateName)?.taxiZoneId ?? null;
}