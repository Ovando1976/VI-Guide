import { DiscoveryDirectoryPage } from "@/components/directory/discovery-directory-page";
import { getDiningDirectoryItems } from "@/lib/dining";

export default function DiningPage() {
  return (
    <DiscoveryDirectoryPage
      eyebrow="Dining"
      title="Eat your way across all three islands."
      description="Compare local favorites, waterfront restaurants, casual stops, and special-occasion dining across St. Thomas, St. John, and St. Croix—then connect a meal directly to the map, Concierge, ride flow, and My Trip."
      items={getDiningDirectoryItems()}
      basePath="/places"
      iconName="utensils-crossed"
      categoryLabel="Dining"
    />
  );
}
