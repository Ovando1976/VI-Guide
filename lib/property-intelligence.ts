import fs from "node:fs/promises";
import path from "node:path";

export type PropertyIsland = "stt" | "stj" | "stx";
export type OverlayStatus = "matched" | "not_joined" | "unavailable";

export type PropertyIntelligenceRecord = {
  id: string;
  estate: {
    geoid: string;
    name: string;
    fullName: string;
    island: PropertyIsland;
    estateCode: string | null;
    aliases: string[];
    centroid: { lat: number; lng: number } | null;
    geometryType: string | null;
  };
  overlays: {
    parcel: { status: OverlayStatus; parcelIds: string[] };
    zoning: { status: OverlayStatus; codes: string[] };
    historicDistrict: { status: OverlayStatus; names: string[] };
  };
  provenance: {
    sources: string[];
    generatedFrom: string;
    overlayPolicy: "fail-closed";
  };
};

type EnrichedEstate = {
  geoid?: string;
  baseName?: string;
  fullName?: string;
  island?: PropertyIsland;
  estateCode?: string | null;
  aliases?: string[];
  centroid?: { lat?: number; lng?: number } | null;
  geometry?: { type?: string } | null;
  sources?: string[];
};

const ESTATE_SOURCE = "data/derived/estates.enriched-with-dictionary.json";

function cleanStrings(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))].sort();
}

function normalizeEstate(record: EnrichedEstate): PropertyIntelligenceRecord | null {
  const geoid = String(record.geoid ?? "").trim();
  const name = String(record.baseName ?? "").trim();
  const island = record.island;
  if (!geoid || !name || !island || !["stt", "stj", "stx"].includes(island)) return null;

  const lat = Number(record.centroid?.lat);
  const lng = Number(record.centroid?.lng);
  const centroid = Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;

  return {
    id: `estate:${geoid}`,
    estate: {
      geoid,
      name,
      fullName: String(record.fullName ?? name).trim() || name,
      island,
      estateCode: record.estateCode ? String(record.estateCode).trim() : null,
      aliases: cleanStrings(record.aliases),
      centroid,
      geometryType: record.geometry?.type ? String(record.geometry.type) : null,
    },
    overlays: {
      parcel: { status: "not_joined", parcelIds: [] },
      zoning: { status: "not_joined", codes: [] },
      historicDistrict: { status: "not_joined", names: [] },
    },
    provenance: {
      sources: cleanStrings(record.sources),
      generatedFrom: ESTATE_SOURCE,
      overlayPolicy: "fail-closed",
    },
  };
}

let cachedRecords: PropertyIntelligenceRecord[] | null = null;

export async function loadPropertyIntelligence(): Promise<PropertyIntelligenceRecord[]> {
  if (cachedRecords) return cachedRecords;
  const sourcePath = path.join(process.cwd(), ESTATE_SOURCE);
  const raw = await fs.readFile(sourcePath, "utf8");
  const parsed = JSON.parse(raw) as EnrichedEstate[];
  if (!Array.isArray(parsed)) throw new Error("Property intelligence estate source is not an array.");

  cachedRecords = parsed
    .map(normalizeEstate)
    .filter((record): record is PropertyIntelligenceRecord => Boolean(record))
    .sort((a, b) => a.estate.island.localeCompare(b.estate.island) || a.estate.name.localeCompare(b.estate.name));

  if (!cachedRecords.length) throw new Error("Property intelligence estate source produced no valid records.");
  return cachedRecords;
}

export function filterPropertyIntelligence(
  records: PropertyIntelligenceRecord[],
  options: { island?: PropertyIsland; query?: string; limit?: number },
): PropertyIntelligenceRecord[] {
  const query = String(options.query ?? "").trim().toLowerCase();
  const limit = Math.max(1, Math.min(options.limit ?? 100, 500));

  return records
    .filter((record) => !options.island || record.estate.island === options.island)
    .filter((record) => {
      if (!query) return true;
      const haystack = [record.estate.name, record.estate.fullName, record.estate.geoid, ...record.estate.aliases]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    })
    .slice(0, limit);
}
