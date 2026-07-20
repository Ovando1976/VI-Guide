export type TripItemKind = "place" | "beach" | "stay" | "historic";

export type TripItem = {
  id: string;
  slug: string;
  name: string;
  kind: TripItemKind;
  island: "stt" | "stj" | "stx";
  image?: string;
  description?: string;
  location?: string;
  lat?: number;
  lng?: number;
  durationMinutes?: number;
  notes?: string;
  href: string;
  day: number;
  timeOfDay: "morning" | "afternoon" | "evening" | "flexible";
  addedAt: string;
};

export type TripProfile = {
  startDate: string | null;
  adults: number;
  children: number;
  luggage: number;
  mobilityPreference: "standard" | "shared" | "premium";
};

export type TripLeg = {
  id: string;
  day: number;
  from: TripItem;
  to: TripItem;
  kind: "taxi" | "ferry" | "flight";
  status: "ready_for_review" | "needs_transfer_planning" | "needs_location";
  label: string;
  href: string;
};

export const TRIP_STORAGE_KEY = "vi-guide-trip-v1";
export const TRIP_DAYS_STORAGE_KEY = "vi-guide-trip-days-v1";
export const TRIP_UPDATED_EVENT = "vi-guide-trip-updated";
export const TRIP_PROFILE_STORAGE_KEY = "vi-guide-trip-profile-v1";
