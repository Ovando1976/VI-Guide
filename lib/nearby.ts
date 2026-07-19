import type { DirectoryItem } from "@/types/directory";
import { haversineMiles } from "@/lib/geo";

export function getNearbyDirectoryItems(
  current: DirectoryItem,
  allItems: DirectoryItem[],
  maxResults = 6,
  maxMiles = 10
) {
  if (typeof current.lat !== "number" || typeof current.lng !== "number") {
    return [];
  }

  const currentLat = current.lat;
  const currentLng = current.lng;

  return allItems
    .filter((item) => item.id !== current.id)
    .filter(
      (item) =>
        typeof item.lat === "number" &&
        typeof item.lng === "number" &&
        item.island === current.island
    )
    .map((item) => ({
      item,
      distanceMiles: haversineMiles(
        currentLat,
        currentLng,
        item.lat as number,
        item.lng as number
      ),
    }))
    .filter((entry) => entry.distanceMiles <= maxMiles)
    .sort((a, b) => a.distanceMiles - b.distanceMiles)
    .slice(0, maxResults);
}