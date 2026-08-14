import { DiscoveryDirectoryPage } from "@/components/directory/discovery-directory-page";
import { getTravelKnowledge } from "@/lib/travel-knowledge";

export default function PlacesPage() {
  return (
    <DiscoveryDirectoryPage
      eyebrow="Explore"
      title="Eat local. Explore deeper. Move with confidence."
      description="Compare restaurants, waterfront districts, island towns, attractions, and practical stops—then connect every discovery to the map, concierge, ride flow, and My Trip."
      items={getTravelKnowledge("places")}
      basePath="/places"
      iconName="utensils-crossed"
      categoryLabel="Place"
    />
  );
}
