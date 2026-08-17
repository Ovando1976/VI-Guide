import type { TerritoryMapPlaceType } from "@/types/territory-map";

type RideTarget = {
  name: string;
  island: "stt" | "stj" | "stx";
  type?: TerritoryMapPlaceType | string;
  lat?: number | null;
  lng?: number | null;
  estateGeoid?: string | null;
  source?: "living-map" | "beach" | "planner" | "place" | "stay" | "historic";
  returnTo?: string;
};

export function buildMobilityRideHref(target: RideTarget) {
  const params = new URLSearchParams({
    island: target.island,
    destinationName: target.name.trim().slice(0, 220),
    source: target.source ?? "place",
  });

  if (target.type) params.set("destinationType", String(target.type).slice(0, 80));
  if (target.returnTo?.startsWith("/") && !target.returnTo.startsWith("//")) {
    params.set("returnTo", target.returnTo.slice(0, 600));
  }
  if (target.estateGeoid?.trim()) params.set("to", target.estateGeoid.trim().slice(0, 180));
  if (typeof target.lat === "number" && Number.isFinite(target.lat)) params.set("toLat", String(target.lat));
  if (typeof target.lng === "number" && Number.isFinite(target.lng)) params.set("toLng", String(target.lng));

  return `/mobility?${params.toString()}#book`;
}
