import type {
    LatLngBoundsExpression,
    LatLngExpression,
    LatLngLiteral,
  } from "leaflet";
  import type { LineString, Position } from "geojson";
  
  import type { EstateRecord } from "@/types/usvi";
  
  export type TerritoryPoint = {
    lat: number;
    lng: number;
  };
  
  export type EstateDistance = {
    estate: EstateRecord;
    distanceMeters: number;
  };
  
  const DEFAULT_CENTER: TerritoryPoint = {
    lat: 18.336,
    lng: -64.93,
  };
  
  const EARTH_RADIUS_METERS = 6_371_008.8;
  const DEFAULT_POINT_BOUNDS_DELTA = 0.01;
  
  /**
   * Converts a GeoJSON LineString from [longitude, latitude]
   * coordinates into Leaflet [latitude, longitude] coordinates.
   */
  export function geoJsonLineToLatLngs(
    line: LineString | null | undefined,
  ): LatLngExpression[] {
    if (!line) {
      return [];
    }
  
    return line.coordinates
      .map(positionToLatLng)
      .filter((point): point is LatLngExpression => point !== null);
  }
  
  /**
   * Returns the preferred center for an estate.
   *
   * Resolution order:
   * 1. Valid internal point
   * 2. Polygon centroid
   * 3. First valid polygon point
   * 4. Territory fallback center
   */
  export function getEstateCenter(
    estate: EstateRecord,
  ): LatLngExpression {
    const internalPoint = estateInternalPoint(estate);
  
    if (internalPoint) {
      return [internalPoint.lat, internalPoint.lng];
    }
  
    const rings = getEstatePolygonRings(estate);
    const outerRing = rings[0];
  
    if (outerRing?.length) {
      const centroid = polygonCentroid(outerRing);
  
      if (centroid) {
        return [centroid.lat, centroid.lng];
      }
  
      return outerRing[0];
    }
  
    return [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng];
  }
  
  /**
   * Returns bounds enclosing all polygon rings for an estate.
   *
   * For estates without polygon geometry, a small bounding box is
   * created around the estate center.
   */
  export function getEstateBounds(
    estate: EstateRecord | null | undefined,
  ): LatLngBoundsExpression | null {
    if (!estate) {
      return null;
    }
  
    const points = getEstatePolygonRings(estate).flat();
  
    if (points.length) {
      return boundsFromPoints(points);
    }
  
    return expandPointBounds(getEstateCenter(estate));
  }
  
  /**
   * Extracts every valid polygon ring from an estate's GeoJSON geometry.
   *
   * Polygon and MultiPolygon geometries are flattened into a single
   * collection of Leaflet-compatible rings.
   */
  export function getEstatePolygonRings(
    estate: EstateRecord,
  ): LatLngExpression[][] {
    const { geometry } = estate;
  
    if (!geometry) {
      return [];
    }
  
    switch (geometry.type) {
      case "Polygon":
        return polygonCoordinatesToLeaflet(geometry.coordinates);
  
      case "MultiPolygon":
        return geometry.coordinates.flatMap((polygon) =>
          polygonCoordinatesToLeaflet(polygon),
        );
  
      default:
        return [];
    }
  }
  
  /**
   * Converts GeoJSON polygon coordinates from [longitude, latitude]
   * to Leaflet [latitude, longitude].
   */
  export function polygonCoordinatesToLeaflet(
    coordinates: Position[][],
  ): LatLngExpression[][] {
    return coordinates
      .map((ring) =>
        ring
          .map(positionToLatLng)
          .filter((point): point is LatLngExpression => point !== null),
      )
      .filter((ring) => ring.length >= 3);
  }
  
  /**
   * Returns the centroid of a ring.
   *
   * Uses an area-weighted polygon centroid when possible and falls
   * back to the arithmetic mean for degenerate polygons.
   */
  export function centroidOfRing(
    ring: LatLngExpression[],
  ): LatLngExpression {
    const centroid = polygonCentroid(ring);
  
    if (centroid) {
      return [centroid.lat, centroid.lng];
    }
  
    return [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng];
  }
  
  /**
   * Returns an estate's internal point when it contains valid coordinates.
   */
  export function estateInternalPoint(
    estate: EstateRecord,
  ): TerritoryPoint | null {
    const point = estate.internalPoint;
  
    if (
      !point ||
      !isFiniteNumber(point.lat) ||
      !isFiniteNumber(point.lng) ||
      (point.lat === 0 && point.lng === 0)
    ) {
      return null;
    }
  
    return {
      lat: point.lat,
      lng: point.lng,
    };
  }
  
  /**
   * Normalizes any Leaflet LatLngExpression into a coordinate tuple.
   */
  export function toLatLngTuple(
    value: LatLngExpression,
  ): [number, number] {
    if (Array.isArray(value)) {
      const lat = Number(value[0]);
      const lng = Number(value[1]);
  
      return isFiniteNumber(lat) && isFiniteNumber(lng)
        ? [lat, lng]
        : [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng];
    }
  
    if (isLatLngLiteral(value)) {
      return [value.lat, value.lng];
    }
  
    return [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng];
  }
  
  /**
   * Creates a small bounding box around a point.
   */
  export function expandPointBounds(
    center: LatLngExpression,
    delta = DEFAULT_POINT_BOUNDS_DELTA,
  ): LatLngBoundsExpression {
    const [lat, lng] = toLatLngTuple(center);
    const safeDelta =
      isFiniteNumber(delta) && delta > 0
        ? delta
        : DEFAULT_POINT_BOUNDS_DELTA;
  
    return [
      [lat - safeDelta, lng - safeDelta],
      [lat + safeDelta, lng + safeDelta],
    ];
  }
  
  /**
   * Returns the squared coordinate distance between two estates.
   *
   * Useful for sorting nearby estates without calculating an expensive
   * geodesic distance for every comparison.
   */
  export function squaredDistance(
    first: EstateRecord,
    second: EstateRecord,
  ): number {
    const firstPoint = getEstatePoint(first);
    const secondPoint = getEstatePoint(second);
  
    const latitudeDifference =
      firstPoint.lat - secondPoint.lat;
    const longitudeDifference =
      firstPoint.lng - secondPoint.lng;
  
    return (
      latitudeDifference * latitudeDifference +
      longitudeDifference * longitudeDifference
    );
  }
  
  /**
   * Finds the nearest estate to another estate.
   */
  export function nearestEstate(
    source: EstateRecord,
    estates: EstateRecord[],
  ): EstateDistance | null {
    const candidates = estates.filter(
      (estate) => estate.geoid !== source.geoid,
    );
  
    return nearestEstateToPoint(
      getEstatePoint(source),
      candidates,
    );
  }
  
  /**
   * Finds the nearest estate to a coordinate.
   */
  export function nearestEstateToPoint(
    point: TerritoryPoint | LatLngExpression,
    estates: EstateRecord[],
  ): EstateDistance | null {
    const normalizedPoint = normalizePoint(point);
  
    if (!normalizedPoint) {
      return null;
    }
  
    let nearest: EstateDistance | null = null;
  
    for (const estate of estates) {
      const estatePoint = getEstatePoint(estate);
      const distanceMeters = pointDistance(
        normalizedPoint,
        estatePoint,
      );
  
      if (
        !nearest ||
        distanceMeters < nearest.distanceMeters
      ) {
        nearest = {
          estate,
          distanceMeters,
        };
      }
    }
  
    return nearest;
  }
  
  /**
   * Calculates the geodesic area of a polygon ring in square meters.
   *
   * The result is unsigned. A closing coordinate is not required.
   */
  export function polygonArea(
    ring: LatLngExpression[],
  ): number {
    const points = normalizeRing(ring);
  
    if (points.length < 3) {
      return 0;
    }
  
    let total = 0;
  
    for (let index = 0; index < points.length; index += 1) {
      const current = points[index];
      const next = points[(index + 1) % points.length];
  
      total +=
        degreesToRadians(next.lng - current.lng) *
        (
          2 +
          Math.sin(degreesToRadians(current.lat)) +
          Math.sin(degreesToRadians(next.lat))
        );
    }
  
    return Math.abs(
      (total * EARTH_RADIUS_METERS * EARTH_RADIUS_METERS) /
        2,
    );
  }
  
  /**
   * Calculates an area-weighted centroid for a polygon ring.
   *
   * Longitude is treated as the x-axis and latitude as the y-axis.
   * This is appropriate for local territory geometry such as USVI
   * estate polygons.
   */
  export function polygonCentroid(
    ring: LatLngExpression[],
  ): TerritoryPoint | null {
    const points = normalizeRing(ring);
  
    if (!points.length) {
      return null;
    }
  
    if (points.length < 3) {
      return averagePoint(points);
    }
  
    let twiceArea = 0;
    let longitudeTotal = 0;
    let latitudeTotal = 0;
  
    for (let index = 0; index < points.length; index += 1) {
      const current = points[index];
      const next = points[(index + 1) % points.length];
  
      const cross =
        current.lng * next.lat -
        next.lng * current.lat;
  
      twiceArea += cross;
      longitudeTotal +=
        (current.lng + next.lng) * cross;
      latitudeTotal +=
        (current.lat + next.lat) * cross;
    }
  
    if (Math.abs(twiceArea) < Number.EPSILON) {
      return averagePoint(points);
    }
  
    const divisor = 3 * twiceArea;
  
    const centroid = {
      lat: latitudeTotal / divisor,
      lng: longitudeTotal / divisor,
    };
  
    return isValidPoint(centroid)
      ? centroid
      : averagePoint(points);
  }
  
  /**
   * Determines whether a coordinate lies inside a polygon ring.
   *
   * Points on a polygon boundary are considered inside.
   */
  export function polygonContainsPoint(
    ring: LatLngExpression[],
    point: TerritoryPoint | LatLngExpression,
  ): boolean {
    const polygon = normalizeRing(ring);
    const target = normalizePoint(point);
  
    if (polygon.length < 3 || !target) {
      return false;
    }
  
    let inside = false;
  
    for (
      let currentIndex = 0,
        previousIndex = polygon.length - 1;
      currentIndex < polygon.length;
      previousIndex = currentIndex, currentIndex += 1
    ) {
      const current = polygon[currentIndex];
      const previous = polygon[previousIndex];
  
      if (pointOnSegment(target, previous, current)) {
        return true;
      }
  
      const crossesLatitude =
        current.lat > target.lat !==
        previous.lat > target.lat;
  
      if (!crossesLatitude) {
        continue;
      }
  
      const longitudeAtIntersection =
        ((previous.lng - current.lng) *
          (target.lat - current.lat)) /
          (previous.lat - current.lat) +
        current.lng;
  
      if (target.lng < longitudeAtIntersection) {
        inside = !inside;
      }
    }
  
    return inside;
  }
  
  /**
   * Calculates the great-circle distance between two coordinates
   * using the haversine formula.
   */
  export function pointDistance(
    first: TerritoryPoint | LatLngExpression,
    second: TerritoryPoint | LatLngExpression,
  ): number {
    const start = normalizePoint(first);
    const end = normalizePoint(second);
  
    if (!start || !end) {
      return Number.POSITIVE_INFINITY;
    }
  
    const startLatitude = degreesToRadians(start.lat);
    const endLatitude = degreesToRadians(end.lat);
    const latitudeDifference = degreesToRadians(
      end.lat - start.lat,
    );
    const longitudeDifference = degreesToRadians(
      end.lng - start.lng,
    );
  
    const haversine =
      Math.sin(latitudeDifference / 2) ** 2 +
      Math.cos(startLatitude) *
        Math.cos(endLatitude) *
        Math.sin(longitudeDifference / 2) ** 2;
  
    const angularDistance =
      2 *
      Math.atan2(
        Math.sqrt(haversine),
        Math.sqrt(Math.max(0, 1 - haversine)),
      );
  
    return EARTH_RADIUS_METERS * angularDistance;
  }
  
  /**
   * Returns bounds enclosing an entire route.
   */
  export function routeBounds(
    route:
      | LineString
      | LatLngExpression[]
      | null
      | undefined,
  ): LatLngBoundsExpression | null {
    if (!route) {
      return null;
    }
  
    const points =
      Array.isArray(route)
        ? route
        : geoJsonLineToLatLngs(route);
  
    return boundsFromPoints(points);
  }
  
  /**
   * Returns bounds enclosing a collection of points.
   */
  export function boundsFromPoints(
    points: LatLngExpression[],
  ): LatLngBoundsExpression | null {
    const normalized = points
      .map(normalizePoint)
      .filter((point): point is TerritoryPoint => point !== null);
  
    if (!normalized.length) {
      return null;
    }
  
    let south = normalized[0].lat;
    let north = normalized[0].lat;
    let west = normalized[0].lng;
    let east = normalized[0].lng;
  
    for (const point of normalized.slice(1)) {
      south = Math.min(south, point.lat);
      north = Math.max(north, point.lat);
      west = Math.min(west, point.lng);
      east = Math.max(east, point.lng);
    }
  
    if (south === north && west === east) {
      return expandPointBounds([south, west]);
    }
  
    return [
      [south, west],
      [north, east],
    ];
  }
  
  /**
   * Returns a normalized coordinate for an estate.
   */
  export function getEstatePoint(
    estate: EstateRecord,
  ): TerritoryPoint {
    const [lat, lng] = toLatLngTuple(
      getEstateCenter(estate),
    );
  
    return { lat, lng };
  }
  
  export function isFiniteNumber(
    value: unknown,
  ): value is number {
    return (
      typeof value === "number" &&
      Number.isFinite(value)
    );
  }
  
  function positionToLatLng(
    position: Position,
  ): LatLngExpression | null {
    if (!Array.isArray(position) || position.length < 2) {
      return null;
    }
  
    const longitude = Number(position[0]);
    const latitude = Number(position[1]);
  
    if (
      !isFiniteNumber(latitude) ||
      !isFiniteNumber(longitude)
    ) {
      return null;
    }
  
    return [latitude, longitude];
  }
  
  function normalizeRing(
    ring: LatLngExpression[],
  ): TerritoryPoint[] {
    const points = ring
      .map(normalizePoint)
      .filter((point): point is TerritoryPoint => point !== null);
  
    if (points.length < 2) {
      return points;
    }
  
    const first = points[0];
    const last = points[points.length - 1];
  
    if (
      first.lat === last.lat &&
      first.lng === last.lng
    ) {
      return points.slice(0, -1);
    }
  
    return points;
  }
  
  function normalizePoint(
    point: TerritoryPoint | LatLngExpression,
  ): TerritoryPoint | null {
    if (isTerritoryPoint(point)) {
      return point;
    }
  
    const [lat, lng] = toLatLngTuple(point);
  
    return isValidPoint({ lat, lng })
      ? { lat, lng }
      : null;
  }
  
  function averagePoint(
    points: TerritoryPoint[],
  ): TerritoryPoint | null {
    if (!points.length) {
      return null;
    }
  
    const totals = points.reduce(
      (result, point) => ({
        lat: result.lat + point.lat,
        lng: result.lng + point.lng,
      }),
      { lat: 0, lng: 0 },
    );
  
    return {
      lat: totals.lat / points.length,
      lng: totals.lng / points.length,
    };
  }
  
  function pointOnSegment(
    point: TerritoryPoint,
    start: TerritoryPoint,
    end: TerritoryPoint,
  ): boolean {
    const tolerance = 1e-10;
  
    const crossProduct =
      (point.lat - start.lat) *
        (end.lng - start.lng) -
      (point.lng - start.lng) *
        (end.lat - start.lat);
  
    if (Math.abs(crossProduct) > tolerance) {
      return false;
    }
  
    const dotProduct =
      (point.lng - start.lng) *
        (end.lng - start.lng) +
      (point.lat - start.lat) *
        (end.lat - start.lat);
  
    if (dotProduct < -tolerance) {
      return false;
    }
  
    const squaredLength =
      (end.lng - start.lng) ** 2 +
      (end.lat - start.lat) ** 2;
  
    return dotProduct <= squaredLength + tolerance;
  }
  
  function isLatLngLiteral(
    value: unknown,
  ): value is LatLngLiteral {
    if (
      typeof value !== "object" ||
      value === null
    ) {
      return false;
    }
  
    const candidate = value as Partial<LatLngLiteral>;
  
    return (
      isFiniteNumber(candidate.lat) &&
      isFiniteNumber(candidate.lng)
    );
  }
  
  function isTerritoryPoint(
    value: unknown,
  ): value is TerritoryPoint {
    return isLatLngLiteral(value);
  }
  
  function isValidPoint(
    point: TerritoryPoint,
  ): boolean {
    return (
      isFiniteNumber(point.lat) &&
      isFiniteNumber(point.lng) &&
      point.lat >= -90 &&
      point.lat <= 90 &&
      point.lng >= -180 &&
      point.lng <= 180
    );
  }
  
  function degreesToRadians(
    degrees: number,
  ): number {
    return (degrees * Math.PI) / 180;
  }