import type { Metadata } from "next";

import { ConciergeDiscovery } from "@/components/concierge/concierge-discovery";

export const metadata: Metadata = {
  title: "Concierge Discovery | VI Guide",
  description:
    "Search beaches, places, stays, and heritage across the U.S. Virgin Islands, then build a grounded island plan with VI Guide Concierge.",
};

export default function ConciergePage() {
  return <ConciergeDiscovery />;
}
