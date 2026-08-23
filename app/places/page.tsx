import { DiscoveryDirectoryPage } from "@/components/directory/discovery-directory-page";
import { getDiningDirectoryItems } from "@/lib/dining";
import { getTravelKnowledge } from "@/lib/travel-knowledge";

type Props = {
  searchParams?: {
    category?: string | string[];
  };
};

export default function PlacesPage({ searchParams }: Props) {
  const categoryParam = Array.isArray(searchParams?.category)
    ? searchParams?.category[0]
    : searchParams?.category;
  const diningRequested = ["restaurant", "food", "dining"].includes(
    categoryParam?.toLowerCase() ?? "",
  );

  return (
    <DiscoveryDirectoryPage
      eyebrow={diningRequested ? "Dining" : "Explore"}
      title={
        diningRequested
          ? "Eat your way across all three islands."
          : "Eat local. Explore deeper. Move with confidence."
      }
      description={
        diningRequested
          ? "Compare local favorites, waterfront restaurants, casual stops, and special-occasion dining across St. Thomas, St. John, and St. Croix—then connect a meal directly to the map, Concierge, ride flow, and My Trip."
          : "Compare restaurants, waterfront districts, island towns, attractions, and practical stops—then connect every discovery to the map, concierge, ride flow, and My Trip."
      }
      items={
        diningRequested
          ? getDiningDirectoryItems()
          : getTravelKnowledge("places")
      }
      basePath="/places"
      iconName="utensils-crossed"
      categoryLabel={diningRequested ? "Dining" : "Place"}
    />
  );
}
