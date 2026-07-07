import { useEffect, useMemo, useState } from "react";
import type { LatLngTuple, PathOptions } from "leaflet";
import { Polyline } from "react-leaflet";

type RoadRoutePolylineProps = {
  points: LatLngTuple[];
  pathOptions?: PathOptions;
};

function routeKey(points: LatLngTuple[]) {
  return points
    .map(([lat, lng]) => `${Number(lat).toFixed(5)},${Number(lng).toFixed(5)}`)
    .join("|");
}

function osrmUrl(points: LatLngTuple[]) {
  const coordinates = points.map(([lat, lng]) => `${lng},${lat}`).join(";");

  return `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=false`;
}

export default function RoadRoutePolyline({
  points,
  pathOptions,
}: RoadRoutePolylineProps) {
  const [roadPoints, setRoadPoints] = useState<LatLngTuple[]>([]);

  const cleanPoints = useMemo(
    () =>
      points.filter(
        (point) =>
          Array.isArray(point) &&
          Number.isFinite(point[0]) &&
          Number.isFinite(point[1])
      ),
    [points]
  );

  const key = useMemo(() => routeKey(cleanPoints), [cleanPoints]);

  useEffect(() => {
    let cancelled = false;

    async function loadRoute() {
      if (cleanPoints.length < 2) {
        setRoadPoints([]);
        return;
      }

      try {
        const response = await fetch(osrmUrl(cleanPoints));

        if (!response.ok) {
          throw new Error(`OSRM route failed: ${response.status}`);
        }

        const data = await response.json();
        const coordinates = data?.routes?.[0]?.geometry?.coordinates;

        if (!Array.isArray(coordinates) || coordinates.length < 2) {
          throw new Error("No road geometry returned.");
        }

        const next = coordinates
          .map(([lng, lat]: [number, number]) => [lat, lng] as LatLngTuple)
          .filter((point) => Number.isFinite(point[0]) && Number.isFinite(point[1]));

        if (!cancelled) {
          setRoadPoints(next.length >= 2 ? next : []);
        }
      } catch {
        if (!cancelled) {
          setRoadPoints([]);
        }
      }
    }

    loadRoute();

    return () => {
      cancelled = true;
    };
  }, [key, cleanPoints]);

  return (
    <Polyline
      positions={roadPoints.length >= 2 ? roadPoints : cleanPoints}
      pathOptions={
        pathOptions || {
          color: "#007f5f",
          weight: 7,
          opacity: 0.9,
        }
      }
    />
  );
}
