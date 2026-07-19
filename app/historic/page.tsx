import { DiscoveryDirectoryPage } from "@/components/directory/discovery-directory-page";
import { getTravelKnowledge } from "@/lib/travel-knowledge";

export default function HistoricPage() {
  return (
    <DiscoveryDirectoryPage
      eyebrow="History"
      title="Walk through the stories of the Virgin Islands"
      description="Explore forts, estates, districts, archaeology, and cultural landscapes from a local catalog that remains available even when live services are not."
      items={getTravelKnowledge("historic")}
      basePath="/historic"
      iconName="landmark"
      categoryLabel="Historic site"
    />
  );
}
