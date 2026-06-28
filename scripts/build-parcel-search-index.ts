import fs from "fs";
import path from "path";

const INPUT = "generated/usvi-parcels.json";
const OUTPUT = "public/data/usvi-parcels.index.json";

type ParcelRecord = {
  parcelId?: string | null;
  sourceParcelNo?: string | null;
  estateName?: string | null;
  estateGeoid?: string | null;
  island?: string | null;
  address?: string | null;
  ownerName?: string | null;
  centroid?: { lat: number; lng: number } | null;
  raw?: Record<string, unknown>;
};

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

function main() {
  const raw = JSON.parse(fs.readFileSync(INPUT, "utf8"));
  const parcels: ParcelRecord[] = raw.features ?? raw;

  const index = parcels.map((parcel) => ({
    parcelId: firstString(parcel.parcelId, parcel.sourceParcelNo, parcel.raw?.PARCEL_NO),
    sourceParcelNo: firstString(parcel.sourceParcelNo, parcel.raw?.PARCEL_NO),
    estateName: firstString(parcel.estateName, parcel.raw?.ESTATE, parcel.raw?.ESTATE_NAME),
    estateGeoid: firstString(parcel.estateGeoid),
    island: firstString(parcel.island),
    address: firstString(parcel.address, parcel.raw?.ADDRESS, parcel.raw?.SITE_ADDRESS),
    ownerName: firstString(parcel.ownerName, parcel.raw?.OWNER, parcel.raw?.OWNER_NAME),
    centroid: parcel.centroid ?? null,
  }));

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(index));

  console.log(`Indexed ${index.length} parcels`);
  console.log(`Wrote ${OUTPUT}`);
}

main();