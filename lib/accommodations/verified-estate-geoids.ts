import type { IslandCode } from "@/types/usvi";

type VerifiedAccommodationEstate = {
  island: IslandCode;
  estateGeoid: string;
  estateName: string;
  evidence: string;
};

// Property-specific mappings only. These are intentionally not fuzzy place aliases:
// each entry is backed by the accommodation catalog's explicit location/address and
// an exact canonical estate in data/generated/modern-estates.normalized.json.
const VERIFIED_ACCOMMODATION_ESTATE_GEOIDS: Record<string, VerifiedAccommodationEstate> = {
  "Secret Harbour Beach Resort": {
    island: "stt",
    estateGeoid: "7803058400",
    estateName: "Estate Nazareth",
    evidence: "Catalog location is Nazareth; canonical estate is Estate Nazareth.",
  },
  "Elysian Beach Resort": {
    island: "stt",
    estateGeoid: "7803058400",
    estateName: "Estate Nazareth",
    evidence: "Catalog address is 6800 Estate Nazareth; canonical estate is Estate Nazareth.",
  },
  "Margaritaville Vacation Club - St. Thomas": {
    island: "stt",
    estateGeoid: "7803072500",
    estateName: "Estate Smith Bay",
    evidence: "Catalog address is 6080 Estate Smith Bay; canonical estate is Estate Smith Bay.",
  },
  "Sapphire Beach Resort and Marina": {
    island: "stt",
    estateGeoid: "7803072500",
    estateName: "Estate Smith Bay",
    evidence: "Catalog address is 6720 Estate Smith Bay; canonical estate is Estate Smith Bay.",
  },
};

export function verifiedAccommodationEstateGeoid(name: string, island: IslandCode) {
  const mapping = VERIFIED_ACCOMMODATION_ESTATE_GEOIDS[name];
  return mapping?.island === island ? mapping.estateGeoid : undefined;
}

export function verifiedAccommodationEstateMapping(name: string) {
  return VERIFIED_ACCOMMODATION_ESTATE_GEOIDS[name] ?? null;
}
