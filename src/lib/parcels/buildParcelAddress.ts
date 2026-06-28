// src/lib/parcels/buildParcelAddress.ts

import type { ParcelAddress, IslandCode } from "../../types/parcelAddress";

function islandLabel(island: IslandCode): string {
  switch (island) {
    case "STT":
      return "St. Thomas";
    case "STJ":
      return "St. John";
    case "STX":
      return "St. Croix";
    case "WAT":
      return "Water Island";
    default:
      return "U.S. Virgin Islands";
  }
}

export function buildParcelAddress(input: {
  parcelId: string;
  island: IslandCode;
  estateName?: string;
  quarterName?: string;
  postalCode?: string;
  lat?: number;
  lng?: number;
}): ParcelAddress {
  const island = islandLabel(input.island);

  const displayAddress = [
    input.estateName ? `Estate ${input.estateName}` : null,
    input.parcelId ? `Parcel ${input.parcelId}` : null,
    input.quarterName,
    island,
    input.postalCode ? `USVI ${input.postalCode}` : "USVI",
  ]
    .filter(Boolean)
    .join(", ");

  const searchableText = [
    input.parcelId,
    input.estateName,
    input.estateName ? `Estate ${input.estateName}` : undefined,
    input.quarterName,
    island,
    input.postalCode,
    displayAddress,
  ].filter(Boolean) as string[];

  return {
    ...input,
    displayAddress,
    searchableText,
  };
}