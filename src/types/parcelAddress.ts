// src/types/parcelAddress.ts

export type IslandCode = "STT" | "STJ" | "STX" | "WAT";

export type ParcelAddress = {
  parcelId: string;
  island: IslandCode;
  estateName?: string;
  quarterName?: string;
  postalCode?: string;
  lat?: number;
  lng?: number;

  displayAddress: string;
  searchableText: string[];
};