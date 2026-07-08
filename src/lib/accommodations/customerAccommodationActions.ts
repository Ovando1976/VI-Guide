import type { CustomerBookingRecord } from "../../data/customerBookingCatalog";

export const ACCOMMODATION_TRIP_PLAN_KEY = "viNavigatorAccommodationTripPlan";
export const ACCOMMODATION_MAP_FOCUS_KEY = "viNavigatorAccommodationMapFocus";

export type AccommodationTripPlanItem = {
  id: string;
  businessName: string;
  category: string;
  island: string;
  area: string;
  headline: string;
  image: string;
  addedAt: string;
};

export function readAccommodationTripPlan(): AccommodationTripPlanItem[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(ACCOMMODATION_TRIP_PLAN_KEY) || "[]"
    ) as AccommodationTripPlanItem[];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAccommodationToTripPlan(record: CustomerBookingRecord) {
  if (typeof window === "undefined") return [];

  const current = readAccommodationTripPlan();

  const nextItem: AccommodationTripPlanItem = {
    id: record.id,
    businessName: record.businessName,
    category: record.category,
    island: record.island,
    area: record.area,
    headline: record.headline,
    image: record.image,
    addedAt: new Date().toISOString(),
  };

  const next = [
    nextItem,
    ...current.filter((item) => item.id !== record.id),
  ].slice(0, 50);

  window.localStorage.setItem(ACCOMMODATION_TRIP_PLAN_KEY, JSON.stringify(next));

  return next;
}

export function saveAccommodationMapFocus(record: CustomerBookingRecord) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    ACCOMMODATION_MAP_FOCUS_KEY,
    JSON.stringify({
      id: record.id,
      label: record.businessName,
      businessName: record.businessName,
      category: record.category,
      island: record.island,
      area: record.area,
      query: `${record.businessName} ${record.area} ${record.island}`,
      source: "customer_accommodation_detail",
      createdAt: new Date().toISOString(),
    })
  );
}

export function accommodationSlug(record: CustomerBookingRecord) {
  return (
    record.id ||
    record.businessName
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[’']/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  );
}
