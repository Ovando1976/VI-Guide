import fs from "fs";

const PARCEL_INDEX =
  "public/data/usvi-parcels.index.json";

const ESTATES =
  "generated/usvi-estates.json";

const OUTPUT =
  "public/data/usvi-parcels.estates.json";

type ParcelRow = {
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

type EstateRow = {
  geoid?: string;
  estate?: string;
  name?: string;
  island?: string;
  bbox?: [number, number, number, number];
};

function pointInBbox(
  lat: number,
  lng: number,
  bbox?: [number, number, number, number]
) {
  if (!bbox) return false;

  const [minLng, minLat, maxLng, maxLat] = bbox;

  return (
    lng >= minLng &&
    lng <= maxLng &&
    lat >= minLat &&
    lat <= maxLat
  );
}

function main() {
  const parcels: ParcelRow[] = JSON.parse(
    fs.readFileSync(PARCEL_INDEX, "utf8")
  );

  const estates: EstateRow[] = JSON.parse(
    fs.readFileSync(ESTATES, "utf8")
  );

  let matched = 0;

  const enriched = parcels.map((parcel) => {
    if (!parcel.centroid) return parcel;

    const { lat, lng } = parcel.centroid;

    const estate = estates.find((e) =>
      pointInBbox(lat, lng, e.bbox)
    );

    if (!estate) return parcel;

    matched++;

    return {
      ...parcel,
      estateName:
        parcel.estateName ??
        estate.estate ??
        estate.name ??
        null,

      estateGeoid:
        parcel.estateGeoid ??
        estate.geoid ??
        null,

      island:
        parcel.island === "unk"
          ? estate.island
          : parcel.island,
    };
  });

  fs.writeFileSync(
    OUTPUT,
    JSON.stringify(enriched)
  );

  console.log({
    parcels: parcels.length,
    estates: estates.length,
    matched,
    unmatched: parcels.length - matched,
    output: OUTPUT,
  });
}

main();