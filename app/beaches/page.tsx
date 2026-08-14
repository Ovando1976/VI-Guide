import { BeachIntelligencePanel } from "@/components/beaches/beach-intelligence-panel";
import { DiscoveryDirectoryPage } from "@/components/directory/discovery-directory-page";
import { getTravelKnowledge } from "@/lib/travel-knowledge";

export default function BeachesPage() {
  return (
    <DiscoveryDirectoryPage
      eyebrow="Beaches"
      title="Find the shoreline that fits your day"
      description="From iconic bays to quieter island coves, explore beach options instantly and connect each stop to maps, rides, and the concierge."
      items={getTravelKnowledge("beaches")}
      basePath="/beaches"
      iconName="waves"
      categoryLabel="Beach"
      featuredContent={<BeachIntelligencePanel />}
    />
  );
}
