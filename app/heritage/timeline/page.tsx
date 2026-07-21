import type { Metadata } from "next";

import { TerritoryTimelineExplorer } from "@/components/heritage/territory-timeline-explorer";

export const metadata: Metadata = {
  title: "Virgin Islands Timeline | VI Guide",
  description:
    "Explore major Virgin Islands historical events and every U.S.-period governor in one connected chronology.",
};

export default function HeritageTimelinePage() {
  return <TerritoryTimelineExplorer />;
}
