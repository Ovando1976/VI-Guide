// scripts/import-mapgeo-parcel-addresses.ts
import fs from "node:fs";
import path from "node:path";

type JsonObject = Record<string, unknown>;

type ParcelRecord = {
  parcelId?: string | null;
  sourceParcelId?: string | null;
  sourceParcelNo?: string | null;
  address?: string | null;
  ownerName?: string | null;
  geometry?: unknown;
  [key: string]: unknown;
};

type MapGeoRecord = {
  parcelId?: string | null;
  parcel_id?: string | null;
  parcelNo?: string | null;
  parcel_no?: string | null;
  sourceParcelId?: string | null;
  sourceParcelNo?: string | null;
  MAP_PAR_ID?: string | null;
  PARCEL_ID?: string | null;
  PARCELNO?: string | null;
  PID?: string | null;
  address?: string | null;
  situsAddress?: string | null;
  situs_address?: string | null;
  LOCATION?: string | null;
  ownerName?: string | null;
  owner?: string | null;
  OWNER?: string | null;
  [key: string]: unknown;
};

const PARCELS_FILE = "public/data/usvi-parcels.geojson";
const MAPGEO_FILE = "data/raw/mapgeo-parcels.json";

const OUTPUT_FILE = "generated/usvi-parcels.enriched.geojson";
const OUTPUT_FLAT_FILE = "generated/parcels.enriched.json";

function normalize(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }

  return null;
}

function parcelKeys(record: JsonObject): string[] {
  return [
    record.parcelId,
    record.parcel_id,
    record.parcelNo,
    record.parcel_no,
    record.sourceParcelId,
    record.sourceParcelNo,
    record.MAP_PAR_ID,
    record.PARCEL_ID,
    record.PARCELNO,
    record.PID,
    record.id,
  ]
    .map(normalize)
    .filter(Boolean);
}

function loadJson<T>(file: string): T {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing ${file}`);
  }

  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function unwrapMapGeoRows(raw: unknown): MapGeoRecord[] {
  if (Array.isArray(raw)) return raw as MapGeoRecord[];

  if (!raw || typeof raw !== "object") return [];

  const obj = raw as JsonObject;

  if (Array.isArray(obj.records)) return obj.records as MapGeoRecord[];
  if (Array.isArray(obj.features)) {
    return obj.features.map((feature) => {
      const f = feature as JsonObject;
      return {
        ...((f.properties as JsonObject | undefined) ?? {}),
        ...((f.attributes as JsonObject | undefined) ?? {}),
        geometry: f.geometry,
      };
    }) as MapGeoRecord[];
  }

  if (Array.isArray(obj.data)) return obj.data as MapGeoRecord[];
  if (Array.isArray(obj.results)) return obj.results as MapGeoRecord[];

  return [];
}

function unwrapParcels(raw: unknown): {
  geojson: JsonObject | null;
  parcels: ParcelRecord[];
} {
  if (Array.isArray(raw)) {
    return { geojson: null, parcels: raw as ParcelRecord[] };
  }

  if (!raw || typeof raw !== "object") {
    return { geojson: null, parcels: [] };
  }

  const obj = raw as JsonObject;

  if (Array.isArray(obj.features)) {
    const parcels = obj.features.map((feature) => {
      const f = feature as JsonObject;
      return {
        ...((f.properties as JsonObject | undefined) ?? {}),
        geometry: f.geometry,
      };
    }) as ParcelRecord[];

    return { geojson: obj, parcels };
  }

  return { geojson: null, parcels: [] };
}

function getMapGeoAddress(record: MapGeoRecord): string | null {
  return firstString(
    record.address,
    record.situsAddress,
    record.situs_address,
    record.LOCATION,
    record.SITUS_ADDRESS,
    record.PROP_ADDR,
    record.PROPERTY_ADDRESS
  );
}

function getMapGeoOwner(record: MapGeoRecord): string | null {
  return firstString(
    record.ownerName,
    record.owner,
    record.OWNER,
    record.OWNER_NAME,
    record.OWN_NAME
  );
}

function main() {
  const rawParcels = loadJson<unknown>(PARCELS_FILE);
  const rawMapGeo = loadJson<unknown>(MAPGEO_FILE);

  const { geojson, parcels } = unwrapParcels(rawParcels);
  const mapGeoRows = unwrapMapGeoRows(rawMapGeo);

  if (!parcels.length) {
    throw new Error(`No parcels found in ${PARCELS_FILE}`);
  }

  if (!mapGeoRows.length) {
  console.warn(`No MapGeo rows found in ${MAPGEO_FILE}. Writing unmatched parcel output.`);
}


  const lookup = new Map<string, MapGeoRecord>();

  for (const row of mapGeoRows) {
    for (const key of parcelKeys(row as JsonObject)) {
      lookup.set(key, row);
    }
  }

  let matched = 0;
  let addressed = 0;

  const enrichedParcels = parcels.map((parcel) => {
    const keys = parcelKeys(parcel as JsonObject);
    const match = keys.map((key) => lookup.get(key)).find(Boolean);

    if (!match) {
      return {
        ...parcel,
        mapGeoMatched: false,
      };
    }

    matched += 1;

    const mapGeoAddress = getMapGeoAddress(match);
    const mapGeoOwnerName = getMapGeoOwner(match);

    if (mapGeoAddress) addressed += 1;

    return {
      ...parcel,
      address: mapGeoAddress ?? parcel.address ?? null,
      ownerName: mapGeoOwnerName ?? parcel.ownerName ?? null,
      mapGeoAddress,
      mapGeoOwnerName,
      mapGeoMatched: true,
      mapGeoImportedAt: new Date().toISOString(),
      mapGeoSource: "USVI MapGeo official export",
    };
  });

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });

  fs.writeFileSync(OUTPUT_FLAT_FILE, JSON.stringify(enrichedParcels, null, 2));

  if (geojson && Array.isArray(geojson.features)) {
    const enrichedGeojson = {
      ...geojson,
      features: geojson.features.map((feature, index) => {
        const f = feature as JsonObject;

        return {
          ...f,
          properties: {
            ...((f.properties as JsonObject | undefined) ?? {}),
            ...enrichedParcels[index],
            geometry: undefined,
          },
        };
      }),
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(enrichedGeojson, null, 2));
  }

  console.log({
    parcels: parcels.length,
    mapGeoRows: mapGeoRows.length,
    matched,
    addressed,
    unmatched: parcels.length - matched,
    wroteFlat: OUTPUT_FLAT_FILE,
    wroteGeojson: geojson ? OUTPUT_FILE : null,
  });
}

main();