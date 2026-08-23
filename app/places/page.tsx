import { DiscoveryDirectoryPage } from "@/components/directory/discovery-directory-page";
import { getTravelKnowledge } from "@/lib/travel-knowledge";
import type { DirectoryItem } from "@/types/directory";

type PlacesPageProps = {
  searchParams?: {
    category?: string | string[];
  };
};

const DINING_CATEGORY_ALIASES = new Set(["dining", "food", "restaurant"]);

function firstSearchParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizePlaceCategory(item: DirectoryItem): DirectoryItem {
  return DINING_CATEGORY_ALIASES.has(item.category.trim().toLowerCase())
    ? { ...item, category: "Dining" }
    : item;
}

export default function PlacesPage({ searchParams }: PlacesPageProps) {
  const requestedCategory = firstSearchParam(searchParams?.category)
    ?.trim()
    .toLowerCase();
  const canonicalCategory = requestedCategory
    ? DINING_CATEGORY_ALIASES.has(requestedCategory)
      ? "dining"
      : requestedCategory
    : undefined;

  const allItems = getTravelKnowledge("places").map(normalizePlaceCategory);
  const items = canonicalCategory
    ? allItems.filter(
        (item) => item.category.trim().toLowerCase() === canonicalCategory,
      )
    : allItems;
  const isDiningView = canonicalCategory === "dining";

  return (
    <DiscoveryDirectoryPage
      eyebrow={isDiningView ? "Dining" : "Explore"}
      title={
        isDiningView
          ? "Eat your way across the Virgin Islands."
          : "Eat local. Explore deeper. Move with confidence."
      }
      description={
        isDiningView
          ? "Compare restaurants, cafés, beach bars, bakeries, food trucks, and island favorites across St. Thomas, St. John, and St. Croix—then connect dinner plans to the map, Concierge, ride flow, and My Trip."
          : "Compare restaurants, waterfront districts, island towns, attractions, and practical stops—then connect every discovery to the map, concierge, ride flow, and My Trip."
      }
      items={items}
      basePath="/places"
      iconName="utensils-crossed"
      categoryLabel={isDiningView ? "Dining spot" : "Place"}
    />
  );
}
