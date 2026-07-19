import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ESTATES_URL =
  "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Places_CouSub_ConCity_SubMCD/MapServer/0/query?" +
  new URLSearchParams({
    where: "STATE='78'",
    outFields:
      "GEOID,STATE,COUNTY,BASENAME,NAME,CENTLAT,CENTLON,INTPTLAT,INTPTLON,ESTATE",
    returnGeometry: "true",
    outSR: "4326",
    f: "geojson",
  }).toString();

type IslandCode = "stt" | "stj" | "stx";

type GeoPoint = {
  lat: number;
  lng: number;
};

type EstateRecord = {
  geoid: string;
  state: string;
  county: string;
  baseName: string;
  fullName: string;
  estateCode: string | null;
  island: IslandCode;
  centroid: GeoPoint;
  internalPoint: GeoPoint;
  geometry: unknown;
  normalizedName: string;
  aliases: string[];
};

type EstateCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: unknown;
    properties: {
      GEOID?: string;
      STATE?: string;
      COUNTY?: string;
      BASENAME?: string;
      NAME?: string;
      CENTLAT?: string;
      CENTLON?: string;
      INTPTLAT?: string;
      INTPTLON?: string;
      ESTATE?: string;
    };
  }>;
};

const OUTPUT_DIR = path.resolve("data/generated");
const OUTPUT_PATH = path.resolve(OUTPUT_DIR, "modern-estates.normalized.json");

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeName(value: string): string {
  return normalizeWhitespace(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,;:()[\]{}!?'"`“”’]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean).map(normalizeWhitespace))].sort(
    (a, b) => a.localeCompare(b)
  );
}

function parseLatLon(value?: string): number {
  if (!value) return 0;
  return Number.parseFloat(value);
}

function inferIslandFromCounty(county: string): IslandCode {
  // USVI county FIPS in TIGER:
  // 010 = St. Croix
  // 020 = St. John
  // 030 = St. Thomas
  if (county === "010") return "stx";
  if (county === "020") return "stj";
  return "stt";
}

function normalizeEstateCollection(data: EstateCollection): EstateRecord[] {
  return data.features
    .map((feature) => {
      const props = feature.properties ?? {};
      const geoid = props.GEOID ?? "";
      const county = props.COUNTY ?? "";
      const baseName = normalizeWhitespace(props.BASENAME ?? "");
      const fullName = normalizeWhitespace(props.NAME ?? baseName);
      const estateCode = props.ESTATE
        ? normalizeWhitespace(props.ESTATE)
        : null;

      const centroid = {
        lat: parseLatLon(props.CENTLAT),
        lng: parseLatLon(props.CENTLON),
      };

      const internalPoint = {
        lat: parseLatLon(props.INTPTLAT),
        lng: parseLatLon(props.INTPTLON),
      };

      const island = inferIslandFromCounty(county);

      const aliases = uniqueSorted([baseName, fullName, estateCode ?? ""]);

      return {
        geoid,
        state: props.STATE ?? "",
        county,
        baseName,
        fullName,
        estateCode,
        island,
        centroid,
        internalPoint,
        geometry: feature.geometry,
        normalizedName: normalizeName(baseName),
        aliases,
      };
    })
    .filter((estate) => estate.geoid && estate.baseName);
}

async function main() {
  const response = await fetch(ESTATES_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(
      `Failed to fetch TIGER estates: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as EstateCollection;
  const estates = normalizeEstateCollection(data);

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(estates, null, 2), "utf8");

  console.log(`Wrote ${estates.length} modern estates to ${OUTPUT_PATH}`);
  console.log(estates.slice(0, 5));
}

main().catch((error) => {
  console.error("Modern estate export failed:", error);
  process.exit(1);
});
