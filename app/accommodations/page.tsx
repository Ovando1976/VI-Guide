import { DiscoveryDirectoryPage } from "@/components/directory/discovery-directory-page";
import { getTravelKnowledge } from "@/lib/travel-knowledge";

export default function AccommodationsPage() {
  return (
    <DiscoveryDirectoryPage
      eyebrow="Stays"
      title="Choose an island base that fits your trip"
      description="Compare verified hotels, resorts, villas, and guesthouses from the built-in VI Guide catalog, then connect your stay to transportation and island plans."
      items={getTravelKnowledge("stays")}
      basePath="/accommodations"
      iconName="bed-double"
      categoryLabel="Stay"
    />
  );
}
