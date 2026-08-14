import type { Metadata } from "next";
import { Map } from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";
import { FishingExplorer } from "@/components/fishing/fishing-explorer";

export const metadata: Metadata = {
  title: "USVI Fishing Guide | USVI Explorer",
  description:
    "Explore common Virgin Islands fishing species, habitats, conservation guidance, and direct map and concierge tools.",
};

export default function FishingPage() {
  return (
    <>
      <div className="bg-[#031f26] px-4 pt-5 sm:px-6 lg:pt-8">
        <ViPublicHeader
          actionHref="/map"
          actionLabel="Open Living Map"
          actionIcon={Map}
          secondaryHref="/concierge?prompt=Help%20me%20plan%20a%20responsible%20Virgin%20Islands%20fishing%20day"
          secondaryLabel="Ask VI Concierge"
        />
      </div>
      <FishingExplorer />
    </>
  );
}
