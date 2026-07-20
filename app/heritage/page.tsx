import type { Metadata } from "next";

import { HeritageConcierge } from "@/components/heritage/heritage-concierge";
import { HeritageExplorer } from "@/components/heritage/heritage-explorer";
import { getTravelKnowledge } from "@/lib/travel-knowledge";

export const metadata: Metadata = {
  title: "USVI Heritage | VI Guide",
  description:
    "Explore historic places, cultural landscapes, maps, archives, and stories across the U.S. Virgin Islands.",
};

export default function HeritagePage() {
  return (
    <>
      <HeritageExplorer items={getTravelKnowledge("historic")} />
      <HeritageConcierge />
    </>
  );
}
