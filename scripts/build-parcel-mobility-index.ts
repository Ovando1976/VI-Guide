import fs from "fs";

import { estateTaxiZoneLinks } from "../src/data/estateTaxiZoneLinks";

const PARCEL_ESTATES = "public/data/usvi-parcels.estates.json";
const OUTPUT = "public/data/usvi-parcels.mobility.json";

type ParcelEstateRow = {
  parcelId: string | null;
  sourceParcelNo?: string | null;
  estateName?: string | null;
  estateGeoid?: string | null;
  island?: string | null;
  address?: string | null;
  ownerName?: string | null;
  centroid?: {
    lat: number;
    lng: number;
  } | null;
};

function normalize(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/^estate\s+/i, "")
    .replace(/['’`".,()/\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findTaxiZone(parcel: ParcelEstateRow): string | null {
  const estateName = normalize(parcel.estateName);
  const island = String(parcel.island ?? "").toLowerCase();

  if (!estateName) return null;

  const exact = estateTaxiZoneLinks.find(
    (link) =>
      normalize(link.estateName) === estateName &&
      (!island || link.island === island)
  );

  if (exact) return exact.taxiZoneId;

  const fuzzy = estateTaxiZoneLinks.find((link) => {
    const candidate = normalize(link.estateName);

    return (
      (!island || link.island === island) &&
      (candidate.includes(estateName) || estateName.includes(candidate))
    );
  });

  return fuzzy?.taxiZoneId ?? null;
}

function main() {
  const parcels = JSON.parse(
    fs.readFileSync(PARCEL_ESTATES, "utf8")
  ) as ParcelEstateRow[];

  let zoned = 0;

  const mobility = parcels.map((parcel) => {
    const taxiZoneId = findTaxiZone(parcel);

    if (taxiZoneId) zoned++;

    return {
      parcelId: parcel.parcelId,
      sourceParcelNo: parcel.sourceParcelNo,
      estateName: parcel.estateName ?? null,
      estateGeoid: parcel.estateGeoid ?? null,
      island: parcel.island ?? "unk",
      centroid: parcel.centroid ?? null,
      taxiZoneId,
      address: parcel.address ?? null,
      ownerName: parcel.ownerName ?? null,
    };
  });

  fs.writeFileSync(OUTPUT, JSON.stringify(mobility));

  console.log({
    parcels: mobility.length,
    zoned,
    unzoned: mobility.length - zoned,
    output: OUTPUT,
  });
}

main();