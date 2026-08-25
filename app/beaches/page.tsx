import { BeachIntelligencePanel } from "@/components/beaches/beach-intelligence-panel";
import { DiscoveryDirectoryPage } from "@/components/directory/discovery-directory-page";
import { buildPublicPageMetadata } from "@/lib/public-page-metadata";
import { getTravelKnowledge } from "@/lib/travel-knowledge";

const description =
  "Compare USVI beaches by shoreline character, facilities, access, parking, safety context, and best-use cases, then connect the right beach to maps, rides, and your island plan.";

export const metadata = buildPublicPageMetadata({
  title: "Beaches",
  description,
  path: "/beaches",
});

export default function BeachesPage() {
  return (
    <>
      <DiscoveryDirectoryPage
        eyebrow="Beaches"
        title="Choose the right beach—not just a beautiful one"
        description="Compare shoreline character, facilities, access, parking, safety notes, and best-use cases, then connect the stop to maps, rides, and your complete island plan."
        items={getTravelKnowledge("beaches")}
        basePath="/beaches"
        iconName="waves"
        categoryLabel="Beach"
      />
      <div className="bg-[#f8f4ea] px-4 pb-10 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <BeachIntelligencePanel />
        </div>
      </div>
    </>
  );
}
