import * as turf from "@turf/turf";
import type {
  Feature,
  LineString,
  MultiLineString,
  MultiPolygon,
  Polygon,
} from "geojson";
import { fetchRoadsForEnvelope, type RoadsFeature } from "@/lib/usvi-roads";
import {
  distancePointToRoadMeters,
  polygonBBox,
  roadDisplayName,
  type RoadFeature,
} from "@/lib/geo-roads";

type EstateRoadInput = {
  geometry: Polygon | MultiPolygon;

  internalPoint: {
    lat: number;

    lng: number;
  };
};

type EstateRoadSummary = {
  name: string;
  fullname?: string;
  linearId?: string;
  mtfcc?: string;
};

type EstateRoadContext = {
  nearestRoad?:
    | (EstateRoadSummary & {
        distanceMeters: number;
      })
    | undefined;
  intersectingRoads: EstateRoadSummary[];
  primaryAccessRoad?:
    | (EstateRoadSummary & {
        strategy: "intersecting" | "nearest";
      })
    | undefined;
};

function toRoadFeature(feature: RoadsFeature): RoadFeature {
  return {
    type: feature.type,
    geometry: feature.geometry,
    properties: {
      LINEARID:
        typeof feature.properties?.LINEARID === "string"
          ? feature.properties.LINEARID
          : undefined,
      FULLNAME:
        typeof feature.properties?.FULLNAME === "string"
          ? feature.properties.FULLNAME
          : undefined,
      RTTYP:
        typeof feature.properties?.RTTYP === "string"
          ? feature.properties.RTTYP
          : undefined,
      MTFCC:
        typeof feature.properties?.MTFCC === "string"
          ? feature.properties.MTFCC
          : undefined,
      ROADFLG:
        typeof feature.properties?.ROADFLG === "string"
          ? feature.properties.ROADFLG
          : undefined,
    },
  };
}

function summarizeRoad(road: RoadFeature): EstateRoadSummary {
  return {
    name: roadDisplayName(road) || "Unnamed road",
    fullname: road.properties?.FULLNAME,
    linearId: road.properties?.LINEARID,
    mtfcc: road.properties?.MTFCC,
  };
}



export async function buildEstateRoadContext(
  estate: EstateRoadInput
): Promise<EstateRoadContext> {
  const bbox = polygonBBox(estate.geometry);

  const roads = await fetchRoadsForEnvelope([
    bbox.xmin,
    bbox.ymin,
    bbox.xmax,
    bbox.ymax,
  ]);

  const roadFeatures: RoadFeature[] = Array.isArray(roads?.features)
    ? roads.features.map(toRoadFeature)
    : [];

  if (!roadFeatures.length) {
    return {
      nearestRoad: undefined,
      intersectingRoads: [],
      primaryAccessRoad: undefined,
    };
  }

  const estatePolygon = turf.feature(estate.geometry);

  const intersectingRoads = roadFeatures.filter((road) => {
    try {
      return turf.booleanIntersects(estatePolygon, road);
    } catch {
      return false;
    }
  });

  const nearestRoad = roadFeatures
    .filter((road) => Boolean(roadDisplayName(road)))
    .map((road) => ({
      road,
      distanceMeters: distancePointToRoadMeters(
        estate.internalPoint.lat,
        estate.internalPoint.lng,
        road
      ),
    }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters)[0];

  const closestIntersectingNamedRoad = intersectingRoads
    .filter((road) => Boolean(roadDisplayName(road)))
    .map((road) => ({
      road,
      distanceMeters: distancePointToRoadMeters(
        estate.internalPoint.lat,
        estate.internalPoint.lng,
        road
      ),
    }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters)[0];

  const primary = closestIntersectingNamedRoad ?? nearestRoad;

  return {
    nearestRoad: nearestRoad
      ? {
          ...summarizeRoad(nearestRoad.road),
          distanceMeters: nearestRoad.distanceMeters,
        }
      : undefined,
    intersectingRoads: intersectingRoads
      .filter((road) => Boolean(roadDisplayName(road)))
      .map(summarizeRoad),
    primaryAccessRoad: primary
      ? {
          ...summarizeRoad(primary.road),
          strategy: closestIntersectingNamedRoad ? "intersecting" : "nearest",
        }
      : undefined,
  };
}
