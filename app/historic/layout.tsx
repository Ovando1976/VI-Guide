import type { ReactNode } from "react";

import { buildPublicPageLayoutMetadata } from "@/lib/public-page-metadata";

export const metadata = buildPublicPageLayoutMetadata({
  title: "Historic Places & Sites",
  description:
    "Explore forts, estates, districts, archaeology, and cultural landscapes across the U.S. Virgin Islands with map, trip, and Concierge connections.",
  path: "/historic",
});

export default function HistoricLayout({ children }: { children: ReactNode }) {
  return children;
}
