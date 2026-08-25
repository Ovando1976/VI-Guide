import { DiscoveryDirectoryPage } from "@/components/directory/discovery-directory-page";
import { buildPublicPageMetadata } from "@/lib/public-page-metadata";
import { getTravelKnowledge } from "@/lib/travel-knowledge";

const description =
  "Compare verified hotels, resorts, villas, and guesthouses across St. Thomas, St. John, and St. Croix, then connect your stay to transportation and island plans.";

export const metadata = buildPublicPageMetadata({
  title: "Stays & Accommodations",
  description,
  path: "/accommodations",
});

export default function AccommodationsPage() {
  return (
    <DiscoveryDirectoryPage
      eyebrow="Stays"
      title="Choose an island base that fits your trip"
      description="Compare verified hotels, resorts, villas, and guesthouses from the built-in USVI Explorer catalog, then connect your stay to transportation and island plans."
      items={getTravelKnowledge("stays")}
      basePath="/accommodations"
      iconName="bed-double"
      categoryLabel="Stay"
    />
  );
}
