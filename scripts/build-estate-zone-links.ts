import { writeFileSync } from "node:fs";
import { estates } from "../src/data/estates";
import { taxiZones } from "../src/lib/mobility/taxi/taxiZones";

function normalize(value: unknown): string {
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

function slug(value: string): string {
  return normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function islandToMobility(value: unknown): "stt" | "stj" | "stx" | "wat" {
  const key = String(value ?? "").toLowerCase();
  if (key === "st_thomas" || key === "stt") return "stt";
  if (key === "st_john" || key === "stj") return "stj";
  if (key === "st_croix" || key === "stx") return "stx";
  return "wat";
}

function resolveZone(
  estateName: string | undefined,
  island: "stt" | "stj" | "stx" | "wat"
) {
  const name = normalize(estateName ?? "");

  const direct = taxiZones.find((zone) => {
    if (zone.island !== island) return false;

    const candidates = [
      zone.displayName,
      zone.slug,
      ...zone.aliases,
      ...(zone.estateNames ?? []),
    ].map(normalize);

    return candidates.some(
      (candidate) =>
        candidate === name ||
        candidate.includes(name) ||
        name.includes(candidate)
    );
  });

  if (direct) return { taxiZoneId: direct.id, confidence: 0.9 };

  const fallbackByIsland = {
    stt: "stt_charlotte_amalie",
    stj: "stj_cruz_bay",
    stx: "stx_christiansted",
    wat: "wat_water_island",
  };

  return { taxiZoneId: fallbackByIsland[island], confidence: 0.45 };
}

const links = estates.map((estate) => {
  const island = islandToMobility(estate.island);
  const resolved = resolveZone(estate.name, island);

  return {
    id: `${island}:${slug(estate.name ?? "")}:${resolved.taxiZoneId}`,
    island,
    estateGeoid: estate.geoid,
    estateName: estate.name,
    taxiZoneId: resolved.taxiZoneId,
    relationship: resolved.confidence >= 0.8 ? "primary" : "manual_review",
    confidence: resolved.confidence,
  };
});

const output = `export type MobilityIsland = "stt" | "stj" | "stx" | "wat";

export type EstateTaxiZoneRelationship =
  | "primary"
  | "secondary"
  | "nearest"
  | "manual_review";

export type EstateTaxiZoneLink = {
  id: string;
  island: MobilityIsland;
  estateGeoid?: string;
  estateName: string;
  taxiZoneId: string;
  relationship: EstateTaxiZoneRelationship;
  confidence: number;
};

export const estateTaxiZoneLinks: EstateTaxiZoneLink[] = ${JSON.stringify(
  links,
  null,
  2
)};
`;

writeFileSync("src/data/estateTaxiZoneLinks.ts", output);
console.log(`Wrote estate taxi zone links: ${links.length}`);