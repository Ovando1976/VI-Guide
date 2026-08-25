import type { ReactNode } from "react";
import { Map } from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";
import { buildPublicPageLayoutMetadata } from "@/lib/public-page-metadata";

export const metadata = buildPublicPageLayoutMetadata({
  title: "USVI Heritage",
  description:
    "Explore historic places, cultural landscapes, maps, archives, and stories across the U.S. Virgin Islands.",
  path: "/heritage",
});

export default function HeritageLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="bg-[#032d2c] px-4 pt-5 sm:px-6 lg:pt-8">
        <ViPublicHeader
          actionHref="/map?filter=history"
          actionLabel="Heritage map"
          actionIcon={Map}
          secondaryHref="/concierge?context=heritage"
          secondaryLabel="Ask Heritage Guide"
        />
      </div>
      {children}
    </>
  );
}
