export type RouteLinePoint = {
  lat: number;
  lng: number;
};

export type RouteLine = {
  type: "LineString";
  coordinates: [number, number][];
};

function isValidPoint(point?: RouteLinePoint | null): point is RouteLinePoint {
  return (
    Boolean(point) &&
    typeof point?.lat === "number" &&
    typeof point?.lng === "number" &&
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lng) &&
    point.lat !== 0 &&
    point.lng !== 0
  );
}

export function buildRouteLine(
  pickup?: RouteLinePoint | null,
  dropoff?: RouteLinePoint | null
): RouteLine | null {
  if (!isValidPoint(pickup) || !isValidPoint(dropoff)) return null;

  return {
    type: "LineString",
    coordinates: [
      [pickup.lng, pickup.lat],
      [dropoff.lng, dropoff.lat],
    ],
  };
}