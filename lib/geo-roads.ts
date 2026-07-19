import type {
  Feature,
  LineString,
  MultiLineString,
  MultiPolygon,
  Polygon,
} from "geojson";

import * as turf from "@turf/turf";

export type BBox = {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
};

export type RoadProps = {
  LINEARID?: string;
  FULLNAME?: string;
  RTTYP?: string;
  MTFCC?: string;
  ROADFLG?: string;
};

export type RoadFeature = Feature<LineString | MultiLineString, RoadProps>;

export function polygonBBox(geometry: Polygon | MultiPolygon): BBox {
  const [xmin, ymin, xmax, ymax] = turf.bbox({
    type: "Feature",
    geometry,
    properties: {},
  });

  return { xmin, ymin, xmax, ymax };
}

export function roadDisplayName(road: RoadFeature): string | undefined {
  const fullname = road.properties?.FULLNAME?.trim();
  if (fullname) return fullname;

  const linearId = road.properties?.LINEARID?.trim();
  if (linearId) return linearId;

  return undefined;
}

export function distancePointToRoadMeters(
  lat: number,
  lng: number,
  road: RoadFeature
): number {
  const point = turf.point([lng, lat]);

  const snapped = turf.nearestPointOnLine(road, point, {
    units: "kilometers",
  });

  const km =
    typeof snapped.properties?.dist === "number" ? snapped.properties.dist : 0;

  return km * 1000;
}
