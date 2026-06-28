#!/usr/bin/env tsx

import fs from "node:fs/promises";
import path from "node:path";
import { geographicDictionaryEntries } from "../src/data/geographicDictionaryEntries";

const OUT_JSON = path.join(process.cwd(), "generated", "geographic-dictionary.coordinates.json");
const OUT_TS = path.join(process.cwd(), "src/data/geographicDictionaryCoordinates.ts");

type CoordinateRecord = {
  entryId: string;
  sourceName: string;
  normalizedName: string;
  lat: number;
  lng: number;
  rawLat: string;
  rawLng: string;
  description: string;
  possibleIsland: string | null;
  possibleQuarter: string | null;
  confidence: number;
};

function dmsToDecimal(raw: string, hemisphere: "N" | "S" | "E" | "W") {
  const nums = raw.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];

  const degrees = nums[0] ?? 0;
  const minutes = nums[1] ?? 0;
  const seconds = nums[2] ?? 0;

  let decimal = degrees + minutes / 60 + seconds / 3600;

  if (hemisphere === "S" || hemisphere === "W") {
    decimal *= -1;
  }

  return Number(decimal.toFixed(7));
}

function isUsviCoordinate(lat: number, lng: number) {
  return lat >= 17.4 && lat <= 18.6 && lng >= -65.2 && lng <= -64.3;
}

function extractCoordinatesFromText(text: string) {
  const normalized = text.replace(/[“”]/g, '"').replace(/[’‘]/g, "'");

  const patterns = [
    /lat\.?\s*([0-9]{1,2})[°"\s]+([0-9]{1,2})['’\s]+([0-9]{1,2}(?:\.\d+)?)["”]?\s*N?.{0,80}?long\.?\s*([0-9]{1,3})[°"\s]+([0-9]{1,2})['’\s]+([0-9]{1,2}(?:\.\d+)?)["”]?\s*W?/gi,
    /latitude\s*([0-9]{1,2})[°"\s]+([0-9]{1,2})['’\s]+([0-9]{1,2}(?:\.\d+)?)["”]?\s*N?.{0,80}?longitude\s*([0-9]{1,3})[°"\s]+([0-9]{1,2})['’\s]+([0-9]{1,2}(?:\.\d+)?)["”]?\s*W?/gi,
    /([0-9]{1,2})[°"\s]+([0-9]{1,2})['’\s]+([0-9]{1,2}(?:\.\d+)?)["”]?\s*N.{0,80}?([0-9]{1,3})[°"\s]+([0-9]{1,2})['’\s]+([0-9]{1,2}(?:\.\d+)?)["”]?\s*W/gi,
  ];

  const results: Array<{
    lat: number;
    lng: number;
    rawLat: string;
    rawLng: string;
  }> = [];

  for (const pattern of patterns) {
    for (const match of normalized.matchAll(pattern)) {
      const latRaw = `${match[1]} ${match[2]} ${match[3]}`;
      const lngRaw = `${match[4]} ${match[5]} ${match[6]}`;

      const lat = dmsToDecimal(latRaw, "N");
      const lng = dmsToDecimal(lngRaw, "W");

      if (isUsviCoordinate(lat, lng)) {
        results.push({
          lat,
          lng,
          rawLat: latRaw,
          rawLng: lngRaw,
        });
      }
    }
  }

  return results;
}

async function main() {
  const records: CoordinateRecord[] = [];

  for (const entry of geographicDictionaryEntries) {
    const coords = extractCoordinatesFromText(entry.description);

    for (const coord of coords) {
      records.push({
        entryId: entry.id,
        sourceName: entry.sourceName,
        normalizedName: entry.normalizedName,
        lat: coord.lat,
        lng: coord.lng,
        rawLat: coord.rawLat,
        rawLng: coord.rawLng,
        description: entry.description,
        possibleIsland: entry.possibleIsland,
        possibleQuarter: entry.possibleQuarter,
        confidence: 100,
      });
    }
  }

  const deduped = Array.from(
    new Map(records.map((r) => [`${r.entryId}:${r.lat}:${r.lng}`, r])).values()
  ).sort((a, b) => a.sourceName.localeCompare(b.sourceName));

  await fs.writeFile(OUT_JSON, JSON.stringify(deduped, null, 2));

  await fs.writeFile(
    OUT_TS,
    `export type GeographicDictionaryCoordinate = {
  entryId: string;
  sourceName: string;
  normalizedName: string;
  lat: number;
  lng: number;
  rawLat: string;
  rawLng: string;
  description: string;
  possibleIsland: string | null;
  possibleQuarter: string | null;
  confidence: number;
};

export const geographicDictionaryCoordinates: GeographicDictionaryCoordinate[] = ${JSON.stringify(
      deduped,
      null,
      2
    )};

export function getDictionaryCoordinatesByName(name: string) {
  const key = name
    .replace(/^Estate\\s+/i, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return geographicDictionaryCoordinates.filter(
    (record) => record.normalizedName === key
  );
}
`
  );

  console.log(`Extracted ${deduped.length} coordinate records`);
  console.log(`Wrote ${OUT_JSON}`);
  console.log(`Wrote ${OUT_TS}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});