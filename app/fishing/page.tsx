import type { Metadata } from "next";

import { FishingExplorer } from "@/components/fishing/fishing-explorer";

export const metadata: Metadata = {
  title: "USVI Fishing Guide | VI Guide",
  description:
    "Explore common Virgin Islands fishing species, habitats, conservation guidance, and direct map and concierge tools.",
};

export default function FishingPage() {
  return <FishingExplorer />;
}
