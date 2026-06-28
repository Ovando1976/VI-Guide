import { estateTaxiZoneLinks } from "../../../data/estateTaxiZoneLinks";

export function resolveEstateTaxiZone(
  estateName?: string | null
): string | null {
  if (!estateName) return null;

  const normalized = estateName
    .toLowerCase()
    .replace(/^estate\s+/i, "")
    .trim();

  const match = estateTaxiZoneLinks.find(
    (link) =>
      link.estateName
        .toLowerCase()
        .replace(/^estate\s+/i, "")
        .trim() === normalized
  );

  return match?.taxiZoneId ?? null;
}