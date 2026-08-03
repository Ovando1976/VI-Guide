export type TripItemKind = "place" | "beach" | "stay" | "historic";

export type TripItem = {
  id: string;
  slug: string;
  name: string;
  kind: TripItemKind;
  island: "stt" | "stj" | "stx";
  image?: string;
  description?: string;
  href: string;
  mapHref?: string;
  lat?: number;
  lng?: number;
  day: number;
  timeOfDay: "morning" | "afternoon" | "evening" | "flexible";
  addedAt: string;
};

export const TRIP_STORAGE_KEY = "vi-guide-trip-v1";
