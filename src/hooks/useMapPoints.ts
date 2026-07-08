import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "../firebase";
import type { IslandCode } from "../types";
import type { MapFilter, MapPoint } from "../components/maps/IslandMap";

type UseMapPointsResult = {
  points: MapPoint[];
  loading: boolean;
  error: string | null;
};

type MapPointType = Exclude<MapFilter, "all">;

function normalizeIsland(selectedIsland: IslandCode | string) {
  if (selectedIsland === "st_thomas") return "st_thomas";
  if (selectedIsland === "st_john") return "st_john";
  if (selectedIsland === "st_croix") return "st_croix";
  if (selectedIsland === "water_island") return "water_island";
  return selectedIsland;
}

function getLatLng(data: any) {
  const lat =
    data.lat ??
    data.latitude ??
    data.coordinates?.lat ??
    data.centroid?.lat ??
    data.location?.lat;

  const lng =
    data.lng ??
    data.longitude ??
    data.coordinates?.lng ??
    data.centroid?.lng ??
    data.location?.lng;

  if (typeof lat !== "number" || typeof lng !== "number") {
    return null;
  }

  return { lat, lng };
}

function getPlaceMapType(category?: string): MapPointType {
  if (category === "restaurant") return "food";
  if (category === "nightlife") return "food";
  if (category === "transport") return "transport";
  if (category === "historic-site") return "history";
  if (category === "shopping") return "attraction";
  if (category === "hiking-trail") return "attraction";
  if (category === "attraction") return "attraction";

  return "attraction";
}

function toMapPoint(
  id: string,
  data: any,
  type: MapPointType
): MapPoint | null {
  const coords = getLatLng(data);
  if (!coords) return null;

  return {
    id,
    type,
    lat: coords.lat,
    lng: coords.lng,
    title: data.title ?? data.name ?? data.businessName ?? "Untitled Place",
    description:
      data.shortDescription ??
      data.description ??
      data.summary ??
      data.notes ??
      "",
  };
}

async function loadCollectionPoints(
  collectionName: string,
  selectedIsland: IslandCode | string,
  type: MapPointType
): Promise<MapPoint[]> {
  const island = normalizeIsland(selectedIsland);
  const ref = collection(db, collectionName);

  const possibleIslandFields = ["islandCode", "island", "islandId"];
  let docs: any[] = [];

  for (const field of possibleIslandFields) {
    try {
      const q = query(ref, where(field, "==", island), limit(500));
      const snap = await getDocs(q);

      if (!snap.empty) {
        docs = snap.docs;
        break;
      }
    } catch {
      // Try next possible field.
    }
  }

  if (docs.length === 0) {
    try {
      const snap = await getDocs(query(ref, limit(500)));
      docs = snap.docs.filter((docSnap) => {
        const data = docSnap.data();
        const docIsland = data.islandCode ?? data.island ?? data.islandId;
        return !docIsland || normalizeIsland(docIsland) === island;
      });
    } catch {
      return [];
    }
  }

  return docs
    .map((docSnap) => toMapPoint(docSnap.id, docSnap.data(), type))
    .filter((point): point is MapPoint => Boolean(point));
}

async function loadPlacesPoints(
  selectedIsland: IslandCode | string
): Promise<MapPoint[]> {
  const island = normalizeIsland(selectedIsland);

  try {
    const snap = await getDocs(
      query(
        collection(db, "places"),
        where("islandCode", "==", island),
        limit(750)
      )
    );

    return snap.docs
      .map((docSnap) => {
        const data = docSnap.data();
        return toMapPoint(docSnap.id, data, getPlaceMapType(data.category));
      })
      .filter((point): point is MapPoint => Boolean(point));
  } catch {
    return [];
  }
}

function dedupePoints(points: MapPoint[]) {
  const seen = new Set<string>();

  return points.filter((point) => {
    const key = `${point.type}-${point.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function useMapPoints(selectedIsland: IslandCode): UseMapPointsResult {
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const island = useMemo(
    () => normalizeIsland(selectedIsland),
    [selectedIsland]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadPoints() {
      setLoading(true);
      setError(null);

      try {
        const [
          beaches,
          places,
          events,
          historicSites,
          ferryPorts,
          cruisePorts,
          trails,
        ] = await Promise.all([
          loadCollectionPoints("beaches", island, "beach"),
          loadPlacesPoints(island),
          loadCollectionPoints("events", island, "event"),
          loadCollectionPoints("historic_sites", island, "history"),
          loadCollectionPoints("ferry_terminals", island, "transport"),
          loadCollectionPoints("cruise_ports", island, "transport"),
          loadCollectionPoints("hiking_trails", island, "attraction"),
        ]);

        if (!cancelled) {
          setPoints(
            dedupePoints([
              ...beaches,
              ...places,
              ...events,
              ...historicSites,
              ...ferryPorts,
              ...cruisePorts,
              ...trails,
            ])
          );
        }
      } catch (err) {
        console.error("Failed to load map points:", err);

        if (!cancelled) {
          setError("Unable to load map points.");
          setPoints([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPoints();

    return () => {
      cancelled = true;
    };
  }, [island]);

  return { points, loading, error };
}
