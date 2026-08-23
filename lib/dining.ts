import { getPlaceDirectoryItems } from "@/lib/directory-data";
import type { DirectoryItem } from "@/types/directory";

const DINING_CATEGORIES = new Set(["food", "restaurant"]);

/**
 * Canonical dining inventory for public dining surfaces. The imported place
 * snapshot contains both legacy `food` and `restaurant` category values, so a
 * dining surface must deliberately include both rather than filtering only one.
 * Public Dining views normalize that legacy split to a single Restaurant label
 * without mutating the canonical place records used elsewhere in the app.
 */
export function getDiningDirectoryItems(): DirectoryItem[] {
  return getPlaceDirectoryItems()
    .filter((item) => DINING_CATEGORIES.has(item.category.toLowerCase()))
    .map((item) => ({ ...item, category: "restaurant" }));
}

export function isDiningItem(item: Pick<DirectoryItem, "category">): boolean {
  return DINING_CATEGORIES.has(item.category.toLowerCase());
}
