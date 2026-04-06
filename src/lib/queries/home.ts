import type { IslandCode } from "../../types";
import { getFeaturedBeaches } from "../firestore/beaches";
import { getPlacesByCategory } from "../firestore/places";
import { getUpcomingEvents } from "../firestore/events";

export async function getHomePageData(islandCode: IslandCode) {
  const [beaches, restaurants, events] = await Promise.all([
    getFeaturedBeaches(islandCode, 6),
    getPlacesByCategory("restaurant", islandCode, 6),
    getUpcomingEvents(islandCode, Date.now(), 6),
  ]);

  return {
    beaches,
    restaurants,
    events,
  };
}
