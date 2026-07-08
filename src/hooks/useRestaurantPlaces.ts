import { useEffect, useState } from "react";

import { getRestaurantPlaces, type RestaurantPlaceSource } from "../lib/restaurants/restaurantPlaceSource";
import type { IslandCode, PlaceDoc } from "../types";

export function useRestaurantPlaces(islandCode: IslandCode) {
  const [restaurants, setRestaurants] = useState<PlaceDoc[]>([]);
  const [source, setSource] = useState<RestaurantPlaceSource>("firestore");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const result = await getRestaurantPlaces(islandCode);

        if (!cancelled) {
          setRestaurants(result.restaurants);
          setSource(result.source);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError);
          setRestaurants([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [islandCode]);

  return {
    restaurants,
    source,
    loading,
    error,
  };
}
