import { DiscoveryDirectoryPage } from "@/components/directory/discovery-directory-page";
import { getTravelKnowledge } from "@/lib/travel-knowledge";

export default function PlacesPage() {
  return (
    <DiscoveryDirectoryPage
      eyebrow="Explore"
      title="Discover the Virgin Islands beyond the obvious"
      description="Browse local dining, waterfront districts, island towns, and essential places without waiting on a database connection."
      items={getTravelKnowledge("places")}
      basePath="/places"
      iconName="utensils-crossed"
      categoryLabel="Place"
    />
  );
}
