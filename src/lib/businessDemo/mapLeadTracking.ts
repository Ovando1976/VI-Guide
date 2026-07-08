import { createMerchantLead } from "../firestore/merchantLeads";

type MapLeadAction =
  | "map_marker_select"
  | "search_result_select"
  | "featured_card_select"
  | "day_plan_select"
  | "directions_click"
  | "day_plan_save"
  | "ride_request_start";

type TrackableMapPoint = {
  id: string;
  title: string;
  type: string;
  lat: number;
  lng: number;
  description?: string;
};

type TrackMapLeadInput = {
  action: MapLeadAction;
  point: TrackableMapPoint;
  source?: string;
};

const LOCAL_KEY = "viNavigatorMapLeadEvents";

function safeSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function readLocalEvents() {
  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeLocalEvent(input: TrackMapLeadInput) {
  const event = {
    id: `map-lead-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    action: input.action,
    source: input.source || "map",
    placeId: input.point.id,
    placeName: input.point.title,
    placeType: input.point.type,
    lat: input.point.lat,
    lng: input.point.lng,
    createdAt: new Date().toISOString(),
  };

  const next = [event, ...readLocalEvents()].slice(0, 250);
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(next));

  return event;
}

function actionLabel(action: MapLeadAction) {
  const labels: Record<MapLeadAction, string> = {
    map_marker_select: "Map marker selected",
    search_result_select: "Search result selected",
    featured_card_select: "Featured map card selected",
    day_plan_select: "Day plan stop selected",
    directions_click: "Directions clicked",
    day_plan_save: "Added to day plan",
    ride_request_start: "Ride request started from map",
  };

  return labels[action];
}

export async function trackMapLeadAction(input: TrackMapLeadInput) {
  if (typeof window === "undefined") return null;

  const localEvent = writeLocalEvent(input);
  const partnerSlug = safeSlug(input.point.title || input.point.id || "map-place");

  try {
    await createMerchantLead({
      partnerId: `map-${partnerSlug}`,
      partnerName: input.point.title,
      action: input.action as any,
      message: `${actionLabel(input.action)} for ${input.point.title}. Place type: ${input.point.type}. Coordinates: ${input.point.lat}, ${input.point.lng}.`,
      visitorName: "Map Visitor",
      visitorPhone: "",
      visitorEmail: "",
      source: input.source || "map",
      placeId: input.point.id,
      placeType: input.point.type,
      lat: input.point.lat,
      lng: input.point.lng,
      localEventId: localEvent.id,
    } as any);
  } catch (error) {
    console.warn("Map lead Firestore write failed; saved locally instead.", error);
  }

  return localEvent;
}
