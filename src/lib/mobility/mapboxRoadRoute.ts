// src/lib/mobility/mapboxRoadRoute.ts

type LngLatTuple = [number, number];

export type RoadRouteGeoJson = GeoJSON.Feature<GeoJSON.LineString>;

const MAPBOX_TOKEN =
  import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ||
  import.meta.env.VITE_MAPBOX_TOKEN ||
  "";

export async function buildMapboxRoadRoute(
  pickup: LngLatTuple,
  dropoff: LngLatTuple
): Promise<RoadRouteGeoJson | null> {
  if (!MAPBOX_TOKEN) return null;

  const url = new URL(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${pickup[0]},${pickup[1]};${dropoff[0]},${dropoff[1]}`
  );

  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("overview", "full");
  url.searchParams.set("steps", "false");
  url.searchParams.set("access_token", MAPBOX_TOKEN);

  const response = await fetch(url.toString());

  if (!response.ok) {
    console.warn("Mapbox route failed:", response.status, await response.text());
    return null;
  }

  const data = await response.json();
  const route = data.routes?.[0];

  if (!route?.geometry?.coordinates?.length) return null;

  return {
    type: "Feature",
    properties: {
      distanceMeters: route.distance,
      durationSeconds: route.duration,
      source: "mapbox-directions",
    },
    geometry: route.geometry,
  };
}