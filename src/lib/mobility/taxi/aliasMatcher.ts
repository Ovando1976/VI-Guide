import { taxiZones } from "./taxiZones";
import type { MobilityIsland, TaxiZone } from "./types";
import { getEstateTaxiZoneLink } from "./estateZoneResolver";

export function normalizeMobilityText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/^estate\s+/i, "")
    .replace(/['’`".,()/\-]/g, " ")
    .replace(/\bst\b/g, "saint")
    .replace(/\s+/g, " ")
    .trim();
}

export function findTaxiZoneByName(
  island: MobilityIsland,
  rawName: string
): TaxiZone | null {
  const query = normalizeMobilityText(rawName);

  if (!query) return null;

  const estateLink = getEstateTaxiZoneLink(rawName);

  if (estateLink) {
    const linkedZone = taxiZones.find(
      (zone) => zone.island === island && zone.id === estateLink.taxiZoneId
    );

    if (linkedZone) return linkedZone;
  }

  return (
    taxiZones.find((zone) => {
      if (zone.island !== island) return false;

      const candidates = [
        zone.displayName,
        zone.slug,
        ...zone.aliases,
        ...(zone.estateNames ?? []),
      ].map(normalizeMobilityText);

      return candidates.some(
        (candidate) =>
          candidate === query ||
          candidate.includes(query) ||
          query.includes(candidate)
      );
    }) ?? null
  );
}